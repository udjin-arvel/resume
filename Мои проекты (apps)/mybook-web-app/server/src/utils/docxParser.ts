import mammoth from 'mammoth';
import { splitIntoFragments, type FragmentChunk } from './fragmentSplitter.js';

export interface DocxParseResult {
  title: string;
  fragments: FragmentChunk[];
  totalChars: number;
  fragmentCount: number;
}

export async function parseDocxBuffer(buffer: Buffer, filename?: string): Promise<DocxParseResult> {
  const result = await mammoth.extractRawText({ buffer });
  const rawText = result.value;

  const paragraphs = rawText
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\n/g, ' ').trim())
    .filter(Boolean);

  const fragments = splitIntoFragments(paragraphs);
  const totalChars = fragments.reduce((sum, f) => sum + f.charCount, 0);

  const suggestedTitle = filename
    ? filename.replace(/\.docx$/i, '').replace(/[-_]/g, ' ').trim()
    : (paragraphs[0]?.slice(0, 100) || 'Новая история');

  return {
    title: suggestedTitle,
    fragments,
    totalChars,
    fragmentCount: fragments.length,
  };
}
