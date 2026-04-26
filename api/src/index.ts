import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { health } from './routes/health.js';
import { users } from './routes/users.js';
import { encounters } from './routes/encounters.js';
import { agreements } from './routes/agreements.js';
import { silentRejects } from './routes/silent-rejects.js';
import { auth } from './routes/auth.js';
import { dev } from './routes/dev.js';

const app = new Hono();

app.use('*', logger());
app.use(
  '*',
  cors({
    origin: (origin) => origin ?? '*',
    allowHeaders: ['Content-Type', 'X-User-Id'],
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  }),
);

app.route('/health', health);
app.route('/api/users', users);
app.route('/api/encounters', encounters);
app.route('/api/agreements', agreements);
app.route('/api/silent-rejects', silentRejects);
app.route('/api/auth', auth);

// 開発モードのみ有効（本番では NODE_ENV チェックで 403）
if (process.env.NODE_ENV !== 'production') {
  app.route('/api/dev', dev);
}

app.onError((err, c) => {
  console.error('[api] error:', err);
  if (err.name === 'ZodError') {
    return c.json({ error: 'validation_failed', detail: err.message }, 400);
  }
  return c.json({ error: 'internal_error', message: err.message }, 500);
});

const port = Number(process.env.PORT ?? 8787);

const server = serve({ fetch: app.fetch, port }, (info) => {
  console.log(`[api] listening on http://localhost:${info.port}`);
});

const shutdown = (signal: string) => {
  console.log(`[api] received ${signal}, closing...`);
  server.close((err) => {
    if (err) {
      console.error('[api] close error:', err);
      process.exit(1);
    }
    process.exit(0);
  });
  setTimeout(() => process.exit(0), 3000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
