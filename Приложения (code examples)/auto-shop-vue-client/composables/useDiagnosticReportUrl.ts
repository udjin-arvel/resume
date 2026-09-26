export function useDiagnosticReportUrl() {
  const config = useRuntimeConfig()

  // Публичная страница отчёта живёт на обезличенном домене (anon.example.com).
  // shareDomain — запасной вариант: на staging anonymousShareDomain пустой.
  const buildDiagnosticReportUrl = (code?: string | null): string => {
    if (!code) {
      return ""
    }

    const domain = ((config.public.anonymousShareDomain as string)
      || (config.public.shareDomain as string)
      || "").replace(/\/$/, "")

    return domain ? `${domain}/diagnostic/${code}` : ""
  }

  return { buildDiagnosticReportUrl }
}
