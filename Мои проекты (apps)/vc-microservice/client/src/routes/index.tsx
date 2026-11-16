import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Upload, Film, Download, Loader2, CheckCircle2, XCircle, Clock, Zap, Cpu, Gauge, RotateCcw } from "lucide-react";
import {
  ALLOWED_EXT, MAX_SIZE, apiUrl, compressionPercent, formatBytes, getJob, uploadVideo, type Job,
} from "@/lib/api";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Video Compressor — сжатие видео в MP4" },
      { name: "description", content: "Загрузите видео и получите сжатый H.264/AAC MP4 с faststart." },
      { property: "og:title", content: "Video Compressor" },
      { property: "og:description", content: "Асинхронное сжатие видео через FFmpeg." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

const STATUS = {
  queued: { label: "В очереди", icon: Clock, cls: "text-warning border-warning/40" },
  processing: { label: "Сжимается", icon: Loader2, cls: "text-primary border-primary/40" },
  completed: { label: "Готово", icon: CheckCircle2, cls: "text-primary border-primary/60" },
  failed: { label: "Ошибка", icon: XCircle, cls: "text-destructive border-destructive/50" },
} as const;

function Index() {
  const [drag, setDrag] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [fileName, setFileName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!job || job.status === "completed" || job.status === "failed") return undefined;
    const t = setInterval(async () => {
      try {
        const j = await getJob(job.id);
        setJob(j);
        if (j.status === "failed") toast.error(j.error || "FFmpeg не смог обработать файл");
        if (j.status === "completed") toast.success("Видео сжато");
      } catch (e) {
        toast.error((e as Error).message);
      }
    }, 2000);
    return () => clearInterval(t);
  }, [job]);

  async function handleFile(file?: File) {
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ALLOWED_EXT.includes(ext)) { toast.error("Неподдерживаемый формат видео"); return; }
    if (file.size > MAX_SIZE) { toast.error("Файл больше 200 МБ"); return; }
    setJob(null);
    setFileName(file.name);
    setProgress(0);
    try {
      const j = await uploadVideo(file, setProgress);
      setJob({ ...j, original_name: file.name, size_in: file.size, download_url: null, error: null });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setProgress(null);
    }
  }

  const busy = progress !== null || (job && (job.status === "queued" || job.status === "processing"));

  return (
    <div className="mx-auto max-w-4xl px-5 pb-20">
      <nav className="flex items-center justify-between py-6 text-sm text-muted-foreground">
        <span className="font-pixel text-primary">VC//</span>
        <a href={apiUrl("/api/health")} target="_blank" rel="noreferrer"
           className="flex items-center gap-2 rounded-full bg-card px-3 py-1.5 hover:text-foreground">
          <span className="size-2 rounded-full bg-primary shadow-glow" /> health
        </a>
      </nav>

      <header className="py-14 text-center">
        <h1 className="font-pixel text-4xl tracking-wider md:text-6xl">Video Compressor</h1>
        <p className="mt-4 text-muted-foreground">Загрузите видео — получите лёгкий MP4, готовый к стримингу.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { i: Zap, t: "H.264 / AAC", d: "CRF 23, preset veryfast, звук 128k" },
          { i: Gauge, t: "Faststart", d: "Видео играет до полной загрузки" },
          { i: Cpu, t: "Очередь", d: "Асинхронная обработка воркерами" },
        ].map(({ i: I, t, d }) => (
          <div key={t} className="rounded-xl bg-card p-5">
            <div className="flex items-center gap-2 font-pixel text-sm text-primary"><I className="size-4" />{t}</div>
            <p className="mt-2 text-sm text-muted-foreground">{d}</p>
          </div>
        ))}
      </div>

      <section
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); if (!busy) handleFile(e.dataTransfer.files[0]); }}
        className={`relative mt-12 overflow-hidden rounded-2xl bg-panel p-10 text-center transition ${drag ? "scale-[1.01] shadow-glow" : ""}`}
      >
        <p className="text-xs uppercase tracking-widest text-primary-foreground/70">mp4 · mov · mkv · webm · avi · до 200 МБ</p>
        <h2 className="mt-3 font-pixel text-3xl text-primary-foreground md:text-4xl">Перетащите видео</h2>
        <p className="mt-2 text-primary-foreground/80">или выберите файл вручную</p>
        <input ref={inputRef} type="file" hidden accept={ALLOWED_EXT.map((e) => "." + e).join(",")}
               onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ""; }} />
        <button disabled={!!busy} onClick={() => inputRef.current?.click()}
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-card px-6 py-3 text-sm text-card-foreground transition hover:bg-secondary disabled:opacity-50">
          <Upload className="size-4" /> Выбрать файл
        </button>

        {progress !== null && (
          <div className="mx-auto mt-8 max-w-md text-left">
            <div className="flex justify-between text-xs text-primary-foreground">
              <span className="truncate">{fileName}</span><span>{Math.round(progress * 100)}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-card/60">
              <div className="h-full bg-btn transition-all" style={{ width: `${progress * 100}%` }} />
            </div>
          </div>
        )}
      </section>

      {job && <JobCard job={job} onReset={() => setJob(null)} />}
    </div>
  );
}

function JobCard({ job, onReset }: { job: Job; onReset: () => void }) {
  const s = STATUS[job.status];
  const pct = compressionPercent(job.size_in, job.size_out);
  const done = job.status === "completed" && job.download_url;
  const src = done ? apiUrl(job.download_url!) : "";

  return (
    <section className="mt-8 rounded-2xl bg-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Film className="size-5 shrink-0 text-primary" />
          <div className="min-w-0">
            <p className="truncate font-semibold">{job.original_name ?? "video"}</p>
            <p className="font-mono text-xs text-muted-foreground">{job.id}</p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${s.cls}`}>
          <s.icon className={`size-3.5 ${job.status === "processing" ? "animate-spin" : ""}`} />{s.label}
        </span>
      </div>

      {(job.status === "queued" || job.status === "processing") && (
        <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Проверяем статус каждые 2 секунды…
        </p>
      )}

      {job.status === "failed" && (
        <p className="mt-6 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{job.error || "Неизвестная ошибка"}</p>
      )}

      {done && (
        <div className="mt-6 space-y-5">
          <video controls src={src} className="w-full rounded-xl bg-background" />
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Было" value={formatBytes(job.size_in)} />
            <Stat label="Стало" value={formatBytes(job.size_out)} />
            <Stat label="Сжатие" value={pct != null ? `${pct}%` : "—"} accent />
          </div>
          <a href={apiUrl(`/api/jobs/${job.id}/download`)} download
             className="inline-flex items-center gap-2 rounded-lg bg-btn px-6 py-3 font-pixel text-sm text-primary-foreground shadow-glow transition hover:brightness-110">
            <Download className="size-4" /> Скачать MP4
          </a>
        </div>
      )}

      {(job.status === "completed" || job.status === "failed") && (
        <button onClick={onReset} className="mt-5 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <RotateCcw className="size-4" /> Сжать ещё одно
        </button>
      )}
    </section>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl bg-background p-4 text-right">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 font-pixel text-xl ${accent ? "text-primary" : ""}`}>{value}</p>
    </div>
  );
}
