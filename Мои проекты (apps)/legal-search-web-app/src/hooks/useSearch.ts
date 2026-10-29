import { useCallback, useEffect, useRef, useState } from 'react';

import { searchArticles } from '../lib/api';
import { getCachedSearchResults, saveCachedSearchResults } from '../lib/searchCache';
import { ApiError } from '../lib/errors';
import type { Article } from '../types';

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

export type UseSearchResult = {
  results: Article[];
  loading: boolean;
  error: string | null;
  /** Поиск выполнен, ошибок нет, результатов 0 (запрос ≥ 2 символов). */
  isEmpty: boolean;
  /** Показаны результаты из локального кэша после сбоя сети. */
  isFromCache: boolean;
  retry: () => void;
};

function toErrorMessage(caught: unknown): string {
  if (caught instanceof ApiError) {
    return caught.message;
  }
  if (caught instanceof Error) {
    return caught.message;
  }
  return 'Не удалось выполнить поиск';
}

/**
 * Поиск статей с debounce, кэшем последних запросов и игнорированием устаревших ответов.
 */
export function useSearch(query: string, selectedCodes: string[]): UseSearchResult {
  const trimmed = query.trim();
  const isSearchable = trimmed.length >= MIN_QUERY_LENGTH;

  const [results, setResults] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);
  const [retryToken, setRetryToken] = useState(0);

  const requestIdRef = useRef(0);
  const codesKey = selectedCodes.join('\u0001');

  const retry = useCallback(() => {
    setRetryToken((token) => token + 1);
  }, []);

  useEffect(() => {
    if (!isSearchable) {
      requestIdRef.current += 1;
      return undefined;
    }

    const codeSlugs = selectedCodes;

    const timeoutId = setTimeout(() => {
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;

      setLoading(true);
      setError(null);
      setIsFromCache(false);

      void (async () => {
        try {
          const data = await searchArticles(trimmed, codeSlugs);
          if (requestId !== requestIdRef.current) {
            return;
          }
          setResults(data);
          setError(null);
          setIsFromCache(false);
          await saveCachedSearchResults(trimmed, codeSlugs, data);
        } catch (caught) {
          if (requestId !== requestIdRef.current) {
            return;
          }
          const cached = await getCachedSearchResults(trimmed, codeSlugs);
          if (cached !== null && cached.length > 0) {
            setResults(cached);
            setIsFromCache(true);
            setError('Нет подключения к сети. Показаны сохранённые результаты.');
          } else {
            setResults([]);
            setIsFromCache(false);
            setError(toErrorMessage(caught));
          }
        } finally {
          if (requestId === requestIdRef.current) {
            setLoading(false);
          }
        }
      })();
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timeoutId);
      requestIdRef.current += 1;
    };
  }, [trimmed, codesKey, isSearchable, selectedCodes, retryToken]);

  if (!isSearchable) {
    return {
      results: [],
      loading: false,
      error: null,
      isEmpty: false,
      isFromCache: false,
      retry,
    };
  }

  const isEmpty = !loading && error === null && results.length === 0;

  return { results, loading, error, isEmpty, isFromCache, retry };
}
