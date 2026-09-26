export function parseDecimal(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number") return value;
  const n = Number.parseFloat(value.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export function formatMoney(value: string | number | null | undefined): string {
  const n = parseDecimal(value);
  return (
    "€" +
    new Intl.NumberFormat("de-DE", { maximumFractionDigits: 0 }).format(Math.round(n))
  );
}

export function budgetSharePct(amount: number, total: number): number {
  if (total <= 0 || amount <= 0) return 0;
  return Math.min(100, (amount / total) * 100);
}

export function formatBudgetPercent(amount: number, total: number): string {
  if (total <= 0 || amount <= 0) return "0%";
  const pct = (amount / total) * 100;
  if (pct < 0.05) return "<0,1%";
  if (pct < 1 || (pct >= 99.95 && pct < 100)) {
    return `${pct.toFixed(1).replace(".", ",")}%`;
  }
  return `${Math.round(pct)}%`;
}

export function formatRub(value: string | number | null | undefined): string {
  const n = parseDecimal(value);
  return (
    new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(Math.round(n)) + " ₽"
  );
}

export function formatHours(value: string | number | null | undefined): string {
  const n = parseDecimal(value);
  const formatted = new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 1,
    minimumFractionDigits: Number.isInteger(n) ? 0 : 1,
  }).format(n);
  return `${formatted} ч`;
}

export function formatDate(value: string | null | undefined, defaultValue = "—"): string {
  if (!value) return defaultValue;
  const d = value.includes("T") ? new Date(value) : new Date(value + "T00:00:00");
  if (Number.isNaN(d.getTime())) return value;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

export function parseRuDate(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const match = trimmed.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!match) return null;

  const [, dd, mm, yyyy] = match;
  const day = Number(dd);
  const month = Number(mm);
  const year = Number(yyyy);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return `${yyyy}-${mm}-${dd}`;
}

/** YYYY-MM-DD for native `<input type="date" />`. */
export function toDateInputValue(value: string | null | undefined): string {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const d = value.includes("T") ? new Date(value) : new Date(value + "T00:00:00");
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}.${mm}.${yyyy}, ${hh}:${min}`;
}

/** Russian plural forms: 1 день, 2 дня, 5 дней */
export function pluralizeRu(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(n) % 100;
  const mod10 = abs % 10;
  if (abs >= 11 && abs <= 14) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}

export function pluralDays(n: number): string {
  return pluralizeRu(n, "день", "дня", "дней");
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
