import type { NeedVariantFormState, SearchRequestVariantPayload, SearchRequestCar } from "@/types/requests/searchRequest"
import type { OptionBase } from "@/types/form/optionType"

export function createEmptyVariant(priority = 1): NeedVariantFormState {
  return {
    localId: `v-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    priority,
    condition: "used",
    brand: undefined,
    series: undefined,
    models: [],
    yearFrom: null,
    yearTo: null,
    priceTo: null,
    mileageTo: null,
    bodyColors: undefined,
    originalPaint: false,
    description: "",
    filters: {},
  }
}

export function normalizePriorities(variants: NeedVariantFormState[]): NeedVariantFormState[] {
  return variants.map((v, index) => ({
    ...v,
    priority: index + 1,
  }))
}

function optionNumericId(option?: OptionBase): number | undefined {
  if (!option) {
    return undefined
  }
  const raw = option.value ?? option.id
  const numeric = Number(raw)
  return Number.isFinite(numeric) ? numeric : undefined
}

export function variantToPayload(variant: NeedVariantFormState): SearchRequestVariantPayload {
  const brandId = optionNumericId(variant.brand)
  const seriesId = optionNumericId(variant.series)

  const ids: number[] = Array.isArray(variant.models)
    ? variant.models
        .map((o: any) => {
          const raw = o?.value ?? o?.id ?? o
          if (String(raw) === "__any_model__") {
            return Number.NaN
          }
          return Number(raw)
        })
        .filter((n: number) => Number.isFinite(n) && n > 0)
    : []

  let cars: SearchRequestCar[] = ids.map((id: number) => ({
    car_id: id,
    brand_id: brandId ?? null,
    series_id: seriesId ?? null,
    model_id: id,
  }))

  if (cars.length === 0 && (seriesId || brandId)) {
    const fallbackCarId = seriesId ?? brandId ?? 0
    if (fallbackCarId !== 0) {
      cars = [{
        car_id: fallbackCarId,
        brand_id: brandId ?? null,
        series_id: seriesId ?? null,
        model_id: null,
      }]
    }
  }

  const raw = variant.bodyColors as Array<{ value: unknown }> | undefined
  const hasAny = !!raw?.some(v => String(v?.value) === "__any__")
  const body_colors = hasAny
    ? null
    : (raw ?? [])
        .map(v => String(v?.value))
        .filter(s => s.length > 0)

  return {
    id: variant.id,
    priority: variant.priority,
    condition: variant.condition,
    year_from: variant.yearFrom,
    year_to: variant.yearTo,
    price_to: variant.priceTo,
    mileage_to: variant.mileageTo,
    body_colors: body_colors?.length ? body_colors : null,
    original_paint: variant.originalPaint === true,
    description: variant.description || "",
    cars,
  }
}

export function useNeedVariantsForm() {
  const variants = ref<NeedVariantFormState[]>([createEmptyVariant(1)])
  const activeIndex = ref(0)

  const activeVariant = computed(() => variants.value[activeIndex.value] ?? variants.value[0])

  const addVariant = (seed?: Partial<NeedVariantFormState>) => {
    const next = createEmptyVariant(variants.value.length + 1)
    Object.assign(next, seed ?? {})
    variants.value = normalizePriorities([...variants.value, next])
    activeIndex.value = variants.value.length - 1
    return variants.value[activeIndex.value]
  }

  const removeVariant = (index: number) => {
    if (variants.value.length <= 1) {
      return
    }
    const next = variants.value.filter((_, i) => i !== index)
    variants.value = normalizePriorities(next)
    activeIndex.value = Math.min(activeIndex.value, variants.value.length - 1)
  }

  const setActive = (index: number) => {
    if (index >= 0 && index < variants.value.length) {
      activeIndex.value = index
    }
  }

  const replaceVariantAt = (index: number, nextVariant: NeedVariantFormState) => {
    if (index < 0 || index >= variants.value.length) {
      return
    }
    const next = [...variants.value]
    next[index] = {
      ...nextVariant,
      priority: next[index]?.priority ?? nextVariant.priority,
    }
    variants.value = next
  }

  const moveVariant = (from: number, to: number) => {
    if (from < 0 || to < 0 || from >= variants.value.length || to >= variants.value.length) {
      return
    }
    const next = [...variants.value]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    variants.value = normalizePriorities(next)
    activeIndex.value = to
  }

  const replaceAll = (items: NeedVariantFormState[]) => {
    variants.value = normalizePriorities(items.length ? items : [createEmptyVariant(1)])
    activeIndex.value = 0
  }

  const toPayload = () => variants.value.map(variantToPayload)

  return {
    variants,
    activeIndex,
    activeVariant,
    addVariant,
    removeVariant,
    setActive,
    replaceVariantAt,
    moveVariant,
    replaceAll,
    toPayload,
    createEmptyVariant,
    normalizePriorities,
  }
}

export function brandSeriesLabel(variant: NeedVariantFormState): string {
  const brand = String(variant.brand?.name ?? "").trim()
  const series = String(variant.series?.name ?? "").trim()
  return [brand, series].filter(Boolean).join(" ")
}

export function optionFromEntity(source: any, options: OptionBase[], explicitId?: any): OptionBase | undefined {
  if (!options?.length) {
    return undefined
  }

  let id: number | string | undefined = explicitId
  if (id == null && source != null) {
    if (typeof source === "object") {
      id = source.id ?? source.value
    }
    else if (typeof source === "number" || typeof source === "string") {
      id = source
    }
  }

  if (id != null && String(id).trim() !== "") {
    const numericId = Number(id)
    if (Number.isFinite(numericId)) {
      const found = options.find(o => Number(o.value) === numericId)
      if (found) {
        return found
      }
    }
    const strId = String(id).trim().toLowerCase()
    const found = options.find(o => String(o.value).trim().toLowerCase() === strId)
    if (found) {
      return found
    }
  }

  let searchName: string | undefined
  if (typeof source === "object" && source?.name) {
    searchName = String(source.name).trim().toLowerCase()
  }
  else if (typeof source === "string") {
    searchName = source.trim().toLowerCase()
  }

  if (searchName) {
    return options.find(o => String(o.name).trim().toLowerCase() === searchName)
  }

  return undefined
}
