/**
 * Локальный прогон миграции в PGlite (без Docker). Проверяет синтаксис и логику FTS.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PGlite } from '@electric-sql/pglite';

const migrationPath = resolve(
  process.cwd(),
  'supabase/migrations/20260928120000_init_codes_articles.sql',
);

const sql = readFileSync(migrationPath, 'utf8');

const db = new PGlite();
await db.exec(sql);

const codes = await db.query('select count(*)::int as n from public.codes');
if (codes.rows[0].n !== 5) {
  throw new Error(`Expected 5 codes, got ${codes.rows[0].n}`);
}

const hits = await db.query(`select * from public.search_articles('кража', null, 10)`);
if (hits.rows.length === 0) {
  throw new Error('search_articles returned no rows for кража');
}

const tkHits = await db.query(
  `select * from public.search_articles('кража', array['tk'], 10)`,
);
if (tkHits.rows.length !== 0) {
  throw new Error('Expected 0 rows for tk filter');
}

const hasMark = hits.rows.some(
  (row) => typeof row.snippet === 'string' && row.snippet.includes('<mark>'),
);
if (!hasMark) {
  throw new Error('Expected <mark> in snippet');
}

console.log('test-migration-local: OK');
console.log(`  hits: ${hits.rows.length}, first: ${hits.rows[0].code_name} ${hits.rows[0].number}`);

await db.close();
