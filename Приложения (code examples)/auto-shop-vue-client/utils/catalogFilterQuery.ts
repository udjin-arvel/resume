import type { LocationQuery, LocationQueryRaw } from "vue-router"
import type { Filters } from "@/types/catalog/filter"

export const catalogFilterQueryKeys = [
  "buyer",
  "seller",
  "condition",
  "vin",
  "internal_number",
  "brand",
  "model",
  "price",
  "mileage",
  "gearbox",
  "power_type",
  "drive_type",
  "scale",
  "color",
  "visibility",
  "year_from",
  "year_to",
  "displacement_from",
  "displacement_to",
  "bought_at_from",
  "bought_at_to",
  "status",
  "equipment",
  "has_video",
  "has_diagnostics",
  "has_compensation",
  "original_paint",
] as const

const catalogFilterQueryKeySet = new Set<string>(catalogFilterQueryKeys)
const tokenPattern = /^[a-z0-9_-]+$/i
const positiveIntegerPattern = /^\d+$/
const allowedStatuses = new Set([
  "video_requested",
  "video_closed",
  "diagnostic_requested",
  "diagnostic_closed",
  "booking_requested",
  "diagnostic_subscribed",
  "awaiting_buyer_data",
  "added_buyer_data",
  "invoice_issued",
  "payment_docs_uploaded",
  "payment_received",
  "car_purchased",
  "car_docs_received",
  "export_docs_prepared",
  "sent_to_china_hub",
  "photo_from_transit",
  "prepared_for_ru_dispatch",
  "shipped_to_russia",
  "arrived_in_russia",
  "sent_to_cfs",
  "incident",
])

function firstValue(value: LocationQuery[string]): string | undefined {
  const rawValue = Array.isArray(value) ? value[0] : value
  return rawValue == null ? undefined : String(rawValue)
}

function arrayValue(value: LocationQuery[string]): string[] {
  const values = Array.isArray(value) ? value : [value]
  return values
    .filter((item): item is string => item != null)
    .map(String)
    .filter(item => tokenPattern.test(item))
}

function positiveInteger(value: LocationQuery[string]): string | undefined {
  const result = firstValue(value)
  return result && positiveIntegerPattern.test(result) && Number(result) > 0 ? result : undefined
}

function positiveNumber(value: LocationQuery[string]): number | undefined {
  const result = Number(firstValue(value))
  return Number.isFinite(result) && result > 0 ? result : undefined
}

function enumValue(value: LocationQuery[string], allowedValues: readonly string[]): string | undefined {
  const result = firstValue(value)
  return result && allowedValues.includes(result) ? result : undefined
}

function dateValue(value: LocationQuery[string]): Date | undefined {
  const result = firstValue(value)
  if (!result || !/^\d{4}-\d{2}-\d{2}$/.test(result)) {
    return undefined
  }

  const date = new Date(`${result}T00:00:00`)
  return Number.isNaN(date.getTime()) || formatDate(date) !== result ? undefined : date
}

function rangeOption(value: string | number | undefined) {
  if (typeof value === "undefined") {
    return undefined
  }

  return {
    id: Number(value),
    value,
    name: value,
    disabled: false,
  }
}

function optionValue(option: unknown): string | number | undefined {
  if (option && typeof option === "object" && "value" in option) {
    return (option as { value?: string | number }).value
  }
  return undefined
}

