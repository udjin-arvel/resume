const STORAGE_KEY = "worker.locale";

export type WorkerLocale = "en" | "pt" | "ru";

/** Display order for language pickers: EN, PT, RU */
export const WORKER_LANGUAGES: { code: WorkerLocale; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "pt", label: "PT" },
  { code: "ru", label: "RU" },
];

export function normalizeWorkerLocale(value: string | undefined): WorkerLocale {
  const lower = value?.toLowerCase().trim() ?? "";
  if (lower.startsWith("pt")) return "pt";
  if (lower.startsWith("ru")) return "ru";
  if (lower.startsWith("en")) return "en";
  return "en";
}

export function getStoredWorkerLocale(): WorkerLocale | null {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  return normalizeWorkerLocale(stored);
}

export function setStoredWorkerLocale(locale: WorkerLocale): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, locale);
}
