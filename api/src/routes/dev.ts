import { Hono } from 'hono';
import { pool, query } from '../lib/db.js';
import { requireUser } from '../lib/auth.js';

export const dev = new Hono();

interface SampleConfig {
  nickname: string;
  daysAgo: number;
  hoursAgo?: number;
  count: number;
  agreement?: 'mine_only' | 'mutual' | 'expired';
}

// 各サンプル相手と新規ユーザーの間に生成するすれ違い状態
const SAMPLE_CONFIGS: SampleConfig[] = [
  { nickname: 'Carol', daysAgo: 0, hoursAgo: 2, count: 5, agreement: 'mutual' },
  { nickname: 'Bob', daysAgo: 1, count: 3 },
  { nickname: 'Emma', daysAgo: 2, count: 1 },
  { nickname: 'David', daysAgo: 3, count: 2 },
  { nickname: 'Fiona', daysAgo: 5, count: 4, agreement: 'expired' },
  { nickname: 'Harry', daysAgo: 12, count: 3 },
  { nickname: 'Ivy', daysAgo: 28, count: 1 },
];

dev.post('/seed-encounters', requireUser, async (c) => {
  if (process.env.NODE_ENV === 'production') {
    return c.json({ error: 'disabled in production' }, 403);
  }

  const userId = c.get('userId');

  // 自分のユーザーが存在することを確認
  const meRows = await query<{ id: string }>(`SELECT id FROM users WHERE id = $1`, [userId]);
  if (meRows.length === 0) return c.json({ error: 'user not found' }, 404);

  // サンプル相手を nickname で引く
  const samples = await query<{ id: string; nickname: string }>(
    `SELECT id, nickname FROM users WHERE is_sample = true`,
  );
  const byNick = new Map(samples.map((s) => [s.nickname, s.id]));

  const generated: string[] = [];
  const skipped: string[] = [];

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const config of SAMPLE_CONFIGS) {
      const partnerId = byNick.get(config.nickname);
      if (!partnerId) {
        skipped.push(`${config.nickname}: sample partner not found`);
        continue;
      }
      if (partnerId === userId) continue;

      const [a, b] = userId < partnerId ? [userId, partnerId] : [partnerId, userId];

      // 既存 encounter があればスキップ
      const existing = await client.query(
        `SELECT id FROM encounters WHERE user_a_id = $1 AND user_b_id = $2`,
        [a, b],
      );
      if (existing.rows.length > 0) {
        skipped.push(`${config.nickname}: already exists`);
        continue;
      }

      const totalHours = config.daysAgo * 24 + (config.hoursAgo ?? 0);
      const intervalSql = `${totalHours} hours`;

      // encounter を投入
      const encInsert = await client.query<{ id: string }>(
        `INSERT INTO encounters (user_a_id, user_b_id, count, last_encountered_at, last_counted_date)
         VALUES ($1, $2, $3, NOW() - INTERVAL '${intervalSql}', CURRENT_DATE - INTERVAL '${Math.max(0, config.daysAgo)} days')
         RETURNING id`,
        [a, b, config.count],
      );
      const encounterId = encInsert.rows[0]!.id;

      // 合意状態を必要に応じて作る
      if (config.agreement === 'mutual') {
        // 双方合意済み
        const isUserA = a === userId;
        await client.query(
          `INSERT INTO agreements (encounter_id, user_a_agreed_at, user_b_agreed_at, unlocked_at)
           VALUES ($1,
                   NOW() - INTERVAL '${intervalSql}' + INTERVAL '5 minutes',
                   NOW() - INTERVAL '${intervalSql}' + INTERVAL '6 minutes',
                   NOW() - INTERVAL '${intervalSql}' + INTERVAL '6 minutes')`,
          [encounterId],
        );
        // isUserA は使わなくても、両方ともセットしているので OK
        void isUserA;
      } else if (config.agreement === 'expired') {
        // 自分側のみ合意 → 4回目で期限切れ
        const myColumn = a === userId ? 'user_a_agreed_at' : 'user_b_agreed_at';
        await client.query(
          `INSERT INTO agreements (encounter_id, ${myColumn}, expired_at)
           VALUES ($1,
                   NOW() - INTERVAL '${intervalSql}' + INTERVAL '1 hour',
                   NOW() - INTERVAL '${intervalSql}' + INTERVAL '12 hours')`,
          [encounterId],
        );
      }

      generated.push(config.nickname);
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  return c.json({ ok: true, generated, skipped });
});
