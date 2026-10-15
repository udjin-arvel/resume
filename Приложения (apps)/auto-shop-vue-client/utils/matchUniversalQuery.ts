export function normalizeSearchQuery(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, "")
}

export function matchesUniversalQuery(query: string, ...values: Array<string | number | null | undefined>): boolean {
  const normalizedQuery = normalizeSearchQuery(query)
  if (!normalizedQuery) {
    return true
  }

  return values.some((value) => {
    if (value == null || value === "") {
      return false
    }
    return normalizeSearchQuery(String(value)).includes(normalizedQuery)
  })
}
