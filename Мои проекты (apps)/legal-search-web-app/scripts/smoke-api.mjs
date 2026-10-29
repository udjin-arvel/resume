/**
 * Smoke-проверка этапа 3: типы и API-слой (REST, без bundler).
 * Запуск: node scripts/smoke-api.mjs
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
    // .env optional
  }
}

loadEnvFile();

const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  'Content-Type': 'application/json',
};

async function rpc(name, body) {
  const res = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`RPC ${name} ${res.status}: ${text}`);
  }
  return text ? JSON.parse(text) : null;
}

async function main() {
  const results = await rpc('search_articles', { q: 'кража', code_slugs: [], lim: 30 });
  if (!Array.isArray(results)) {
    throw new Error('search_articles did not return an array');
  }
  console.log(`searchArticles('кража', []): ${results.length} row(s)`);
  if (results.length > 0) {
    console.log('first:', JSON.stringify(results[0], null, 2));
  }

  const codesRes = await fetch(`${url}/rest/v1/codes?select=id,slug,name,full_name&order=sort_order.asc`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  const codes = await codesRes.json();
  console.log(`getCodes(): ${codes.length} code(s)`);

  if (results.length > 0) {
    const articleId = results[0].id;
    const articleRes = await fetch(
      `${url}/rest/v1/articles?select=id,number,title,chapter,text,updated_at,codes(slug,name)&id=eq.${articleId}`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } },
    );
    const articles = await articleRes.json();
    console.log(`getArticle(${articleId}):`, articles[0]?.title ?? 'not found');
  }

  console.log('smoke-api: OK');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
