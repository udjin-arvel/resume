/**
 * Проверка RPC search_articles после применения миграции этапа 1.
 * Запуск: node scripts/verify-stage1.mjs
 * Нужны EXPO_PUBLIC_SUPABASE_URL и EXPO_PUBLIC_SUPABASE_ANON_KEY в окружении или .env.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function loadEnvFile() {
  try {
    const raw = readFileSync(resolve(process.cwd(), '.env'), 'utf8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  } catch {
    // .env optional if vars already exported
  }
}

loadEnvFile();

const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

async function rpc(name, body) {
  const res = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`${name} HTTP ${res.status}: ${text}`);
  }
  return text ? JSON.parse(text) : null;
}

async function main() {
  const all = await rpc('search_articles', { q: 'кража', code_slugs: null, lim: 10 });
  if (!Array.isArray(all) || all.length === 0) {
    throw new Error('search_articles(кража, null, 10) returned no rows');
  }

  const tkOnly = await rpc('search_articles', {
    q: 'кража',
    code_slugs: ['tk'],
    lim: 10,
  });
  if (!Array.isArray(tkOnly) || tkOnly.length !== 0) {
    throw new Error('search_articles with tk filter should return 0 rows');
  }

  const codesRes = await fetch(`${url}/rest/v1/codes?select=id`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  const codesText = await codesRes.text();
  if (!codesRes.ok) {
    throw new Error(`codes HTTP ${codesRes.status}: ${codesText}`);
  }
  const codes = JSON.parse(codesText);
  if (!Array.isArray(codes) || codes.length !== 5) {
    throw new Error(`Expected 5 codes, got ${Array.isArray(codes) ? codes.length : 'non-array'}`);
  }

  const hasMark = all.some(
    (row) => typeof row.snippet === 'string' && row.snippet.includes('<mark>'),
  );
  if (!hasMark) {
    throw new Error('Expected at least one snippet with <mark>');
  }

  console.log('verify-stage1: OK');
  console.log(`  search hits: ${all.length}`);
  console.log(`  sample: ${all[0].code_name} ст. ${all[0].number} — ${all[0].title}`);
}

main().catch((err) => {
  console.error('verify-stage1: FAILED');
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
