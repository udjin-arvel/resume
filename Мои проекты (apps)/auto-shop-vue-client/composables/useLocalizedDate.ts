import { useI18n } from "vue-i18n"
import dayjs from "dayjs"
import "dayjs/locale/ru"
import { useDate } from "@/composables/useDate"

export function useLocalizedDate() {
  const { t, locale } = useI18n()
  dayjs.locale(locale.value)

  const base = useDate()

  const humanDate = (rawDate?: string | Date | null): string | null => {
    const date = base.humanDate(rawDate)
    if (!date) {
      return null
    }

    if (date === "Today") {
      return t("date.today")
    }
    if (date === "Yesterday") {
      return t("date.yesterday")
    }

    const match = date.match(/^(\d+)\s?days?\sago$/)
    if (match) {
      return t("date.days_ago", { count: Number(match[1]) })
    }

    return date
  }

  const formatSmartDate = (rawDate?: string | Date | null): string | null => {
    if (!rawDate) {
      return null
    }
    const date = dayjs(rawDate)
    const today = dayjs()
    const yesterday = today.subtract(1, "day")

    if (date.isSame(today, "day")) {
      return date.format("HH:mm")
    }
    if (date.isSame(yesterday, "day")) {
      return t("date.yesterday")
    }
    return date.format("DD.MM.YYYY")
  }

  return {
    ...base,
    humanDate,
    formatSmartDate,
  }
}
