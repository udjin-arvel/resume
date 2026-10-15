/**
 * Локальная оценка размера JS-бандла (Metro export, Hermes не включён).
 * Запуск: node scripts/measure-js-bundle.mjs
 */
import { execSync } from 'node:child_process';
import { readdirSync, statSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const outDir = join(root, '.expo', 'bundle-size-check');

function formatBytes(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function dirSize(dir) {
  let total = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      total += dirSize(full);
    } else {
      total += statSync(full).size;
    }
  }
  return total;
}

rmSync(outDir, { recursive: true, force: true });

console.log('Экспорт Android-бандла (expo export)...');
execSync(`npx expo export --platform android --output-dir "${outDir}"`, {
  cwd: root,
  stdio: 'inherit',
});

const total = dirSize(outDir);
console.log('');
console.log(`Каталог экспорта: ${outDir}`);
console.log(`Суммарный размер артефактов: ${formatBytes(total)}`);
console.log('');
console.log(
  'Подсказка: используйте именованные импорты (@expo/vector-icons и т.д.) — Metro tree-shake неиспользуемый код.',
);
console.log('В Expo SDK 57 Hermes используется по умолчанию в release-сборках EAS.');
