import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { pool, query } from '../lib/db.js';
import { requireUser } from '../lib/auth.js';
import { sseHub } from '../lib/sse.js';

export const agreements = new Hono();

agreements.post('/:encounterId/agree', requireUser, async (c) => {
  const userId = c.get('userId');
  const encounterId = c.req.param('encounterId');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const encRows = await client.query<{
      user_a_id: string;
      user_b_id: string;
      count: number;
    }>(
      `SELECT user_a_id, user_b_id, count FROM encounters WHERE id = $1 FOR UPDATE`,
      [encounterId],
    );
    if (encRows.rows.length === 0) {
      await client.query('ROLLBACK');
      return c.json({ error: 'encounter not found' }, 404);
    }
    const enc = encRows.rows[0]!;
    if (enc.user_a_id !== userId && enc.user_b_id !== userId) {
      await client.query('ROLLBACK');
      return c.json({ error: 'forbidden' }, 403);
    }
    if (enc.count < 3) {
      await client.query('ROLLBACK');
      return c.json({ error: 'approach not unlocked yet' }, 400);
    }

    const isUserA = enc.user_a_id === userId;
    const partnerId = isUserA ? enc.user_b_id : enc.user_a_id;
    const myColumn = isUserA ? 'user_a_agreed_at' : 'user_b_agreed_at';

    const existing = await client.query<{
      id: string;
      user_a_agreed_at: string | null;
      user_b_agreed_at: string | null;
      unlocked_at: string | null;
      expired_at: string | null;
    }>(
      `SELECT id, user_a_agreed_at, user_b_agreed_at, unlocked_at, expired_at
       FROM agreements WHERE encounter_id = $1 FOR UPDATE`,
      [encounterId],
    );

    if (existing.rows.length > 0 && existing.rows[0]!.expired_at !== null) {
      await client.query('ROLLBACK');
      return c.json({ error: 'agreement window expired' }, 400);
    }

    let agreementId: string;
    let userAAgreedAt: string | null;
    let userBAgreedAt: string | null;

    if (existing.rows.length === 0) {
      const inserted = await client.query<{
        id: string;
        user_a_agreed_at: string | null;
        user_b_agreed_at: string | null;
      }>(
        `INSERT INTO agreements (encounter_id, ${myColumn})
         VALUES ($1, NOW())
         RETURNING id, user_a_agreed_at, user_b_agreed_at`,
        [encounterId],
      );
      agreementId = inserted.rows[0]!.id;
      userAAgreedAt = inserted.rows[0]!.user_a_agreed_at;
      userBAgreedAt = inserted.rows[0]!.user_b_agreed_at;
    } else {
      const updated = await client.query<{
        id: string;
        user_a_agreed_at: string | null;
        user_b_agreed_at: string | null;
      }>(
        `UPDATE agreements SET ${myColumn} = COALESCE(${myColumn}, NOW())
         WHERE encounter_id = $1
         RETURNING id, user_a_agreed_at, user_b_agreed_at`,
        [encounterId],
      );
      agreementId = updated.rows[0]!.id;
      userAAgreedAt = updated.rows[0]!.user_a_agreed_at;
      userBAgreedAt = updated.rows[0]!.user_b_agreed_at;
    }

    let unlockedAt: string | null = existing.rows[0]?.unlocked_at ?? null;
    if (userAAgreedAt && userBAgreedAt && !unlockedAt) {
      const unlocked = await client.query<{ unlocked_at: string }>(
        `UPDATE agreements SET unlocked_at = NOW()
         WHERE id = $1 AND unlocked_at IS NULL
         RETURNING unlocked_at`,
        [agreementId],
      );
      unlockedAt = unlocked.rows[0]?.unlocked_at ?? null;
    }

    await client.query('COMMIT');

    const payload = {
      encounterId,
      agreementId,
      userAAgreedAt,
      userBAgreedAt,
      unlockedAt,
    };
    sseHub.publish(partnerId, 'agreement:updated', payload);
    sseHub.publish(userId, 'agreement:updated', payload);

    return c.json(payload);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

agreements.get('/stream', requireUser, (c) => {
  const userId = c.get('userId');
  return streamSSE(c, async (stream) => {
    let unsubscribe: (() => void) | null = null;
    const closed = new Promise<void>((resolve) => {
      stream.onAbort(() => {
        unsubscribe?.();
        resolve();
      });
    });

    unsubscribe = sseHub.subscribe(userId, (event) => {
      void stream.writeSSE({
        event: event.type,
        data: JSON.stringify(event.data),
      });
    });

    await stream.writeSSE({ event: 'ready', data: JSON.stringify({ userId }) });

    const ping = setInterval(() => {
      void stream.writeSSE({ event: 'ping', data: JSON.stringify({ t: Date.now() }) });
    }, 25_000);

    await closed;
    clearInterval(ping);
  });
});
