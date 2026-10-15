-- Smoke-проверки после применения 20260928120000_init_codes_articles.sql
-- Запускать в Supabase SQL Editor (или psql к проекту).

select count(*) as codes_count from public.codes;
-- ожидается: 5

select * from public.search_articles('кража', null, 10);
-- ожидается: строки по УК 158 и КоАП 7.27, в snippet — <mark>

select * from public.search_articles('кража', array['tk'], 10);
-- ожидается: 0 строк
