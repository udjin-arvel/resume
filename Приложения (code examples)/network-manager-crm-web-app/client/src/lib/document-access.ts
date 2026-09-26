import type { DocumentDisposition } from "@/lib/api/documents";

export function isViewableDocument(mimeType: string): boolean {
  const ct = mimeType.trim().toLowerCase().split(";")[0] ?? "";
  if (!ct) return false;
  if (ct.startsWith("image/")) return true;
  if (ct.startsWith("audio/")) return true;
  return ct === "application/pdf";
}

export function preferredDisposition(mimeType: string): DocumentDisposition {
  return isViewableDocument(mimeType) ? "inline" : "attachment";
}
