export type SnippetSegment = {
  text: string;
  highlighted: boolean;
};

const MARK_REGEX = /<mark>(.*?)<\/mark>/gis;

/** Разбирает snippet из RPC (`StartSel=<mark>`) на сегменты для RN Text. */
export function parseMarkedSnippet(raw: string): SnippetSegment[] {
  const segments: SnippetSegment[] = [];
  let lastIndex = 0;

  for (const match of raw.matchAll(MARK_REGEX)) {
    const fullMatch = match[0];
    const inner = match[1];
    const start = match.index ?? 0;

    if (start > lastIndex) {
      segments.push({ text: raw.slice(lastIndex, start), highlighted: false });
    }
    if (inner.length > 0) {
      segments.push({ text: inner, highlighted: true });
    }
    lastIndex = start + fullMatch.length;
  }

  if (lastIndex < raw.length) {
    segments.push({ text: raw.slice(lastIndex), highlighted: false });
  }

  if (segments.length === 0) {
    return [{ text: raw.replace(/<\/?mark>/gi, ''), highlighted: false }];
  }

  return segments;
}
