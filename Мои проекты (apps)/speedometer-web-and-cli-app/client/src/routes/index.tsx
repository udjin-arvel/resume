import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { measureOnce } from "@/lib/speed/measure.functions";
import { fmtBytes, fmtSec, summarize } from "@/lib/speed/stats";
import type { RequestResult } from "@/lib/speed/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SPEED/O/METER — замер скорости скачивания" },
      { name: "description", content: "Серия последовательных HTTP-запросов: время, объём, скорость в MB/s и Mbps." },
      { property: "og:title", content: "SPEED/O/METER" },
      { property: "og:description", content: "Замер скорости скачивания по URL в стиле ретро-футуризма." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

const DEFAULT_URL = "https://upload.wikimedia.org/wikipedia/commons/3/3f/Fronalpstock_big.jpg";

function Index() {
  const [url, setUrl] = useState(DEFAULT_URL);
  const [count, setCount] = useState("10");
  const [timeout, setTimeoutMs] = useState("30000");
  const [retries, setRetries] = useState("1");
  const [cacheBust, setCacheBust] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<RequestResult[]>([]);
  const [running, setRunning] = useState(false);
  const [total, setTotal] = useState(0);
  const stopRef = useRef(false);

  const posInt = (v: string, allowZero = false) => /^\d+$/.test(v) && (allowZero || Number(v) > 0);

  async function run() {
    setError(null);
    try { new URL(url); } catch { return setError("URL обязателен и должен быть валидным"); }
    if (!posInt(count) || !posInt(timeout) || !posInt(retries, true))
      return setError("Числовые поля — положительные целые");
    const n = Number(count);
    setResults([]); setTotal(n); setRunning(true); stopRef.current = false;
    for (let i = 1; i <= n && !stopRef.current; i++) {
      let r: RequestResult;
      try {
        r = await measureOnce({ data: { url, timeout: Number(timeout), retries: Number(retries), cacheBust, index: i } });
      } catch (e) {
        r = { index: i, ok: false, attempts: [], error: (e as Error).message };
      }
      setResults((p) => [...p, r]);
    }
    setRunning(false);
  }

  const s = summarize(results);
  const done = !running && results.length > 0;
  const progress = total ? Math.round((results.length / total) * 100) : 0;

  return (
    <main className="min-h-screen px-4 py-8 md:px-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-display text-5xl uppercase leading-none md:text-7xl">Speed/o/meter</h1>
            <p className="mt-2 font-display text-lg uppercase tracking-wide">Смело. Громко. Измерено.</p>
          </div>
          <div className="brut-lg bg-card p-4 font-mono text-xs uppercase leading-relaxed md:max-w-sm">
            Последовательные запросы · keep-alive · ретраи · редиректы ≤ 5 · 1 MB = 10⁶ байт
          </div>
        </header>

        <section className="brut-lg bg-card p-5 md:p-6">
          <h2 className="mb-4 border-b-[3px] border-ink pb-2 font-display text-2xl uppercase">Параметры</h2>
          <div className="grid gap-4 md:grid-cols-12">
            <Field label="URL" className="md:col-span-12">
              <input value={url} onChange={(e) => setUrl(e.target.value)} className="brut brut-press w-full bg-background px-3 py-2 font-mono text-sm" />
            </Field>
            <Field label="--count" className="md:col-span-3">
              <input value={count} onChange={(e) => setCount(e.target.value)} className="brut brut-press w-full bg-background px-3 py-2 font-mono" />
            </Field>
            <Field label="--timeout (ms)" className="md:col-span-3">
              <input value={timeout} onChange={(e) => setTimeoutMs(e.target.value)} className="brut brut-press w-full bg-background px-3 py-2 font-mono" />
            </Field>
            <Field label="--retries" className="md:col-span-3">
              <input value={retries} onChange={(e) => setRetries(e.target.value)} className="brut brut-press w-full bg-background px-3 py-2 font-mono" />
            </Field>
            <Field label="--cache-bust" className="md:col-span-3">
              <button
                type="button" role="switch" aria-checked={cacheBust} onClick={() => setCacheBust((v) => !v)}
                className={`brut brut-press w-full px-3 py-2 font-display uppercase ${cacheBust ? "bg-secondary" : "bg-muted"}`}
              >{cacheBust ? "On" : "Off"}</button>
            </Field>
          </div>
          {error && <div className="brut mt-4 bg-accent px-3 py-2 font-mono text-sm font-bold">⚠ {error} (exit 2)</div>}
          <div className="mt-6 flex flex-wrap gap-4">
            <button onClick={run} disabled={running} className="brut brut-press bg-primary px-6 py-3 font-display text-lg uppercase disabled:opacity-50">
              {running ? "Замер…" : "▶ Запустить"}
            </button>
            {running && (
              <button onClick={() => (stopRef.current = true)} className="brut brut-press bg-destructive px-6 py-3 font-display text-lg uppercase">■ Стоп</button>
            )}
          </div>
          {total > 0 && (
            <div className="mt-6 flex items-center gap-3">
              <div className="brut h-6 flex-1 overflow-hidden bg-background">
                <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
              </div>
              <span className="brut bg-ink px-2 py-0.5 font-mono text-sm text-background">{progress}%</span>
            </div>
          )}
        </section>

        {results.length > 0 && (
          <div className="grid gap-8 lg:grid-cols-5">
            <section className="brut-lg bg-card self-start lg:col-span-3">
              <h2 className="bg-ink px-4 py-2 font-display uppercase text-background">Запросы</h2>
              <ul className="divide-y-2 divide-ink font-mono text-xs md:text-sm">
                {results.map((r) => <Row key={r.index} r={r} />)}
              </ul>
            </section>
            <section className="space-y-6 lg:col-span-2">
              <div className="grid grid-cols-2 gap-4">
                <Big label="MB/s" value={s.mBps.toFixed(2)} tone="bg-primary" />
                <Big label="Mbps" value={s.mbps.toFixed(2)} tone="bg-secondary" />
              </div>
              <div className="brut-lg bg-card p-4 font-mono text-sm">
                <h3 className="mb-3 font-display text-lg uppercase">Сводка {done ? "" : "(идёт)"}</h3>
                <Stat k="Успешно / провал" v={`${s.success} / ${s.failed}`} />
                <Stat k="Ретраев" v={s.retries} />
                <Stat k="Среднее" v={fmtSec(s.avgMs)} />
                <Stat k="Медиана" v={fmtSec(s.medianMs)} />
                <Stat k="Первый" v={s.firstMs == null ? "—" : fmtSec(s.firstMs)} />
                <Stat k="Последующие (ср.)" v={s.restAvgMs == null ? "—" : fmtSec(s.restAvgMs)} />
                <Stat k="Тело (wire)" v={fmtBytes(s.bodyBytes)} />
                <Stat k="Заголовки" v={fmtBytes(s.headerBytes)} />
                <Stat k="Всего" v={fmtBytes(s.totalBytes)} />
                <div className="mt-3 break-all border-t-2 border-ink pt-2 text-xs">
                  <div><b>Исходный:</b> {url}</div>
                  <div><b>Финальный:</b> {s.finalUrl ?? "—"}</div>
                </div>
                {done && s.success === 0 && (
                  <div className="brut mt-3 bg-accent px-2 py-1 font-bold">Все запросы провалились (exit 1)</div>
                )}
              </div>
              <p className="font-mono text-xs text-muted-foreground">
                Скорость = байты тела (wire) / суммарное время успешных запросов. Заголовки в скорость не входят.
              </p>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="mb-1 block font-display text-xs uppercase">{label}</span>
      {children}
    </label>
  );
}

function Row({ r }: { r: RequestResult }) {
  const retried = r.attempts.length > 1;
  const tag = r.ok ? (retried ? "bg-secondary" : "bg-success") : "bg-accent";
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2">
      <span className="w-8 font-bold">#{r.index}</span>
      <span className={`border-2 border-ink px-1.5 font-bold ${tag}`}>{r.ok ? (retried ? "RETRY→OK" : "OK") : "FAIL"}</span>
      {r.status && <span>{r.status}</span>}
      {r.ok ? (
        <>
          <span className="font-bold">{fmtSec(r.timeMs!)}</span>
          <span>body {fmtBytes(r.bodyBytes!)}</span>
          <span>hdr {fmtBytes(r.headerBytes!)}</span>
        </>
      ) : (
        <span>({r.error}) после {r.attempts.length || 1} попыт.</span>
      )}
      {retried && (
        <span className="w-full pl-11 text-muted-foreground">
          {r.attempts.map((a) => `#${a.attempt} ${a.ok ? "ok" : a.reason}`).join(" → ")}
        </span>
      )}
    </li>
  );
}

function Big({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className={`brut-lg p-4 ${tone}`}>
      <div className="font-display text-4xl leading-none">{value}</div>
      <div className="mt-1 font-display text-sm uppercase">{label}</div>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between border-b border-dashed border-ink py-1">
      <span>{k}</span><span className="font-bold">{v}</span>
    </div>
  );
}
