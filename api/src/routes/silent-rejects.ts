import { Hono } from 'hono';
import { z } from 'zod';
import { query } from '../lib/db.js';
import { requireUser } from '../lib/auth.js';

export const silentRejects = new Hono();

const schema = z.object({
  rejectedId: z.string().uuid(),
});

silentRejects.post('/', requireUser, async (c) => {
  const userId = c.get('userId');
  const body = schema.parse(await c.req.json());

  if (body.rejectedId === userId) {
    return c.json({ error: 'cannot reject self' }, 400);
  }

  await query(
    `INSERT INTO silent_rejects (rejector_id, rejected_id)
     VALUES ($1, $2)
     ON CONFLICT (rejector_id, rejected_id) DO NOTHING`,
    [userId, body.rejectedId],
  );

  return c.json({ ok: true });
});
