/** Кодекс из таблицы `codes`. */
export type Code = {
  id: number;
  slug: string;
  name: string;
  full_name: string;
};

/** Результат полнотекстового поиска (RPC `search_articles`). */
export type Article = {
  id: number;
  code_slug: string;
  code_name: string;
  number: string;
  title: string;
  snippet: string;
  rank: number;
};

/** Полная статья для экрана детализации. */
export type ArticleFull = {
  id: number;
  code_slug: string;
  code_name: string;
  number: string;
  title: string;
  chapter: string | null;
  text: string;
  updated_at: string;
};
