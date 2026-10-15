import type { ArticleFull } from '../types';
import { splitArticleParagraphs } from './splitArticleParagraphs';

/** Текст статьи для буфера обмена и Share. */
export function formatArticlePlainText(article: Pick<ArticleFull, 'number' | 'title' | 'text'>): string {
  const paragraphs = splitArticleParagraphs(article.text);
  const body = paragraphs.length > 0 ? paragraphs.join('\n\n') : article.text.trim();
  return `Статья ${article.number}. ${article.title}\n\n${body}`;
}
