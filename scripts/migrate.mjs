#!/usr/bin/env node
// 全マイグレーションを順次適用する
import { execSync } from 'node:child_process';
import { readdirSync } from 'node:fs';

const files = readdirSync('db/migrations')
  .filter((f) => f.endsWith('.sql'))
  .sort();

if (files.length === 0) {
  console.log('No migrations found.');
  process.exit(0);
}

for (const f of files) {
  process.stdout.write(`-> ${f} ... `);
  try {
    execSync(
      `docker compose exec -T postgres psql -U app -d surechigai -v ON_ERROR_STOP=1 -f /migrations/${f}`,
      { stdio: ['ignore', 'pipe', 'pipe'] },
    );
    console.log('OK');
  } catch (err) {
    console.error('FAILED');
    console.error(err.stderr?.toString() || err.message);
    process.exit(1);
  }
}
console.log('All migrations applied.');
