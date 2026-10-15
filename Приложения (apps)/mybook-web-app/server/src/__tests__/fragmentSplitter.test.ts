import { splitIntoFragments } from '../utils/fragmentSplitter.js';

describe('splitIntoFragments', () => {
  it('merges short paragraphs into one fragment', () => {
    const paragraphs = ['a'.repeat(300), 'b'.repeat(300), 'c'.repeat(300)];
    const fragments = splitIntoFragments(paragraphs);
    expect(fragments).toHaveLength(1);
    expect(fragments[0].charCount).toBeLessThanOrEqual(1000);
    expect(fragments[0].text).toContain('aaa');
  });

  it('splits many paragraphs into multiple fragments', () => {
    const paragraphs = Array.from({ length: 10 }, (_, i) => `Paragraph ${i + 1}. ${'word '.repeat(80)}`.trim());
    const fragments = splitIntoFragments(paragraphs);
    expect(fragments.length).toBeGreaterThan(1);
    for (const f of fragments) {
      expect(f.charCount).toBeLessThanOrEqual(1000);
    }
  });

  it('splits long paragraph by sentences', () => {
    const sentence = 'This is a sentence with enough words to matter. ';
    const longParagraph = sentence.repeat(80).trim();
    const fragments = splitIntoFragments([longParagraph]);
    expect(fragments.length).toBeGreaterThan(1);
    for (const f of fragments) {
      expect(f.charCount).toBeLessThanOrEqual(1000);
    }
  });

  it('assigns sequential order starting from 1', () => {
    const paragraphs = ['First.', 'Second.', 'Third.'];
    const fragments = splitIntoFragments(paragraphs);
    expect(fragments[0].order).toBe(1);
    if (fragments.length > 1) {
      expect(fragments[1].order).toBe(2);
    }
  });

  it('returns empty array for empty input', () => {
    expect(splitIntoFragments([])).toEqual([]);
    expect(splitIntoFragments(['', '   '])).toEqual([]);
  });
});
