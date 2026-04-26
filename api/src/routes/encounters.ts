import { Hono } from 'hono';
import { z } from 'zod';
import { pool, query } from '../lib/db.js';
import { requireUser } from '../lib/auth.js';
import { calcStage, filterByStage, type UserPublic } from '../lib/stage.js';
import { distanceMeters, HOME_PROTECT_RADIUS_M } from '../lib/geo.js';
import { sseHub } from '../lib/sse.js';

export const encounters = new Hono();

const recordSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  otherUserIds: z.array(z.string().uuid()).max(50),
});

function pairKey(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

encounters.post('/', requireUser, async (c) => {
  const userId = c.get('userId');
  const body = recordSchema.parse(await c.req.json());

  const meRows = await query<{ home_lat: string | null; home_lng: string | null }>(
    `SELECT home_lat, home_lng FROM users WHERE id = $1`,
    [userId],
  );
  if (meRows.length === 0) return c.json({ error: 'user not found' }, 404);

  const me = meRows[0]!;
  if (me.home_lat !== null && me.home_lng !== null) {
    const d = distanceMeters(
      body.lat,
      body.lng,
      Number(me.home_lat),
      Number(me.home_lng),
    );
    if (d <= HOME_PROTECT_RADIUS_M) {
      return c.json({ skipped: true, reason: 'home_protected', encounters: [] });
    }
  }

  const recorded: { encounterId: string; partnerId: string; count: number; expired: boolean }[] = [];

  for (const otherId of body.otherUserIds) {
    if (otherId === userId) continue;

    const rejectRows = await query(
      `SELECT 1 FROM silent_rejects
       WHERE (rejector_id = $1 AND rejected_id = $2)
          OR (rejector_id = $2 AND rejected_id = $1)
       LIMIT 1`,
      [userId, otherId],
    );
    if (rejectRows.length > 0) continue;

    const partnerRows = await query<{ home_lat: string | null; home_lng: string | null }>(
      `SELECT home_lat, home_lng FROM users WHERE id = $1`,
      [otherId],
    );
    if (partnerRows.length === 0) continue;
    const partner = partnerRows[0]!;
    if (partner.home_lat !== null && partner.home_lng !== null) {
      const d = distanceMeters(
        body.lat,
        body.lng,
        Number(partner.home_lat),
        Number(partner.home_lng),
      );
      if (d <= HOME_PROTECT_RADIUS_M) continue;
    }

    const [a, b] = pairKey(userId, otherId);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const existing = await client.query<{
        id: string;
        count: number;
        is_past: boolean;
      }>(
        `SELECT id, count, (last_counted_date < CURRENT_DATE) AS is_past
         FROM encounters
         WHERE user_a_id = $1 AND user_b_id = $2
         FOR UPDATE`,
        [a, b],
      );

      let encounterId: string;
      let newCount: number;
      let expired = false;

      if (existing.rows.length === 0) {
        const inserted = await client.query<{ id: string }>(
          `INSERT INTO encounters (user_a_id, user_b_id, count, last_encountered_at, last_counted_date)
           VALUES ($1, $2, 1, NOW(), CURRENT_DATE)
           RETURNING id`,
          [a, b],
        );
        encounterId = inserted.rows[0]!.id;
        newCount = 1;
      } else {
        const row = existing.rows[0]!;
        encounterId = row.id;

        if (!row.is_past) {
          // 同日内 → カウント据え置き（同日丸め）
          newCount = row.count;
        } else {
          newCount = row.count + 1;
          await client.query(
            `UPDATE encounters
             SET count = $1, last_encountered_at = NOW(), last_counted_date = CURRENT_DATE
             WHERE id = $2`,
            [newCount, encounterId],
          );

          if (row.count === 3 && newCount === 4) {
            const expiredResult = await client.query(
              `UPDATE agreements
               SET expired_at = NOW()
               WHERE encounter_id = $1
                 AND unlocked_at IS NULL
                 AND expired_at IS NULL
               RETURNING id`,
              [encounterId],
            );
            if (expiredResult.rows.length > 0) {
              expired = true;
            }
          }
        }
      }

      await client.query('COMMIT');
      recorded.push({ encounterId, partnerId: otherId, count: newCount, expired });

      sseHub.publish(otherId, 'encounter:updated', { encounterId, count: newCount });
      sseHub.publish(userId, 'encounter:updated', { encounterId, count: newCount });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  return c.json({ encounters: recorded });
});

encounters.get('/', requireUser, async (c) => {
  const userId = c.get('userId');
  const rows = await query<{
    encounter_id: string;
    count: number;
    last_encountered_at: string;
    partner_id: string;
    nickname: string;
    icon_url: string | null;
    profile_summary: string | null;
    profile_detail: string | null;
    user_a_agreed_at: string | null;
    user_b_agreed_at: string | null;
    unlocked_at: string | null;
    expired_at: string | null;
    is_user_a: boolean;
  }>(
    `SELECT
       e.id AS encounter_id,
       e.count,
       e.last_encountered_at,
       CASE WHEN e.user_a_id = $1 THEN e.user_b_id ELSE e.user_a_id END AS partner_id,
       u.nickname, u.icon_url, u.profile_summary, u.profile_detail,
       a.user_a_agreed_at, a.user_b_agreed_at, a.unlocked_at, a.expired_at,
       (e.user_a_id = $1) AS is_user_a
     FROM encounters e
     JOIN users u ON u.id = CASE WHEN e.user_a_id = $1 THEN e.user_b_id ELSE e.user_a_id END
     LEFT JOIN agreements a ON a.encounter_id = e.id
     WHERE (e.user_a_id = $1 OR e.user_b_id = $1)
       AND NOT EXISTS (
         SELECT 1 FROM silent_rejects sr
         WHERE sr.rejector_id = $1
           AND sr.rejected_id = CASE WHEN e.user_a_id = $1 THEN e.user_b_id ELSE e.user_a_id END
       )
     ORDER BY e.last_encountered_at DESC`,
    [userId],
  );

  const result = rows.map((r) => {
    const unlocked = r.unlocked_at !== null;
    const stage = calcStage({ count: r.count, unlocked });
    const partner: UserPublic = {
      id: r.partner_id,
      nickname: r.nickname,
      iconUrl: r.icon_url,
      profileSummary: r.profile_summary,
      profileDetail: r.profile_detail,
    };
    const myAgreedAt = r.is_user_a ? r.user_a_agreed_at : r.user_b_agreed_at;
    const partnerAgreedAt = r.is_user_a ? r.user_b_agreed_at : r.user_a_agreed_at;
    return {
      encounterId: r.encounter_id,
      count: r.count,
      lastEncounteredAt: r.last_encountered_at,
      partner: filterByStage(stage, partner),
      agreement: {
        myAgreedAt,
        partnerAgreedAt,
        unlockedAt: r.unlocked_at,
        expiredAt: r.expired_at,
      },
    };
  });

  return c.json({ encounters: result });
});
