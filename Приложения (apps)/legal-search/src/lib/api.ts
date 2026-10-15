import type { PostgrestError } from '@supabase/supabase-js';

import type { Article, ArticleFull, Code } from '../types';
import { ApiError } from './errors';
import { getSupabase } from './supabase';

type SearchArticlesRow = {
  id: number;
  code_slug: string;
  code_name: string;
  number: string;
  title: string;
  snippet: string;
  rank: number;
};

type CodeRow = {
  id: number;
  slug: string;
  name: string;
  full_name: string;
};

type CodeRelation = {
  slug: string;
  name: string;
};

type ArticleWithCodeRowRaw = {
  id: number | string;
  number: string;
  title: string;
  chapter: string | null;
  text: string;
  updated_at: string;
  codes: CodeRelation | CodeRelation[] | null;
};

function resolveCodeRelation(codes: CodeRelation | CodeRelation[] | null): CodeRelation {
  if (!codes) {
    throw new ApiError('Article has no related code');
  }
  if (Array.isArray(codes)) {
    const first = codes[0];
    if (!first) {
      throw new ApiError('Article has no related code');
    }
    return first;
  }
  return codes;
}

function toNumberId(value: number | string): number {
  const id = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(id)) {
    throw new ApiError('Invalid numeric id in response');
  }
  return id;
}

function throwOnPostgrestError(error: PostgrestError | null, context: string): void {
  if (error) {
    throw new ApiError(`${context}: ${error.message}`, {
      code: error.code,
      cause: error,
    });
  }
}

function mapSearchRow(row: SearchArticlesRow): Article {
  return {
    id: toNumberId(row.id),
    code_slug: row.code_slug,
    code_name: row.code_name,
    number: row.number,
    title: row.title,
    snippet: row.snippet,
    rank: row.rank,
  };
}

function mapCodeRow(row: CodeRow): Code {
  return {
    id: toNumberId(row.id),
    slug: row.slug,
    name: row.name,
    full_name: row.full_name,
  };
}

function mapArticleWithCodeRow(row: ArticleWithCodeRowRaw): ArticleFull {
  const code = resolveCodeRelation(row.codes);
  return {
    id: toNumberId(row.id),
    code_slug: code.slug,
    code_name: code.name,
    number: row.number,
    title: row.title,
    chapter: row.chapter,
    text: row.text,
    updated_at: row.updated_at,
  };
}

/** Полнотекстовый поиск статей через RPC `search_articles`. */
export async function searchArticles(
  q: string,
  codes: string[],
  limit = 30,
): Promise<Article[]> {
  const { data, error } = await getSupabase().rpc('search_articles', {
    q,
    code_slugs: codes,
    lim: limit,
  });

  throwOnPostgrestError(error, 'searchArticles failed');

  const rows = (data ?? []) as SearchArticlesRow[];
  return rows.map(mapSearchRow);
}

/** Список кодексов, отсортированный по `sort_order`. */
export async function getCodes(): Promise<Code[]> {
  const { data, error } = await getSupabase()
    .from('codes')
    .select('id, slug, name, full_name')
    .order('sort_order', { ascending: true });

  throwOnPostgrestError(error, 'getCodes failed');

  const rows = (data ?? []) as CodeRow[];
  return rows.map(mapCodeRow);
}

/** Одна статья по id с данными кодекса. */
export async function getArticle(id: number): Promise<ArticleFull> {
  const { data, error } = await getSupabase()
    .from('articles')
    .select(
      `
      id,
      number,
      title,
      chapter,
      text,
      updated_at,
      codes (
        slug,
        name
      )
    `,
    )
    .eq('id', id)
    .single();

  throwOnPostgrestError(error, 'getArticle failed');

  if (!data) {
    throw new ApiError(`Article not found: ${id}`);
  }

  return mapArticleWithCodeRow(data as ArticleWithCodeRowRaw);
}
