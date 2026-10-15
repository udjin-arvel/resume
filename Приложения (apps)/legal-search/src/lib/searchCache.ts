import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Article } from '../types';

const STORAGE_KEY = 'legal-search-query-cache';
const MAX_ENTRIES = 20;

export type CachedSearchEntry = {
  query: string;
  codeSlugs: string[];
  results: Article[];
  savedAt: string;
};

function normalizeSlugs(codeSlugs: string[]): string[] {
  return [...codeSlugs].sort();
}

function entryKey(query: string, codeSlugs: string[]): string {
  const normalizedQuery = query.trim().toLowerCase();
  const slugs = normalizeSlugs(codeSlugs).join('\u0002');
  return `${normalizedQuery}\u0001${slugs}`;
}

async function readAll(): Promise<CachedSearchEntry[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as CachedSearchEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeAll(entries: CachedSearchEntry[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

/** Последние сохранённые результаты для пары запрос + фильтры кодексов. */
export async function getCachedSearchResults(
  query: string,
  codeSlugs: string[],
): Promise<Article[] | null> {
  const key = entryKey(query, codeSlugs);
  const entries = await readAll();
  const match = entries.find(
    (entry) => entryKey(entry.query, entry.codeSlugs) === key,
  );
  return match?.results ?? null;
}

/** Сохраняет успешную выдачу (FIFO, не более 20 записей). */
export async function saveCachedSearchResults(
  query: string,
  codeSlugs: string[],
  results: Article[],
): Promise<void> {
  const key = entryKey(query, codeSlugs);
  const entries = await readAll().then((list) =>
    list.filter((entry) => entryKey(entry.query, entry.codeSlugs) !== key),
  );

  const next: CachedSearchEntry = {
    query: query.trim(),
    codeSlugs: normalizeSlugs(codeSlugs),
    results,
    savedAt: new Date().toISOString(),
  };

  const merged = [next, ...entries].slice(0, MAX_ENTRIES);
  await writeAll(merged);
}
