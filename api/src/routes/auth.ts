import { Hono } from 'hono';
import { z } from 'zod';
import { query } from '../lib/db.js';

export const auth = new Hono();

const recoverSchema = z.object({
  recoveryCode: z.string().min(8).max(64),
});

// 復元コードによるアカウント引き継ぎ
auth.post('/recover', async (c) => {
  const body = recoverSchema.parse(await c.req.json());
  const code = body.recoveryCode.trim().toLowerCase();

  const rows = await query<{ id: string; nickname: string }>(
    `SELECT id, nickname FROM users WHERE LOWER(recovery_code) = $1`,
    [code],
  );

  if (rows.length === 0) {
    return c.json({ error: 'invalid recovery code' }, 404);
  }

  return c.json(rows[0]);
});
