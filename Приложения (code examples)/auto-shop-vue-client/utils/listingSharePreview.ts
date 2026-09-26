import type { ListingFull } from "~/types/responses/listing"
import { formatInt, formatProductionDate } from "@/utils/formatters"

type TranslateFn = (key: string, params?: Record<string, unknown>) => string

const SEO_SITE_NAME = "AutoShop"

export function buildListingSeoTitle(name: string): string {
  if (!name) {
    return SEO_SITE_NAME
  }

  return `🚙 ${name} - ${SEO_SITE_NAME}`
}

export function resolveListingShareImage(listing?: ListingFull | null): string {
  return listing?.photos?.[0]?.url ?? ""
}

function translateIfExists(t: TranslateFn, key: string, value?: string | null): string {
  if (!value) {
    return ""
  }
  const translationKey = `${key}.${value}`
  const translated = t(translationKey)
  return translated !== translationKey ? translated : value
}

function formatDisplacement(value?: string | null): string {
  if (!value) {
    return ""
  }
  const normalized = value.replace(".", ",")
  return normalized.includes("л") || normalized.includes("L") ? normalized : `${normalized} л`
}

function pickCalculationPort(calculations: ListingFull["calculations"]): string | null {
  if (!calculations) {
    return null
  }
  const ports = Object.keys(calculations)
  if (ports.includes("suifenhe")) {
    return "suifenhe"
  }
  return ports[0] ?? null
}

function resolveConditionText(listing: ListingFull): string {
  return listing.ol_description?.trim()
    || listing.description_ru?.trim()
    || listing.description_zh?.trim()
    || ""
}

export type ListingSharePreviewOptions = {
  showPrice?: boolean
  includeConditionText?: boolean
  conditionText?: string | null
}

export function buildListingSharePreview(
  listing: ListingFull,
  t: TranslateFn,
  pageUrl: string,
  options: ListingSharePreviewOptions = {},
): string {
  const showPrice = options.showPrice !== false
  const includeConditionText = options.includeConditionText !== false
  const lines: string[] = []

  if (listing.vin) {
    lines.push(t("catalog.detail.share_preview.vin", { vin: listing.vin }))
  }

  const specLines: string[] = []

  const productionDate = formatProductionDate(listing.release_year, listing.month)
  if (productionDate) {
    specLines.push(`${t("catalog.list.production_date")}: ${productionDate}`)
  }

  const engineParts: string[] = []
  const powerType = listing.car?.short_power_type || listing.car?.power_type
  if (powerType) {
    engineParts.push(translateIfExists(t, "cars.power_type", powerType).toLowerCase())
  }
  if (listing.car?.displacement) {
    engineParts.push(formatDisplacement(listing.car.displacement))
  }
  const horsePower = listing.car?.horse_power ?? listing.car?.engine_zdml
  if (horsePower) {
    engineParts.push(`${horsePower} ${t("catalog.detail.hp")}`)
  }
  if (engineParts.length > 0) {
    specLines.push(t("catalog.detail.share_preview.engine", { value: engineParts.join(", ") }))
  }

  const gearbox = listing.car?.gearbox
    || translateIfExists(t, "cars.gearbox", listing.car?.common_short_gearbox ?? "")
  if (gearbox) {
    specLines.push(t("catalog.detail.share_preview.gearbox", { value: gearbox.toLowerCase() }))
  }

  const drive = listing.car?.chassis_short_drive_type
    || listing.car?.chassis_driven_type
    || translateIfExists(t, "cars.drive_type", listing.car?.drive_type ?? "")
  if (drive) {
    specLines.push(t("catalog.detail.share_preview.drive", { value: drive.toLowerCase() }))
  }

  if (listing.mileage) {
    const mileage = `${formatInt(listing.mileage)} ${t("catalog.list.km")}`
    specLines.push(t("catalog.detail.share_preview.mileage", { value: mileage }))
  }

  if (listing.original_paint !== undefined && listing.original_paint !== null) {
    const paintStatus = listing.original_paint
      ? t("catalog.detail.original_paint_yes")
      : t("catalog.detail.original_paint_no")
    specLines.push(`${t("catalog.list.original_paint")}: ${paintStatus.toLowerCase()}`)
  }

  if (specLines.length > 0) {
    if (lines.length > 0) {
      lines.push("")
    }
    lines.push(...specLines)
  }

  const conditionText = options.conditionText ?? resolveConditionText(listing)
  if (includeConditionText && conditionText) {
    if (lines.length > 0) {
      lines.push("")
    }
    lines.push(`${t("listing.condition")}: ${conditionText}`)
  }

  const portCode = pickCalculationPort(listing.calculations)
  const total = portCode ? listing.calculations?.[portCode]?.total : null
  if (showPrice && portCode && total && !listing.price_locked) {
    const portName = translateIfExists(t, "cars.seaports", portCode) || portCode
    lines.push("")
    lines.push(`💰 ${t("catalog.detail.share_preview.price", { port: portName, price: formatInt(total) })}`)
  }

  lines.push("")
  lines.push(t("catalog.detail.share_preview.footer"))
  lines.push(pageUrl)

  const title = listing.name
    ? t("catalog.detail.share_preview.title", { name: listing.name })
    : ""
  const description = lines.join("\n")

  return title ? `${title}\n\n${description}` : description
}
