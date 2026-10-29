import { createFileRoute } from "@tanstack/react-router";
import { Bookmark, Check, ChevronLeft, Clock3, Copy, Search, Share2, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "../components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LegalSearch — поиск по кодексам РФ" },
      { name: "description", content: "Быстрый поиск и чтение статей кодексов Российской Федерации." },
      { property: "og:title", content: "LegalSearch — поиск по кодексам РФ" },
      { property: "og:description", content: "Быстрый поиск и чтение статей кодексов Российской Федерации." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Article = {
  id: number;
  code: string;
  number: string;
  chapter: string;
  title: string;
  excerpt: string;
  updated: string;
  text: string[];
};

const codes = ["Все", "УК РФ", "ТК РФ", "КоАП РФ", "ГК РФ", "НК РФ"];

const articles: Article[] = [
  { id: 158, code: "УК РФ", number: "158", chapter: "Глава 21", title: "Кража", excerpt: "Кража, то есть тайное хищение чужого имущества, наказывается штрафом либо лишением свободы.", updated: "12.03.2024", text: ["Кража, то есть тайное хищение чужого имущества, — наказывается штрафом в размере до восьмидесяти тысяч рублей или в размере заработной платы или иного дохода осуждённого за период до шести месяцев, либо обязательными работами на срок до трёхсот шестидесяти часов, либо исправительными работами на срок до одного года.", "Кража, совершённая группой лиц по предварительному сговору, а равно с незаконным проникновением в помещение либо иное хранилище, наказывается штрафом или лишением свободы на срок до пяти лет."] },
  { id: 1581, code: "УК РФ", number: "158.1", chapter: "Глава 21", title: "Мелкое хищение", excerpt: "Мелкое хищение чужого имущества, совершённое лицом, подвергнутым административному наказанию.", updated: "12.03.2024", text: ["Мелкое хищение чужого имущества, совершённое лицом, подвергнутым административному наказанию за мелкое хищение, наказывается штрафом либо обязательными работами."] },
  { id: 727, code: "КоАП РФ", number: "7.27", chapter: "Глава 7", title: "Мелкое хищение", excerpt: "Мелкое хищение чужого имущества путём кражи, мошенничества, присвоения или растраты.", updated: "01.02.2024", text: ["Мелкое хищение чужого имущества, стоимость которого не превышает одну тысячу рублей, путём кражи, мошенничества, присвоения или растраты влечёт наложение административного штрафа."] },
  { id: 159, code: "УК РФ", number: "159", chapter: "Глава 21", title: "Мошенничество", excerpt: "Мошенничество, то есть хищение чужого имущества или приобретение права на него путём обмана.", updated: "12.03.2024", text: ["Мошенничество, то есть хищение чужого имущества или приобретение права на чужое имущество путём обмана или злоупотребления доверием, наказывается штрафом либо ограничением свободы."] },
];

function Index() {
  const [query, setQuery] = useState("кража");
  const [activeCode, setActiveCode] = useState("Все");
  const [tab, setTab] = useState<"search" | "favorites" | "history">("search");
  const [selected, setSelected] = useState<Article | null>(null);
  const [favorites, setFavorites] = useState<number[]>([727]);
  const [history, setHistory] = useState(["кража", "мошенничество", "мелкое хищение"]);
  const [copied, setCopied] = useState(false);

  const results = useMemo(() => {
    if (tab === "favorites") return articles.filter((article) => favorites.includes(article.id));
    if (query.trim().length < 2) return [];
    return articles.filter((article) => activeCode === "Все" || article.code === activeCode);
  }, [activeCode, favorites, query, tab]);

  const toggleFavorite = (id: number) => {
    setFavorites((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const copyArticle = async (article: Article) => {
    await navigator.clipboard?.writeText(`Статья ${article.number}. ${article.title}\n\n${article.text.join("\n\n")}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  if (selected) {
    const isFavorite = favorites.includes(selected.id);
    return (
      <AppFrame>
        <header className="sticky top-0 z-20 border-b border-line/80 bg-canvas/85 px-5 pb-3 pt-4 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <Button variant="icon" aria-label="Назад к результатам" onClick={() => setSelected(null)}><ChevronLeft size={18} /></Button>
            <span className="text-[11px] font-medium uppercase text-ink-faint">Полный текст</span>
            <Button variant="icon" aria-label={isFavorite ? "Удалить из избранного" : "Добавить в избранное"} onClick={() => toggleFavorite(selected.id)}>
              <Bookmark size={17} fill={isFavorite ? "currentColor" : "none"} className={isFavorite ? "text-brand" : ""} />
            </Button>
          </div>
        </header>
        <main className="flex-1 px-5 pb-32 pt-7">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-brand-soft px-2 py-1 text-[11px] font-semibold text-brand ring-1 ring-brand/15">{selected.code}</span>
            <span className="text-[11px] text-ink-faint">{selected.chapter}</span>
          </div>
          <p className="mt-6 font-serif text-[15px] font-semibold text-brand">Статья {selected.number}</p>
          <h1 className="mt-1 font-serif text-[30px] font-semibold leading-tight text-ink">{selected.title}</h1>
          <div className="my-6 h-px bg-line" />
          <div className="space-y-5 font-serif text-[17px] leading-[1.72] text-ink-soft">
            {selected.text.map((paragraph, index) => <p key={paragraph}><span className="mr-2 text-[12px] text-ink-faint">{index + 1}.</span>{paragraph}</p>)}
          </div>
          <div className="mt-8 border-t border-line pt-4 text-[11px] text-ink-faint">Редакция от {selected.updated}</div>
          <aside className="mt-6 rounded-lg bg-warm-soft p-3 text-[12px] leading-relaxed text-ink-soft ring-1 ring-warm/15">
            Не является официальным источником. Проверяйте актуальную редакцию на pravo.gov.ru
          </aside>
        </main>
        <div className="fixed bottom-0 left-1/2 z-30 w-full max-w-[420px] -translate-x-1/2 bg-canvas/90 px-5 pb-5 pt-3 backdrop-blur-xl">
          <div className="grid grid-cols-3 gap-2">
            <Button onClick={() => toggleFavorite(selected.id)}><Bookmark size={16} fill={isFavorite ? "currentColor" : "none"} />{isFavorite ? "Сохранено" : "Сохранить"}</Button>
            <Button onClick={() => copyArticle(selected)}>{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? "Готово" : "Копировать"}</Button>
            <Button onClick={() => navigator.share?.({ title: selected.title, text: selected.text[0] ?? selected.title })}><Share2 size={16} />Поделиться</Button>
          </div>
        </div>
      </AppFrame>
    );
  }

  return (
    <AppFrame>
      <header className="sticky top-0 z-20 border-b border-line/80 bg-canvas/85 backdrop-blur-xl">
        <div className="flex items-center justify-between px-5 pb-3 pt-4">
          <div className="flex items-center gap-2.5">
            <div className="grid size-8 place-items-center rounded-lg bg-ink font-serif text-sm font-semibold text-canvas">Л</div>
            <div className="leading-tight">
              <p className="font-serif text-[15px] font-semibold text-ink">LegalSearch</p>
              <p className="text-[10px] uppercase text-ink-faint">База права</p>
            </div>
          </div>
          <Button
            variant="icon"
            aria-label={tab === "history" ? "Закрыть историю" : "История поиска"}
            onClick={() => setTab((current) => current === "history" ? "search" : "history")}
            className={tab === "history" ? "bg-brand-soft text-brand ring-brand/20" : ""}
          >
            {tab === "history" ? <X size={16} /> : <Clock3 size={16} />}
          </Button>
        </div>
        {tab === "search" && <>
          <div className="px-5 pb-3">
            <label className="flex h-12 items-center gap-2.5 rounded-lg bg-surface/75 px-3.5 ring-1 ring-line focus-within:ring-2 focus-within:ring-brand">
              <Search size={17} className="shrink-0 text-ink-faint" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Статья, термин или фраза" className="min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-faint" aria-label="Поиск по кодексам" />
              {query && <Button variant="icon" className="size-7 bg-transparent ring-0" aria-label="Очистить поиск" onClick={() => setQuery("")}><X size={15} /></Button>}
            </label>
          </div>
          <div className="flex gap-2 overflow-x-auto px-5 pb-3 pt-1 [scrollbar-width:none]">
            {codes.map((code) => <Button key={code} variant={activeCode === code ? "filterActive" : "filter"} onClick={() => setActiveCode(code)}>{code}</Button>)}
          </div>
        </>}
      </header>

      <main className="flex-1 px-5 pb-28 pt-4">
        {tab === "history" ? (
          <section>
            <div className="mb-5 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase text-ink-faint">Поиск</p>
                <h1 className="mt-1 truncate font-serif text-[26px] font-semibold text-ink">История запросов</h1>
              </div>
              {history.length > 0 && (
                <Button variant="icon" aria-label="Очистить историю" onClick={() => setHistory([])}>
                  <Trash2 size={16} />
                </Button>
              )}
            </div>
            {history.length === 0 ? (
              <EmptyState title="История пуста" text="Здесь появятся ваши последние поисковые запросы." icon="history" />
            ) : (
              <div className="divide-y divide-line border-y border-line">
                {history.map((item) => (
                  <Button
                    key={item}
                    variant="ghost"
                    className="grid h-auto w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-none px-1 py-4 text-left hover:bg-surface/60"
                    onClick={() => { setQuery(item); setTab("search"); }}
                  >
                    <Clock3 size={16} className="text-ink-faint" />
                    <span className="min-w-0 truncate text-[14px] font-normal text-ink">{item}</span>
                    <ChevronLeft size={16} className="rotate-180 text-ink-faint" />
                  </Button>
                ))}
              </div>
            )}
          </section>
        ) : <>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[13px] text-ink-soft">{tab === "favorites" ? "Сохранено" : "Найдено"} <span className="font-semibold text-ink">{results.length}</span> {tab === "favorites" ? "статьи" : "нормы"}</p>
          {tab === "search" && query.length >= 2 && <p className="text-[10px] uppercase text-ink-faint">По релевантности</p>}
        </div>

        {tab === "search" && query.trim().length < 2 ? <EmptyState title="Начните поиск" text="Начните вводить ключевые слова, например «кража»." /> : results.length === 0 ? <EmptyState title={tab === "favorites" ? "Пока пусто" : "Ничего не найдено"} text={tab === "favorites" ? "Сохраняйте важные статьи, чтобы вернуться к ним позже." : "Попробуйте изменить запрос или выбрать другой кодекс."} /> : (
          <div className="space-y-3">
            {results.map((article, index) => (
              <button key={article.id} onClick={() => setSelected(article)} className="result-rise w-full rounded-lg bg-surface/75 p-4 text-left ring-1 ring-line backdrop-blur-xl transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand" style={{ animationDelay: `${index * 55}ms` }}>
                <div className="mb-2.5 flex items-center gap-2">
                  <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1 ${article.code === "КоАП РФ" ? "bg-warm-soft text-warm ring-warm/20" : "bg-brand-soft text-brand ring-brand/15"}`}>{article.code}</span>
                  <span className="font-serif text-[13px] font-semibold text-ink">ст. {article.number}</span>
                  <span className="ml-auto text-[11px] text-ink-faint">{article.chapter}</span>
                </div>
                <h2 className="font-serif text-[18px] font-semibold leading-snug text-ink">{article.title}</h2>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">{highlight(article.excerpt, query)}</p>
                <div className="mt-3 flex items-center border-t border-line/80 pt-3 text-[11px] text-ink-faint"><span>Обновлено {article.updated}</span><span className="ml-auto text-brand">Полный текст</span></div>
              </button>
            ))}
          </div>
        )}
        </>}
      </main>

      <nav className="fixed bottom-0 left-1/2 z-20 w-full max-w-[420px] -translate-x-1/2 px-5 pb-5">
        <div className="flex items-center justify-between rounded-xl bg-surface/90 px-3 py-2 ring-1 ring-line backdrop-blur-xl">
          <Button variant="nav" className={tab === "search" ? "text-brand" : ""} onClick={() => setTab("search")}><Search size={17} /><span className="text-[11px] font-medium">Поиск</span></Button>
          <Button variant="nav" className={tab === "favorites" ? "text-brand" : ""} onClick={() => setTab("favorites")}><Bookmark size={17} fill={tab === "favorites" ? "currentColor" : "none"} /><span className="text-[11px] font-medium">Избранное</span></Button>
        </div>
      </nav>
    </AppFrame>
  );
}

