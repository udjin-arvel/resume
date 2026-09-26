import { apiClient } from "./client";
import { documentAccessUrlSchema, documentSchema } from "./schemas";
import { z } from "zod";

export type DocumentListQuery = {
  entityType?: string;
  entityId?: string;
  ownerId?: string;
};

export type DocumentDisposition = "inline" | "attachment";

export type DocumentAccessURL = z.infer<typeof documentAccessUrlSchema>;

export async function fetchDocuments(query: DocumentListQuery = {}) {
  const { data } = await apiClient.get("/documents", { params: query });
  return z.array(documentSchema).parse(data);
}

export async function uploadDocument(formData: FormData) {
  const { data } = await apiClient.post("/documents/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return documentSchema.parse(data);
}

export async function replaceDocument(id: string, formData: FormData) {
  const { data } = await apiClient.put(`/documents/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return documentSchema.parse(data);
}

export async function deleteDocument(id: string) {
  await apiClient.delete(`/documents/${id}`);
}

export async function fetchDocumentAccessUrl(
  id: string,
  disposition?: DocumentDisposition,
): Promise<DocumentAccessURL> {
  const { data } = await apiClient.get(`/documents/${id}/access-url`, {
    params: disposition ? { disposition } : undefined,
  });
  return documentAccessUrlSchema.parse(data);
}

/** Resolve API-relative document file path to a browser-usable URL. */
export function resolveDocumentUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;

  if (path.startsWith("/")) {
    const apiBase = import.meta.env.VITE_API_URL as string | undefined;
    if (apiBase && /^https?:\/\//i.test(apiBase)) {
      return `${new URL(apiBase).origin}${path}`;
    }
    return path;
  }

  return path;
}
