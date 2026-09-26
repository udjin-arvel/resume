import type { MouseEvent, ReactNode } from "react";
import { useCallback, useState } from "react";
import { useDocumentAccessUrl } from "@/hooks/useDocumentAccessUrl";
import {
  fetchDocumentAccessUrl,
  resolveDocumentUrl,
  type DocumentAccessURL,
  type DocumentDisposition,
} from "@/lib/api/documents";
import { parseApiError } from "@/lib/api/client";
import { preferredDisposition } from "@/lib/document-access";
import { showError } from "@/lib/toast";
import { cn } from "@/lib/utils";

type DocumentImageProps = {
  documentId: string;
  alt: string;
  className?: string;
  fallback?: ReactNode;
};

export function DocumentImage({ documentId, alt, className, fallback = null }: DocumentImageProps) {
  const { url, refresh } = useDocumentAccessUrl(documentId, "inline");
  const [retried, setRetried] = useState(false);

  if (!url) {
    return <>{fallback}</>;
  }

  return (
    <img
      src={url}
      alt={alt}
      className={className}
      onError={() => {
        if (retried) return;
        setRetried(true);
        void refresh();
      }}
    />
  );
}

function openInNewTab(url: string) {
  // Prefer an <a target="_blank"> click over window.open(..., "noopener"):
  // with noopener, window.open often returns null even when the tab opened,
  // which previously triggered a same-tab navigation fallback.
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";
  anchor.click();
}

async function openViaAccessUrl(
  documentId: string,
  disposition?: DocumentDisposition,
): Promise<DocumentAccessURL> {
  const access = await fetchDocumentAccessUrl(documentId, disposition);
  const url = resolveDocumentUrl(access.url);

  if (access.disposition === "attachment") {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = access.filename;
    anchor.rel = "noopener noreferrer";
    anchor.click();
    return access;
  }

  openInNewTab(url);
  return access;
}

type DocumentOpenButtonProps = {
  documentId: string;
  filename?: string;
  mimeType?: string;
  className?: string;
  children: ReactNode;
};

export function DocumentOpenButton({
  documentId,
  mimeType,
  className,
  children,
}: DocumentOpenButtonProps) {
  const handleOpen = () => {
    const disposition = mimeType ? preferredDisposition(mimeType) : undefined;
    void openViaAccessUrl(documentId, disposition).catch((err) => showError(parseApiError(err)));
  };

  return (
    <button type="button" onClick={handleOpen} className={cn("text-left", className)}>
      {children}
    </button>
  );
}

type DocumentOpenLinkProps = {
  documentId: string;
  filename?: string;
  mimeType?: string;
  className?: string;
  children: ReactNode;
};

export function DocumentOpenLink({
  documentId,
  filename,
  mimeType,
  className,
  children,
}: DocumentOpenLinkProps) {
  const [access, setAccess] = useState<DocumentAccessURL | null>(null);
  const [loading, setLoading] = useState(false);

  const ensureAccess = useCallback(async () => {
    if (access) return access;
    setLoading(true);
    try {
      const disposition = mimeType ? preferredDisposition(mimeType) : undefined;
      const next = await fetchDocumentAccessUrl(documentId, disposition);
      setAccess(next);
      return next;
    } finally {
      setLoading(false);
    }
  }, [access, documentId, mimeType]);

  const prefetch = () => {
    if (access || loading) return;
    void ensureAccess().catch(() => {
      /* prefetch failures are ignored; click will surface the error */
    });
  };

  const href = access ? resolveDocumentUrl(access.url) : undefined;
  const isAttachment = access?.disposition === "attachment";

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (href) {
      if (isAttachment) {
        // Same-origin signed URL: force download without opening a blank tab.
        event.preventDefault();
        const anchor = document.createElement("a");
        anchor.href = href;
        anchor.download = access?.filename ?? filename ?? "file";
        anchor.rel = "noopener noreferrer";
        anchor.click();
      }
      return;
    }

    event.preventDefault();
    void ensureAccess()
      .then((next) => {
        const url = resolveDocumentUrl(next.url);
        if (next.disposition === "attachment") {
          const anchor = document.createElement("a");
          anchor.href = url;
          anchor.download = next.filename;
          anchor.rel = "noopener noreferrer";
          anchor.click();
          return;
        }
        openInNewTab(url);
      })
      .catch((err) => showError(parseApiError(err)));
  };

  return (
    <a
      href={href ?? `#document-${documentId}`}
      target={isAttachment ? undefined : "_blank"}
      rel="noopener noreferrer"
      download={isAttachment ? (access?.filename ?? filename) : undefined}
      onMouseEnter={prefetch}
      onFocus={prefetch}
      onClick={handleClick}
      className={className}
    >
      {children}
    </a>
  );
}

export { openViaAccessUrl as openDocument };
