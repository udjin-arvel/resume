export interface FragmentChunk {
  order: number;
  text: string;
  charCount: number;
}

const MIN = 500;
const MAX = 1000;

function splitLongParagraph(text: string): string[] {
  if (text.length <= MAX) {
    return [text];
  }

  const sentences = text.split(/(?<=[.!?…])\s+/);
  const chunks: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;

    const candidate = current ? `${current} ${trimmed}` : trimmed;

    if (candidate.length <= MAX) {
      current = candidate;
      continue;
    }

    if (current) {
      chunks.push(current);
      current = '';
    }

    if (trimmed.length > MAX) {
      let remaining = trimmed;
      while (remaining.length > MAX) {
        let splitAt = remaining.lastIndexOf(' ', MAX);
        if (splitAt < MIN) {
          splitAt = MAX;
        }
        chunks.push(remaining.slice(0, splitAt).trim());
        remaining = remaining.slice(splitAt).trim();
      }
      current = remaining;
    } else {
      current = trimmed;
    }
  }

  if (current) {
    chunks.push(current);
  }

  return chunks;
}

export function splitIntoFragments(paragraphs: string[]): FragmentChunk[] {
  const texts: string[] = [];
  let current = '';

  const flush = (): void => {
    if (current.trim()) {
      texts.push(current.trim());
      current = '';
    }
  };

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    if (trimmed.length > MAX) {
      flush();
      texts.push(...splitLongParagraph(trimmed));
      continue;
    }

    const candidate = current ? `${current}\n\n${trimmed}` : trimmed;

    if (candidate.length <= MAX) {
      current = candidate;
    } else {
      flush();
      current = trimmed;
    }
  }

  flush();

  return texts.map((text, index) => ({
    order: index + 1,
    text,
    charCount: text.length,
  }));
}
