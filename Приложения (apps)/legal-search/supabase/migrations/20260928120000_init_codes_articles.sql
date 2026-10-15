-- Этап 1: кодексы, статьи, полнотекстовый поиск и RPC search_articles

-- ---------------------------------------------------------------------------
-- Таблица кодексов
-- ---------------------------------------------------------------------------
create table if not exists public.codes (
  id bigint generated always as identity primary key,
  slug text not null unique,
  name text not null,
  full_name text not null,
  sort_order int not null
);

-- ---------------------------------------------------------------------------
-- Таблица статей
-- ---------------------------------------------------------------------------
create table if not exists public.articles (
  id bigint generated always as identity primary key,
  code_id bigint not null references public.codes (id) on delete cascade,
  number text not null,
  title text not null,
  chapter text,
  text text not null,
  updated_at timestamptz not null default now(),
  search_vector tsvector generated always as (
    setweight(to_tsvector('russian', coalesce(number, '')), 'A')
    || setweight(to_tsvector('russian', coalesce(title, '')), 'A')
    || setweight(to_tsvector('russian', coalesce(text, '')), 'D')
  ) stored,
  unique (code_id, number)
);

create index if not exists articles_search_vector_gin_idx
  on public.articles using gin (search_vector);

-- ---------------------------------------------------------------------------
-- RPC: поиск статей
-- ---------------------------------------------------------------------------
create or replace function public.search_articles(
  q text,
  code_slugs text[] default null,
  lim int default 30
)
returns table (
  id bigint,
  code_slug text,
  code_name text,
  number text,
  title text,
  snippet text,
  rank real
)
language sql
stable
security invoker
set search_path = public
as $$
  with params as (
    select
      websearch_to_tsquery('russian', q) as query,
      least(greatest(coalesce(lim, 30), 1), 100) as row_limit
  )
  select
    a.id,
    c.slug as code_slug,
    c.name as code_name,
    a.number,
    a.title,
    ts_headline(
      'russian',
      coalesce(a.text, ''),
      p.query,
      'StartSel=<mark>, StopSel=</mark>, MaxWords=35, MinWords=15'
    ) as snippet,
    ts_rank(a.search_vector, p.query)::real as rank
  from public.articles a
  inner join public.codes c on c.id = a.code_id
  cross join params p
  where a.search_vector @@ p.query
    and (
      code_slugs is null
      or cardinality(code_slugs) = 0
      or c.slug = any (code_slugs)
    )
  order by rank desc, a.number asc
  limit (select row_limit from params);
$$;

-- ---------------------------------------------------------------------------
-- RLS: только чтение для anon и authenticated
-- ---------------------------------------------------------------------------
alter table public.codes enable row level security;
alter table public.articles enable row level security;

drop policy if exists "codes_read_anon" on public.codes;
create policy "codes_read_anon"
  on public.codes
  for select
  to anon, authenticated
  using (true);

drop policy if exists "articles_read_anon" on public.articles;
create policy "articles_read_anon"
  on public.articles
  for select
  to anon, authenticated
  using (true);

grant select on public.codes to anon, authenticated;
grant select on public.articles to anon, authenticated;
grant execute on function public.search_articles(text, text[], int) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Seed: кодексы
-- ---------------------------------------------------------------------------
insert into public.codes (slug, name, full_name, sort_order)
values
  ('uk', 'УК РФ', 'Уголовный кодекс Российской Федерации', 1),
  ('tk', 'ТК РФ', 'Трудовой кодекс Российской Федерации', 2),
  ('koap', 'КоАП РФ', 'Кодекс Российской Федерации об административных правонарушениях', 3),
  ('gk', 'ГК РФ', 'Гражданский кодекс Российской Федерации', 4),
  ('nk', 'НК РФ', 'Налоговый кодекс Российской Федерации', 5)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Seed: тестовые статьи для smoke-проверки поиска «кража»
-- ---------------------------------------------------------------------------
insert into public.articles (code_id, number, title, chapter, text, updated_at)
select
  c.id,
  v.number,
  v.title,
  v.chapter,
  v.body,
  v.updated_at
from (
  values
    (
      'uk',
      '158',
      'Кража',
      'Глава 21',
      'Кража, то есть тайное хищение чужого имущества, наказывается штрафом либо лишением свободы.',
      '2024-03-12'::timestamptz
    ),
    (
      'uk',
      '158.1',
      'Мелкое хищение',
      'Глава 21',
      'Мелкое хищение чужого имущества, совершённое лицом, подвергнутым административному наказанию.',
      '2024-03-12'::timestamptz
    ),
    (
      'uk',
      '159',
      'Мошенничество',
      'Глава 21',
      'Мошенничество, то есть хищение чужого имущества или приобретение права на него путём обмана.',
      '2024-03-12'::timestamptz
    ),
    (
      'koap',
      '7.27',
      'Мелкое хищение',
      'Глава 7',
      'Мелкое хищение чужого имущества путём кражи, мошенничества, присвоения или растраты.',
      '2024-02-01'::timestamptz
    )
) as v (code_slug, number, title, chapter, body, updated_at)
inner join public.codes c on c.slug = v.code_slug
on conflict (code_id, number) do nothing;
