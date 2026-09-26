export const PROJECT_DOCUMENT_CATEGORIES = [
  { type: "estimate", label: "Сметы" },
  { type: "instruction", label: "Инструкции" },
  { type: "general", label: "Общие документы" },
] as const;

export type ProjectDocumentCategory = (typeof PROJECT_DOCUMENT_CATEGORIES)[number]["type"];

export function normalizeProjectDocumentType(documentType?: string): ProjectDocumentCategory {
  if (documentType === "estimate" || documentType === "instruction") {
    return documentType;
  }
  return "general";
}
