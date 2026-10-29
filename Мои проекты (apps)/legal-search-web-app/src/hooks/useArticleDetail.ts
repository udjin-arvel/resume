import { useCallback, useEffect, useState } from 'react';

import { getArticle } from '../lib/api';
import { ApiError } from '../lib/errors';
import type { ArticleFull } from '../types';

type UseArticleDetailResult = {
  article: ArticleFull | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
};

/** Загрузка полной статьи по id с повтором при ошибке. */
export function useArticleDetail(id: number): UseArticleDetailResult {
  const [article, setArticle] = useState<ArticleFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getArticle(id);
        if (!cancelled) {
          setArticle(data);
        }
      } catch (err) {
        if (!cancelled) {
          setArticle(null);
          if (err instanceof ApiError) {
            setError(err.message);
          } else {
            setError('Не удалось загрузить статью');
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, reloadToken]);

  const retry = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  return { article, loading, error, retry };
}