function formatDate(date: Date | undefined): string | undefined {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return undefined
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function hasCatalogFilterQuery(query: LocationQuery): boolean {
  return Object.keys(query).some(key => catalogFilterQueryKeySet.has(key))
}

export function withoutCatalogFilterQuery(query: LocationQuery): LocationQueryRaw {
  return Object.fromEntries(
    Object.entries(query).filter(([key]) => !catalogFilterQueryKeySet.has(key)),
  )
}

export function parseCatalogFilterQuery(query: LocationQuery, defaults: Filters): Filters {
  const currentYear = new Date().getFullYear()
  let yearFrom = positiveNumber(query.year_from)
  let yearTo = positiveNumber(query.year_to)
  let displacementFrom = positiveNumber(query.displacement_from)
  let displacementTo = positiveNumber(query.displacement_to)
  let boughtAtFrom = dateValue(query.bought_at_from)
  let boughtAtTo = dateValue(query.bought_at_to)
  const buyer = firstValue(query.buyer)
  const seller = firstValue(query.seller)
  const color = firstValue(query.color)

  yearFrom = yearFrom && yearFrom >= 2000 && yearFrom <= currentYear ? yearFrom : undefined
  yearTo = yearTo && yearTo >= 2000 && yearTo <= currentYear ? yearTo : undefined
  displacementFrom = displacementFrom && displacementFrom >= 0.8 && displacementFrom <= 6 ? displacementFrom : undefined
  displacementTo = displacementTo && displacementTo >= 0.8 && displacementTo <= 6 ? displacementTo : undefined

  if (yearFrom && yearTo && yearFrom > yearTo) {
    yearFrom = undefined
    yearTo = undefined
  }
  if (displacementFrom && displacementTo && displacementFrom > displacementTo) {
    displacementFrom = undefined
    displacementTo = undefined
  }
  if (boughtAtFrom && boughtAtTo && boughtAtFrom > boughtAtTo) {
    boughtAtFrom = undefined
    boughtAtTo = undefined
  }

  return {
    ...defaults,
    status: arrayValue(query.status).filter(value => allowedStatuses.has(value)),
    equipment: arrayValue(query.equipment).filter(value => positiveIntegerPattern.test(value) && Number(value) > 0),
    buyer: buyer && (positiveIntegerPattern.test(buyer) || buyer === "all") ? buyer : defaults.buyer,
    seller_id: seller && (positiveIntegerPattern.test(seller) || ["all", "mine"].includes(seller)) ? seller : defaults.seller_id,
    condition: enumValue(query.condition, ["all", "new", "used"]) ?? defaults.condition,
    vin: firstValue(query.vin)?.trim() || defaults.vin,
    internal_number: firstValue(query.internal_number)?.trim() || defaults.internal_number,
    brand: positiveInteger(query.brand) ?? defaults.brand,
    model: positiveInteger(query.model) ?? defaults.model,
    year: {
      left: rangeOption(yearFrom),
      right: rangeOption(yearTo),
    },
    displacement: {
      left: rangeOption(typeof displacementFrom === "number" ? displacementFrom.toFixed(1) : undefined),
      right: rangeOption(typeof displacementTo === "number" ? displacementTo.toFixed(1) : undefined),
    },
    price: positiveNumber(query.price),
    mileage: positiveInteger(query.mileage),
    gearbox: enumValue(query.gearbox, ["all", "mt", "at", "dct", "cvt", "am", "ecvt", "single", "dht", "other"]) ?? defaults.gearbox,
    power_type: enumValue(query.power_type, ["all", "petrol", "diesel", "hybrid", "electric", "gas"]) ?? defaults.power_type,
    drive_type: enumValue(query.drive_type, ["all", "awd", "fwd", "rwd"]) ?? defaults.drive_type,
    scale: enumValue(query.scale, ["all", "sedan", "hatchback", "wagon", "suv", "coupe", "cabriolet", "pickup", "minivan"]) ?? defaults.scale,
    color: color && tokenPattern.test(color) ? color : defaults.color,
    visibility: enumValue(query.visibility, ["all", "visible", "hidden"]) ?? defaults.visibility,
    hasVideo: firstValue(query.has_video) === "1",
    hasDiagnostics: firstValue(query.has_diagnostics) === "1",
    hasCompensation: firstValue(query.has_compensation) === "1",
    original_paint: firstValue(query.original_paint) === "1",
    bought_at: boughtAtFrom || boughtAtTo
      ? [boughtAtFrom, boughtAtTo] as unknown as [Date, Date]
      : null,
  }
}

export function serializeCatalogFilters(filters: Filters): LocationQueryRaw {
  const query: LocationQueryRaw = {}
  const yearFrom = optionValue(filters.year.left)
  const yearTo = optionValue(filters.year.right)
  const displacementFrom = optionValue(filters.displacement.left)
  const displacementTo = optionValue(filters.displacement.right)

  if (filters.status.length > 0) {
    query.status = filters.status
  }
  if (filters.equipment.length > 0) {
    query.equipment = filters.equipment
  }
  if (filters.buyer && filters.buyer !== "all") {
    query.buyer = filters.buyer
  }
  if (filters.seller_id && filters.seller_id !== "mine") {
    query.seller = filters.seller_id
  }
  if (filters.condition !== "all") {
    query.condition = filters.condition
  }
  if (filters.vin?.trim()) {
    query.vin = filters.vin.trim()
  }
  if (filters.internal_number?.trim()) {
    query.internal_number = filters.internal_number.trim()
  }
  if (filters.brand && filters.brand !== "all") {
    query.brand = filters.brand
  }
  if (filters.model && filters.model !== "all") {
    query.model = filters.model
  }
  if (typeof yearFrom !== "undefined") {
    query.year_from = String(yearFrom)
  }
  if (typeof yearTo !== "undefined") {
    query.year_to = String(yearTo)
  }
  if (typeof displacementFrom !== "undefined") {
    query.displacement_from = String(displacementFrom)
  }
  if (typeof displacementTo !== "undefined") {
    query.displacement_to = String(displacementTo)
  }
  if (filters.price) {
    query.price = String(filters.price)
  }
  if (filters.mileage) {
    query.mileage = String(filters.mileage)
  }
  if (filters.gearbox !== "all") {
    query.gearbox = filters.gearbox
  }
  if (filters.power_type !== "all") {
    query.power_type = filters.power_type
  }
  if (filters.drive_type !== "all") {
    query.drive_type = filters.drive_type
  }
  if (filters.scale !== "all") {
    query.scale = filters.scale
  }
  if (filters.color !== "all") {
    query.color = filters.color
  }
  if (filters.visibility && filters.visibility !== "all") {
    query.visibility = filters.visibility
  }
  if (filters.hasVideo) {
    query.has_video = "1"
  }
  if (filters.hasDiagnostics) {
    query.has_diagnostics = "1"
  }
  if (filters.hasCompensation) {
    query.has_compensation = "1"
  }
  if (filters.original_paint) {
    query.original_paint = "1"
  }

  const boughtAtFrom = formatDate(filters.bought_at?.[0])
  const boughtAtTo = formatDate(filters.bought_at?.[1])
  if (boughtAtFrom) {
    query.bought_at_from = boughtAtFrom
  }
  if (boughtAtTo) {
    query.bought_at_to = boughtAtTo
  }

  return query
}
