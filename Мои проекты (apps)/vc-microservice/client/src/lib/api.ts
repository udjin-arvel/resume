export const API_BASE: string = (import.meta.env['VITE_API_URL'] as string | undefined) ?? "";

export type JobStatus = "queued" | "processing" | "completed" | "failed";
export interface Job {
  id: string;
  status: JobStatus;
  original_name?: string;
  size_in?: number;
  size_out?: number;
  download_url: string | null;
  error: string | null;
  created_at?: string;
  finished_at?: string | null;
}

export const ALLOWED_EXT = ["mp4", "mov", "mkv", "webm", "avi"];
export const MAX_SIZE = 200 * 1024 * 1024;

const ERR: Record<number, string> = {
  400: "Некорректный запрос",
  413: "Файл больше 200 МБ",
  415: "Неподдерживаемый формат видео",
  429: "Очередь переполнена, попробуйте позже",
};

export function apiUrl(path: string) {
  return API_BASE + path;
}

export function uploadVideo(file: File, onProgress: (p: number) => void): Promise<Job> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", apiUrl("/api/jobs"));
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => {
      let body: any = null;
      try { body = JSON.parse(xhr.responseText); } catch { /* empty */ }
      if (xhr.status === 202 || xhr.status === 200) resolve(body as Job);
      else reject(new Error(body?.error || ERR[xhr.status] || `Ошибка ${xhr.status}`));
    };
    xhr.onerror = () => reject(new Error("Сервер недоступен"));
    const fd = new FormData();
    fd.append("file", file);
    xhr.send(fd);
  });
}

export async function getJob(id: string): Promise<Job> {
  const r = await fetch(apiUrl(`/api/jobs/${id}`));
  const body = await r.json().catch(() => null);
  if (!r.ok) throw new Error(body?.error || `Ошибка ${r.status}`);
  return body as Job;
}

export function formatBytes(n?: number) {
  if (n == null) return "—";
  const u = ["Б", "КБ", "МБ", "ГБ"];
  let i = 0;
  while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(i ? 1 : 0)} ${u[i]}`;
}

export function compressionPercent(inp?: number, out?: number) {
  if (!inp || out == null) return null;
  return Math.round((1 - out / inp) * 100);
}
