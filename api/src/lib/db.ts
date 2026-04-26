import pg from 'pg';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function query<T = unknown>(text: string, params?: unknown[]) {
  const result = await pool.query(text, params as never);
  return result.rows as T[];
}