function AppFrame({ children }: { children: React.ReactNode }) {
  return <div className="relative min-h-screen w-full overflow-hidden bg-canvas text-ink antialiased"><div className="relative mx-auto flex min-h-screen max-w-[420px] flex-col border-x border-line/70 shadow-[0_0_50px_color-mix(in_oklab,var(--ink)_8%,transparent)]">{children}</div></div>;
}

function EmptyState({ title, text, icon = "search" }: { title: string; text: string; icon?: "search" | "history" }) {
  return <div className="flex min-h-80 flex-col items-center justify-center px-8 text-center"><div className="grid size-12 place-items-center rounded-full bg-brand-soft text-brand">{icon === "history" ? <Clock3 size={20} /> : <Search size={20} />}</div><h2 className="mt-4 font-serif text-xl font-semibold">{title}</h2><p className="mt-2 text-sm leading-relaxed text-ink-soft">{text}</p></div>;
}

function highlight(text: string, query: string) {
  const term = query.trim().toLowerCase();
  if (term.length < 2) return text;
  const index = text.toLowerCase().indexOf(term);
  if (index < 0) return text;
  return <>{text.slice(0, index)}<mark className="rounded bg-warm-soft px-0.5 text-ink">{text.slice(index, index + term.length)}</mark>{text.slice(index + term.length)}</>;
}
