import { useI18n } from "vue-i18n"

export function useListingFormat() {
  const { t } = useI18n()

  const formatNumber = (num?: number): string =>
    typeof num === "number" ? new Intl.NumberFormat("ru-RU").format(num) : ""

  const formatPrice = (price?: number): string => formatNumber(price) || "—"

  const formatSpecs = (listing: any): string => {
    if (!listing) {
      return ""
    }
    const car = listing.car
    const parts: string[] = []

    let engineStr = ""
    if (car?.displacement) {
      engineStr += `${car.displacement} ${t("catalog.list.liter")}`
    }
    if (car?.engine_zdml) {
      engineStr += engineStr
        ? ` (${car.engine_zdml} ${t("catalog.detail.hp")})`
        : `${car.engine_zdml} ${t("catalog.detail.hp")}`
    }
    if (engineStr) {
      parts.push(engineStr)
    }

    if (car?.power_type) {
      parts.push(t(`cars.power_type.${car.power_type}`))
    }
    if (car?.common_short_gearbox) {
      parts.push(t(`cars.gearbox.${car.common_short_gearbox}`))
    }
    if (car?.chassis_driven_type) {
      parts.push(car.chassis_driven_type)
    }
    if (listing.mileage) {
      parts.push(`${formatNumber(listing.mileage)} ${t("catalog.list.km")}`)
    }

    return parts.join(", ")
  }

  const tryTranslate = (prefix: string, key: string): string => {
    if (!key) {
      return ""
    }
    const fullKey = `${prefix}.${key}`
    const translated = t(fullKey)
    return translated === fullKey ? key : translated
  }

  return { formatNumber, formatPrice, formatSpecs, tryTranslate }
}
