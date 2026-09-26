import dayjs from "dayjs"

export function useDate() {
  const ts = (raw?: string | Date | null): number => {
    if (!raw) {
      return 0
    }
    const d = dayjs(raw)
    return d.isValid() ? d.valueOf() : 0
  }

  const humanDate = (rawDate?: string | Date | null): string | null => {
    if (!rawDate) {
      return null
    }

    const date = dayjs(rawDate)
    const today = dayjs()
    const yesterday = today.subtract(1, "day")

    if (date.isSame(today, "day")) {
      return "Today"
    }
    if (date.isSame(yesterday, "day")) {
      return "Yesterday"
    }

    const diffDays = today.diff(date, "day")
    if (diffDays >= 1) {
      return `${diffDays} days ago`
    }

    return date.fromNow()
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
      return "Yesterday"
    }
    return date.format("DD.MM.YYYY")
  }

  const formatDate = (rawDate?: string | Date | null, format = "YYYY-MM-DD"): string | null => {
    if (!rawDate) {
      return null
    }
    return dayjs(rawDate).format(format)
  }

  const formatDateTime = (rawDate?: string | Date | null, format = "YYYY-MM-DD HH:mm"): string | null => {
    if (!rawDate) {
      return null
    }
    return dayjs(rawDate).format(format)
  }

  return { formatSmartDate, humanDate, formatDate, formatDateTime, ts }
}
