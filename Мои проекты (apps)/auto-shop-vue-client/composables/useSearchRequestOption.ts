import { useI18n } from "vue-i18n"
import type { SearchRequestForListingRequestOption } from "@/types/responses/searchRequestForListingRequest"

export function useSearchRequestOption() {
  const { t, locale } = useI18n()

  function number(id: number) {
    return `№${String(id).padStart(4, "0")}`
  }

  function title(option: SearchRequestForListingRequestOption) {
    const years = option.year_from && option.year_to
      ? (option.year_from === option.year_to ? String(option.year_from) : `${option.year_from}–${option.year_to}`)
      : (option.year_from ? `${option.year_from}+` : (option.year_to ? t("catalog.need_selection.up_to", { value: option.year_to }) : ""))
    const name = option.brand && option.series?.toLowerCase().startsWith(`${option.brand.toLowerCase()} `)
      ? option.series
      : [option.brand, option.series].filter(Boolean).join(" ")
    return [name, years].filter(Boolean).join(" ") || t("catalog.need_selection.label")
  }

  function details(option: SearchRequestForListingRequestOption) {
    return [
      option.engine_type,
      option.engine,
      option.horse_power ? t("catalog.need_selection.power", { value: option.horse_power }) : null,
      option.price_to ? t("catalog.need_selection.up_to", { value: `${new Intl.NumberFormat(locale.value).format(option.price_to)} ¥` }) : null,
    ].filter(Boolean).join(", ")
  }

  return { number, title, details }
}
