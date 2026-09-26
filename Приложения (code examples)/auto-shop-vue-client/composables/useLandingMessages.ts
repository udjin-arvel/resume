import { computed } from "vue"
import { useI18n } from "vue-i18n"

export function useLandingMessages() {
  const { t, tm, rt } = useI18n()

  const list = (key: string) => computed<string[]>(() => {
    const raw = tm(key)
    if (!Array.isArray(raw)) {
      return []
    }
    return raw.map(item => rt(item as never))
  })

  const objects = <T extends object>(key: string) => computed<T[]>(() => {
    const raw = tm(key)
    if (!Array.isArray(raw)) {
      return []
    }
    return raw.map((item) => {
      const source = item as Record<string, unknown>
      const result: Record<string, unknown> = {}
      Object.keys(source).forEach((field) => {
        const value = source[field]
        result[field] = typeof value === "number" ? value : rt(value as never)
      })
      return result as T
    })
  })

  return { t, list, objects }
}
