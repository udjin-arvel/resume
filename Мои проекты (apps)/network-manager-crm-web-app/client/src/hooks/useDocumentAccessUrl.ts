import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchDocumentAccessUrl,
  resolveDocumentUrl,
  type DocumentAccessURL,
  type DocumentDisposition,
} from "@/lib/api/documents";

const REFRESH_MARGIN_MS = 60_000;

type UseDocumentAccessUrlResult = {
  url: string | null;
  access: DocumentAccessURL | null;
  isLoading: boolean;
  error: unknown;
  refresh: () => Promise<void>;
};

export function useDocumentAccessUrl(
  documentId?: string,
  disposition: DocumentDisposition = "inline",
): UseDocumentAccessUrlResult {
  const [access, setAccess] = useState<DocumentAccessURL | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const refreshTimer = useRef<number | null>(null);
  const requestId = useRef(0);

  const clearRefreshTimer = () => {
    if (refreshTimer.current != null) {
      window.clearTimeout(refreshTimer.current);
      refreshTimer.current = null;
    }
  };

  const load = useCallback(async () => {
    if (!documentId) {
      setAccess(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    const id = ++requestId.current;
    setIsLoading(true);
    setError(null);

    try {
      const next = await fetchDocumentAccessUrl(documentId, disposition);
      if (id !== requestId.current) return;
      setAccess(next);

      clearRefreshTimer();
      const expiresAt = Date.parse(next.expiresAt);
      if (!Number.isNaN(expiresAt)) {
        const delay = Math.max(expiresAt - Date.now() - REFRESH_MARGIN_MS, 5_000);
        refreshTimer.current = window.setTimeout(() => {
          void load();
        }, delay);
      }
    } catch (err) {
      if (id !== requestId.current) return;
      setError(err);
      setAccess(null);
    } finally {
      if (id === requestId.current) setIsLoading(false);
    }
  }, [documentId, disposition]);

  useEffect(() => {
    void load();
    return () => {
      requestId.current += 1;
      clearRefreshTimer();
    };
  }, [load]);

  return {
    url: access ? resolveDocumentUrl(access.url) : null,
    access,
    isLoading,
    error,
    refresh: load,
  };
}
