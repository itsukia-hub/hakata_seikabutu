import { Hono } from 'hono';
import { query } from '../lib/db.js';

export const health = new Hono();

health.get('/', (c) => c.json({ ok: true }));

health.get('/db', async (c) => {
  try {
    const rows = await query<{ now: string }>('SELECT NOW() AS now');
    return c.json({ ok: true, now: rows[0]?.now });
  } catch (err) {
    return c.json({ ok: false, error: (err as Error).message }, 500);
  }
});
