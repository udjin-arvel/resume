/** Разбивает текст статьи на абзацы с сохранением структуры. */
export function splitArticleParagraphs(text: string): string[] {
  const normalized = text.trim();
  if (!normalized) {
    return [];
  }

  const byDoubleNewline = normalized.split(/\n\s*\n/);
  if (byDoubleNewline.length > 1) {
    return byDoubleNewline.map((paragraph) => paragraph.trim()).filter(Boolean);
  }

  return normalized
    .split('\n')
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}
