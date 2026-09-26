import { uniq } from "@/utils/formatters"
import type { SearchRequestVariantDetail } from "@/types/responses/searchRequest"

const SPEC_PLACEHOLDERS = new Set(["", "-", "—", "–"])

function specValue(value: unknown): string | null {
  if (value == null) {
    return null
  }
  const str = String(value).trim()
  return SPEC_PLACEHOLDERS.has(str) ? null : str
}

export interface VariantSpecs {
  powerTypes: string[]
  displacements: (string | number)[]
  powers: number[]
  gearboxes: string[]
  drives: string[]
  bodies: string[]
  primaryImage: string | null
}

export function hydrateVariantSpecs(cars: any[] | undefined | null): VariantSpecs {
  const list = cars ?? []
  if (!list.length) {
    return {
      powerTypes: [],
      displacements: [],
      powers: [],
      gearboxes: [],
      drives: [],
      bodies: [],
      primaryImage: null,
    }
  }

  const pt: string[] = []
  const disp: (string | number)[] = []
  const pw: number[] = []
  const gb: string[] = []
  const dv: string[] = []
  const bd: string[] = []

  for (const c of list) {
    const powerType = specValue(c.short_power_type)
    if (powerType) {
      pt.push(powerType)
    }

    const displacement = specValue(c.displacement)
    if (displacement) {
      disp.push(displacement)
    }

    const power = Number(c.power)
    if (Number.isFinite(power) && power > 0) {
      pw.push(power)
    }

    const gearbox = specValue(c.short_gearbox ?? c.gearbox)
    if (gearbox) {
      gb.push(gearbox)
    }

    const drive = specValue(c.short_drive_type ?? c.drive_type)
    if (drive) {
      dv.push(drive)
    }

    const scale = specValue(c.short_scale_type ?? c.body_type)
    if (scale) {
      bd.push(scale)
    }
  }

  return {
    powerTypes: uniq(pt),
    displacements: uniq(disp),
    powers: uniq(pw),
    gearboxes: uniq(gb),
    drives: uniq(dv),
    bodies: uniq(bd),
    primaryImage: list[0]?.img || null,
  }
}

export function variantCarsForView(cars: any[] | undefined | null) {
  return (cars ?? [])
    .map((c: any) => {
      const rawId = c.car_id ?? c.carid ?? c.modelid ?? c.model_id ?? c.id
      const id = Number(rawId)
      if (!id || isNaN(id)) {
        return null
      }

      return {
        id,
        name: c.name ?? "",
        year: c.year,
        img: c.img,
        displacement: c.displacement,
        horsepower: c.power,
        geartype: c.short_gearbox ?? c.gearbox,
        driventype: c.short_drive_type ?? c.drive_type,
        shortscaletype: c.short_scale_type ?? c.body_type,
        params: undefined,
      }
    })
    .filter(Boolean)
}

export function variantColorNames(
  bodyColors: string[] | null | undefined,
  t: (key: string) => string,
): string[] {
  const colors = bodyColors ?? []
  return colors.map(c => c === "__any__" ? t("cars.colors.any") : t(`cars.colors.${c}`))
}

export function variantPriceTo(priceTo: number | string | null | undefined): number | null {
  if (priceTo == null || priceTo === "") {
    return null
  }
  const num = typeof priceTo === "string" ? Number(priceTo.replace(/\s/g, "")) : priceTo
  return Number.isFinite(num) ? num : null
}

export function variantLabel(
  variant: Pick<SearchRequestVariantDetail, "brand" | "series" | "year_from" | "year_to">,
  formatYearRange: (from?: number | null, to?: number | null) => string,
): string {
  const brand = variant?.brand?.name || ""
  const series = variant?.series?.name || ""
  const years = formatYearRange(variant?.year_from, variant?.year_to)
  return [brand, series, years].filter(Boolean).join(" ")
}

export function legacyVariantFromRequest(req: any): SearchRequestVariantDetail {
  return {
    id: 0,
    priority: 1,
    condition: req?.condition ?? "used",
    year_from: req?.year_from,
    year_to: req?.year_to,
    price_to: req?.price_to,
    mileage_to: req?.mileage_to,
    body_colors: req?.body_colors,
    original_paint: req?.original_paint,
    description: req?.description,
    description_ru: req?.description_ru,
    description_zh: req?.description_zh,
    description_original_locale: req?.description_original_locale,
    brand: req?.brand,
    series: req?.series,
    body_type: req?.body_type,
    cars: req?.cars,
  }
}
