/**
 * Smoke-проверка конфигурации сборки (Этап 9).
 * Запуск: node scripts/validate-build-config.mjs
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');

function readJson(relativePath) {
  const fullPath = join(root, relativePath);
  return JSON.parse(readFileSync(fullPath, 'utf8'));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const app = readJson('app.json').expo;
const eas = readJson('eas.json');

assert(typeof app.name === 'string' && app.name.length > 0, 'app.json: expo.name обязателен');
assert(app.slug === 'legal-search', 'app.json: slug должен быть legal-search');
assert(app.version, 'app.json: expo.version обязателен');
assert(app.icon, 'app.json: expo.icon обязателен');
const splashPlugin = app.plugins?.find(
  (entry) => Array.isArray(entry) && entry[0] === 'expo-splash-screen',
);
assert(splashPlugin?.[1]?.image, 'app.json: плагин expo-splash-screen с image обязателен');
assert(
  app.ios?.bundleIdentifier === 'com.legalsearch.app',
  'app.json: ios.bundleIdentifier',
);
assert(app.android?.package === 'com.legalsearch.app', 'app.json: android.package');

const profiles = eas.build;
for (const name of ['development', 'preview', 'production']) {
  assert(profiles[name], `eas.json: профиль "${name}" отсутствует`);
}

assert(profiles.development.developmentClient === true, 'development: нужен developmentClient');
assert(profiles.preview.distribution === 'internal', 'preview: distribution internal');
assert(profiles.preview.android?.buildType === 'apk', 'preview: Android APK');
assert(
  profiles.production.android?.buildType === 'app-bundle',
  'production: Android AAB',
);

console.log('validate-build-config: OK');
