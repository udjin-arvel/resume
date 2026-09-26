import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Globe,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { STAGES, buildMockReport, type Report } from "@/lib/mock-analysis";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Conquer — AI-анализ сайта по одной ссылке" },
      {
        name: "description",
        content:
          "Вставьте ссылку на сайт — парсер соберёт данные, а AI выдаст отрасль, УТП, ценовой сегмент, ключевые слова и риски.",
      },
      { property: "og:title", content: "Conquer — AI-анализ сайта по одной ссылке" },
      {
        property: "og:description",
        content: "Парсинг сайта и аналитическая сводка от AI: отрасль, продукты, УТП, риски, контакты.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Phase = "idle" | "running" | "done";

const EXAMPLES = ["stroy-profil.ru", "mebel-loft.ru", "clinic-vita.ru"];

function Index() {
  const [url, setUrl] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [stageIndex, setStageIndex] = useState(0);
  const [report, setReport] = useState<Report | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const start = (value: string) => {
    const target = value.trim();
    if (!target) return;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setReport(null);
    setStageIndex(0);
    setPhase("running");

    let acc = 0;
    STAGES.forEach((stage, i) => {
      acc += stage.ms;
      timers.current.push(
        setTimeout(() => {
          setStageIndex(i + 1);
          if (i === STAGES.length - 1) {
            setReport(buildMockReport(target));
            setPhase("done");
          }
        }, acc),
      );
    });
  };

  const progress = useMemo(
    () => Math.round((stageIndex / STAGES.length) * 100),
    [stageIndex],
  );

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] hero-glow" />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-xl bg-secondary accent-glow">
            <Sparkles className="size-4 text-accent" />
          </span>
          <span className="text-[15px] font-semibold tracking-tight">Conquer</span>
          <Badge variant="outline" className="ml-1 border-border text-muted-foreground">
            MVP
          </Badge>
        </div>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground sm:flex">
          <a className="transition-colors hover:text-foreground" href="#how">
            Как работает
          </a>
          <a className="transition-colors hover:text-foreground" href="#stack">
            Стек
          </a>
          <Button variant="secondary" size="sm">
            Войти
          </Button>
        </nav>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-5 pb-24">
        <section className="pt-12 pb-10 text-center sm:pt-20">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground">
            <span className="size-1.5 rounded-full bg-success" />
            Playwright + DeepSeek · очередь свободна
          </p>
          <h1 className="mx-auto max-w-3xl text-4xl leading-[1.1] font-semibold tracking-tight sm:text-6xl">
            <span className="text-gradient">Один URL</span> — и вы знаете о сайте всё
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-muted-foreground sm:text-base">
            Сервис парсит сайт в headless-браузере, извлекает контент, контакты и цены,
            а затем строит аналитическую сводку через AI: отрасль, продукты, УТП, риски.
          </p>

          <form
            className="mx-auto mt-9 w-full max-w-2xl"
            onSubmit={(e) => {
              e.preventDefault();
              start(url);
            }}
          >
            <div className="flex flex-col gap-2.5 rounded-2xl surface-card p-2.5 sm:flex-row sm:items-center sm:rounded-full">
              <div className="flex flex-1 items-center gap-2.5 px-3">
                <Globe className="size-4 shrink-0 text-muted-foreground" />
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  aria-label="Ссылка на сайт"
                  className="h-11 border-0 bg-transparent px-0 text-base shadow-none focus-visible:ring-0"
                />
              </div>
              <Button
                type="submit"
                size="lg"
                disabled={phase === "running" || !url.trim()}
                className="h-11 rounded-full px-6"
              >
                {phase === "running" ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Анализ…
                  </>
                ) : (
                  <>
                    Анализировать <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </div>
            <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
              <span>Попробуйте:</span>
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => {
                    setUrl(ex);
                    start(ex);
                  }}
                  className="rounded-full border border-border bg-card/60 px-2.5 py-1 font-mono transition-colors hover:border-accent/50 hover:text-foreground"
                >
                  {ex}
                </button>
              ))}
            </div>
          </form>
        </section>

        {phase !== "idle" && (
          <section className="mx-auto mb-10 max-w-2xl rounded-2xl surface-card p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between text-sm">
              <span className="font-mono text-muted-foreground">{url || "—"}</span>
              <span className="text-muted-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="h-1.5" />
            <ol className="mt-5 space-y-3.5">
              {STAGES.map((stage, i) => {
                const done = i < stageIndex;
                const active = i === stageIndex && phase === "running";
                return (
                  <li key={stage.key} className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border text-[10px] ${
                        done
                          ? "border-success/40 bg-success/15 text-success"
                          : active
                            ? "border-accent/50 bg-accent/15 text-accent pulse-ring"
                            : "border-border text-muted-foreground"
                      }`}
                    >
                      {done ? <Check className="size-3" /> : i + 1}
                    </span>
                    <span className="min-w-0">
                      <span
                        className={`block text-sm ${done || active ? "text-foreground" : "text-muted-foreground"}`}
                      >
                        {stage.label}
                      </span>
                      <span className="block text-xs text-muted-foreground">{stage.detail}</span>
                    </span>
                  </li>
                );
              })}
            </ol>
          </section>
        )}

        {report && <ReportView report={report} />}

        <section id="how" className="mt-24 grid gap-4 sm:grid-cols-3">
          {[
            {
              t: "1. Парсинг",
              d: "Headless-браузер обходит страницы, снимает title, meta, тексты, ссылки, телефоны и цены.",
            },
            {
              t: "2. Анализ",
              d: "Собранный JSON уходит в LLM с жёстким промптом и возвращается строгой структурой метрик.",
            },
            {
              t: "3. Отчёт",
              d: "Сводка, оценки, УТП, ключевые слова и риски — с доступом к сырым данным парсинга.",
            },
          ].map((c) => (
            <article key={c.t} className="rounded-2xl surface-card p-5">
              <h3 className="text-sm font-semibold">{c.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.d}</p>
            </article>
          ))}
        </section>

        <section id="stack" className="mt-12 rounded-2xl surface-card p-5 sm:p-6">
          <h2 className="text-sm font-semibold">Технологический стек прототипа</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              "FastAPI",
              "PostgreSQL",
              "SQLAlchemy async",
              "Alembic",
              "Playwright + stealth",
              "Celery",
              "Redis",
              "DeepSeek API",
              "Jinja2 / SPA",
              "Docker Compose",
            ].map((s) => (
              <Badge key={s} variant="secondary" className="rounded-full font-mono text-xs">
                {s}
              </Badge>
            ))}
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-border py-7 text-center text-xs text-muted-foreground">
        Conquer · интерактивный прототип интерфейса, данные демонстрационные
      </footer>
    </div>
  );
}

function ReportView({ report }: { report: Report }) {
  const [rawOpen, setRawOpen] = useState(false);

  return (
    <section className="space-y-4">
      <div className="rounded-2xl surface-card p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Globe className="size-3.5" />
              <span className="font-mono">{report.host}</span>
              <Badge className="rounded-full bg-success/15 text-success" variant="secondary">
                completed
              </Badge>
            </div>
            <h2 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">{report.title}</h2>
            <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{report.description}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm">
              PDF
            </Button>
            <Button size="sm">Перепроверить</Button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            { k: "Отрасль", v: report.industry },
            { k: "Ценовой сегмент", v: report.segment },
            { k: "Тональность", v: "Нейтрально-профессиональная" },
          ].map((m) => (
            <div key={m.k} className="rounded-xl border border-border bg-card/50 p-4">
              <p className="text-xs text-muted-foreground">{m.k}</p>
              <p className="mt-1 text-sm font-medium">{m.v}</p>
            </div>
          ))}
        </div>
      </div>

      <Tabs defaultValue="summary">
        <TabsList className="w-full justify-start overflow-x-auto rounded-xl bg-muted/60 p-1">
          <TabsTrigger value="summary">Сводка</TabsTrigger>
          <TabsTrigger value="offer">Оффер</TabsTrigger>
          <TabsTrigger value="risks">Риски</TabsTrigger>
          <TabsTrigger value="data">Данные парсинга</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <article className="rounded-2xl surface-card p-5 sm:p-6">
            <h3 className="text-sm font-semibold">Аналитическая сводка</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{report.summary}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {report.keywords.map((k) => (
                <Badge key={k} variant="outline" className="rounded-full border-border text-muted-foreground">
                  {k}
                </Badge>
              ))}
            </div>
          </article>
          <article className="rounded-2xl surface-card p-5 sm:p-6">
            <h3 className="text-sm font-semibold">Ключевые метрики</h3>
            <ul className="mt-4 space-y-4">
              {report.scores.map((s) => (
                <li key={s.label}>
                  <div className="mb-1.5 flex items-baseline justify-between text-sm">
                    <span className="text-muted-foreground">{s.label}</span>
                    <span className="font-mono">{s.value}</span>
                  </div>
                  <Progress value={s.value} className="h-1.5" />
                </li>
              ))}
            </ul>
          </article>
        </TabsContent>

        <TabsContent value="offer" className="mt-4 grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl surface-card p-5 sm:p-6">
            <h3 className="text-sm font-semibold">Продукты и услуги</h3>
            <ul className="mt-3 space-y-2.5 text-sm">
              {report.products.map((p) => (
                <li key={p} className="flex items-start gap-2.5 text-muted-foreground">
                  <Check className="mt-0.5 size-4 shrink-0 text-accent" />
                  {p}
                </li>
              ))}
            </ul>
          </article>
          <article className="rounded-2xl surface-card p-5 sm:p-6">
            <h3 className="text-sm font-semibold">УТП</h3>
            <ul className="mt-3 space-y-2.5 text-sm">
              {report.usp.map((p) => (
                <li key={p} className="flex items-start gap-2.5 text-muted-foreground">
                  <Sparkles className="mt-0.5 size-4 shrink-0 text-accent" />
                  {p}
                </li>
              ))}
            </ul>
          </article>
          <article className="rounded-2xl surface-card p-5 sm:p-6 lg:col-span-2">
            <h3 className="text-sm font-semibold">Контакты</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {report.contacts.map((c) => {
                const Icon = c.type === "Телефон" ? Phone : c.type === "E-mail" ? Mail : MapPin;
                return (
                  <div key={c.type} className="rounded-xl border border-border bg-card/50 p-3.5">
                    <p className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Icon className="size-3.5" /> {c.type}
                    </p>
                    <p className="mt-1.5 text-sm break-words">{c.value}</p>
                  </div>
                );
              })}
            </div>
          </article>
        </TabsContent>

        <TabsContent value="risks" className="mt-4">
          <article className="rounded-2xl surface-card p-5 sm:p-6">
            <h3 className="text-sm font-semibold">Возможные риски и точки роста</h3>
            <ul className="mt-4 space-y-3">
              {report.risks.map((r) => (
                <li
                  key={r.text}
                  className="flex items-start gap-3 rounded-xl border border-border bg-card/50 p-3.5"
                >
                  <TriangleAlert
                    className={`mt-0.5 size-4 shrink-0 ${
                      r.level === "high"
                        ? "text-destructive"
                        : r.level === "medium"
                          ? "text-warning"
                          : "text-muted-foreground"
                    }`}
                  />
                  <span className="text-sm text-muted-foreground">{r.text}</span>
                  <Badge variant="outline" className="ml-auto rounded-full border-border text-xs">
                    {r.level === "high" ? "высокий" : r.level === "medium" ? "средний" : "низкий"}
                  </Badge>
                </li>
              ))}
            </ul>
          </article>
        </TabsContent>

        <TabsContent value="data" className="mt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {report.parsed.map((p) => (
              <div key={p.label} className="rounded-xl surface-card p-4">
                <p className="text-xs text-muted-foreground">{p.label}</p>
                <p className="mt-1 font-mono text-lg">{p.value}</p>
              </div>
            ))}
          </div>
          <div className="rounded-2xl surface-card p-5 sm:p-6">
            <button
              type="button"
              onClick={() => setRawOpen((v) => !v)}
              className="flex w-full items-center justify-between text-sm font-semibold"
            >
              Сырой JSON от бэкенда
              <ChevronDown
                className={`size-4 text-muted-foreground transition-transform ${rawOpen ? "rotate-180" : ""}`}
              />
            </button>
            {rawOpen && (
              <pre className="mt-4 overflow-x-auto rounded-xl border border-border bg-background/70 p-4 font-mono text-xs leading-relaxed text-muted-foreground">
                {JSON.stringify(report.raw, null, 2)}
              </pre>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </section>
  );
}
