function getIntlLocale(locale: string): string {
  return locale === "zh" ? "zh-CN" : "ru-RU"
}

export function formatInt(val: unknown, locale: string = "ru"): string {
  const n = Number(val)
  if (!Number.isFinite(n)) {
    return ""
  }
  const i = Math.trunc(n)

  return new Intl.NumberFormat(getIntlLocale(locale), {
    maximumFractionDigits: 0,
  }).format(i)
}

export function formatDateTime(
  dateString: string | Date | undefined | null,
  locale: string = "ru",
): string {
  if (!dateString) {
    return ""
  }

  return new Date(dateString)
    .toLocaleString(getIntlLocale(locale), {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
    .replace(/,/, "")
}

export function formatProductionDate(
  releaseYear: number | null | undefined,
  month: number | null | undefined,
): string {
  if (!releaseYear) {
    return ""
  }
  if (!month) {
    return String(releaseYear)
  }

  return `${releaseYear}-${String(month).padStart(2, "0")}`
}

export function cleanCountSuffix(s: string): string {
  return String(s || "").replace(/\s*\(\d+\)\s*$/, "")
}

export function uniq<T>(arr: Array<T | null | undefined>): T[] {
  return Array.from(new Set(arr.filter((x): x is T => x != null)))
}
