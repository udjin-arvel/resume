import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState, type FormEvent } from "react";
import { API_URL, searchUK, type SearchEvent } from "@/lib/uk-search";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Поиск по УК РФ — найти статью по описанию" },
      {
        name: "description",
        content: "Опишите ситуацию своими словами — система подберёт подходящие статьи Уголовного кодекса РФ.",
      },
      { property: "og:title", content: "Поиск по УК РФ" },
      {
        property: "og:description",
        content: "Опишите ситуацию — получите подходящие статьи Уголовного кодекса РФ.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  const [query, setQuery] = useState("");
  const [events, setEvents] = useState<SearchEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q || loading) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setEvents([]);
    setError(null);
    setLoading(true);
    try {
      await searchUK(q, (ev) => setEvents((prev) => [...prev, ev]), ctrl.signal);
    } catch (err) {
      if ((err as Error).name !== "AbortError") setError((err as Error).message || "Ошибка запроса");
    } finally {
      setLoading(false);
    }
  }

  function onStop() {
    abortRef.current?.abort();
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-background px-4 py-16 text-foreground">
      <div className="mx-auto max-w-2xl">
        <header className="mb-10">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Уголовный кодекс РФ</p>
          <h1 className="mt-2 font-serif text-4xl font-bold leading-tight sm:text-5xl">Поиск статьи</h1>
          <p className="mt-3 text-muted-foreground">Опишите, что произошло, своими словами.</p>
        </header>

        <form onSubmit={onSubmit} className="space-y-3">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) onSubmit(e);
            }}
            rows={4}
            placeholder="Например: меня ограбили поздно ночью"
            aria-label="Описание ситуации"
            className="w-full resize-y rounded-md border border-input bg-card p-4 text-base shadow-paper outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/40"
          />
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="rounded-md bg-primary px-5 py-2.5 font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
            >
              {loading ? "Ищу…" : "Найти статью"}
            </button>
            {loading && (
              <button
                type="button"
                onClick={onStop}
                className="rounded-md border border-input px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground"
              >
                Остановить
              </button>
            )}
            {!API_URL && (
              <span className="ml-auto font-mono text-xs text-muted-foreground">демо-режим</span>
            )}
          </div>
        </form>

        {(events.length > 0 || error) && (
          <section className="mt-10 space-y-3" aria-live="polite">
            {events.map((ev, i) =>
              ev.type === "step" ? (
                <p key={i} className="animate-in fade-in slide-in-from-bottom-1 font-mono text-sm">
                  <span className="text-primary">[Поиск по УК]:</span>{" "}
                  <span className="text-muted-foreground">{ev.text}</span>
                </p>
              ) : ev.type === "result" ? (
                <div
                  key={i}
                  className="animate-in fade-in slide-in-from-bottom-2 mt-6 rounded-md border-l-4 border-primary bg-card p-5 shadow-paper"
                >
                  <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Результат</p>
                  <p className="mt-2 whitespace-pre-wrap font-serif text-lg leading-relaxed">{ev.text}</p>
                </div>
              ) : (
                <p key={i} className="text-sm text-destructive">
                  {ev.text}
                </p>
              ),
            )}
            {loading && <p className="font-mono text-sm text-muted-foreground animate-pulse">…</p>}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </section>
        )}

        <footer className="mt-16 text-xs text-muted-foreground">
          Ответ носит справочный характер и не является юридической консультацией.
        </footer>
      </div>
    </main>
  );
}
