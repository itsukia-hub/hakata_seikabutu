import { Hono } from 'hono';
import { z } from 'zod';
import { query } from '../lib/db.js';
import { requireUser } from '../lib/auth.js';

export const users = new Hono();

const createSchema = z.object({
  nickname: z.string().min(1).max(40),
  iconUrl: z.string().url().nullable().optional(),
  profileSummary: z.string().max(200).nullable().optional(),
  profileDetail: z.string().max(2000).nullable().optional(),
});

users.post('/', async (c) => {
  const body = createSchema.parse(await c.req.json());
  const rows = await query<{ id: string; nickname: string; created_at: string }>(
    `INSERT INTO users (nickname, icon_url, profile_summary, profile_detail)
     VALUES ($1, $2, $3, $4)
     RETURNING id, nickname, created_at`,
    [
      body.nickname,
      body.iconUrl ?? null,
      body.profileSummary ?? null,
      body.profileDetail ?? null,
    ],
  );
  return c.json(rows[0], 201);
});

users.get('/me', requireUser, async (c) => {
  const userId = c.get('userId');
  const rows = await query<{
    id: string;
    nickname: string;
    icon_url: string | null;
    profile_summary: string | null;
    profile_detail: string | null;
    home_lat: string | null;
    home_lng: string | null;
  }>(
    `SELECT id, nickname, icon_url, profile_summary, profile_detail, home_lat, home_lng
     FROM users WHERE id = $1`,
    [userId],
  );
  if (rows.length === 0) return c.json({ error: 'not found' }, 404);
  return c.json(rows[0]);
});

const homeSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

users.patch('/me/home', requireUser, async (c) => {
  const userId = c.get('userId');
  const body = homeSchema.parse(await c.req.json());
  await query(`UPDATE users SET home_lat = $1, home_lng = $2 WHERE id = $3`, [
    body.lat,
    body.lng,
    userId,
  ]);
  return c.json({ ok: true });
});
