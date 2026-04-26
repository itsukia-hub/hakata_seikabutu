import type { MiddlewareHandler } from 'hono';

declare module 'hono' {
  interface ContextVariableMap {
    userId: string;
  }
}

export const requireUser: MiddlewareHandler = async (c, next) => {
  const userId = c.req.header('x-user-id');
  if (!userId) {
    return c.json({ error: 'X-User-Id header required' }, 401);
  }
  c.set('userId', userId);
  await next();
};
