<template>
  <div
    v-if="!variants.length"
    :class="$style.emptyState"
  >
    {{ t('needs.trims.no_cars') }}
  </div>

  <div
    v-else
    :class="$style.wrapper"
  >
    <div :class="$style.carBar">
      <div :class="$style.carBarClip">
        <div
          :class="$style.carBarStickyOverlay"
          aria-hidden="true"
        />
        <div
          ref="carBarInnerRef"
          :class="$style.carBarInner"
        >
          <div
            v-for="variant in variants"
            :key="variant.id || variant.priority"
            :class="$style.carCardCell"
          >
            <div :class="$style.carCard">
              <div :class="$style.carHeaderContent">
                <img
                  v-if="variantImage(variant)"
                  :src="variantImage(variant)!"
                  :alt="variantHeader(variant)"
                  :class="$style.carThumb"
                  loading="lazy"
                >
                <div
                  v-else
                  :class="$style.carThumbPlaceholder"
                />
                <div :class="$style.carInfo">
                  <span :class="$style.priorityBadge">
                    {{ t('needs.form.priority_label', { n: variant.priority }) }}
                  </span>
                  <span :class="$style.carName">{{ variantHeader(variant) }}</span>
                  <span :class="$style.carSubtext">
                    {{ variantSubtext(variant) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      ref="tableAreaRef"
      :class="$style.tableArea"
      @scroll="onTableScroll"
    >
      <table :class="$style.table">
        <tbody>
          <template
            v-for="row in visibleRows"
            :key="row.key"
          >
            <tr
              v-if="row.isSection"
              :id="`compare-section-${row.id}`"
            >
              <td
                :colspan="variants.length + 1"
                :class="$style.sectionRow"
              >
                <div :class="$style.sectionLabel">
                  {{ row.name }}
                </div>
              </td>
            </tr>

            <tr
              v-else
              :class="$style.paramRow"
            >
              <td :class="$style.labelCell">
                {{ row.name }}
              </td>
              <td
                v-for="(val, i) in row.values"
                :key="i"
                :class="$style.valueCell"
              >
                <template v-if="Array.isArray(val)">
                  <ol
                    v-if="val.length"
                    class="list-decimal pl-4 space-y-1"
                  >
                    <li
                      v-for="(item, j) in val"
                      :key="j"
                    >
                      {{ item }}
                    </li>
                  </ol>
                  <span v-else>—</span>
                </template>
                <template v-else>
                  {{ val || '—' }}
                </template>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue"
import { useI18n } from "vue-i18n"
import { formatInt } from "@/utils/formatters"
import {
  hydrateVariantSpecs,
  variantColorNames,
  variantPriceTo,
} from "@/composables/needs/useVariantSpecs"
import type { SearchRequestVariantDetail } from "@/types/responses/searchRequest"

const props = defineProps<{
  variants: SearchRequestVariantDetail[]
}>()

const { t, locale } = useI18n()

const carBarInnerRef = ref<HTMLElement | null>(null)
const tableAreaRef = ref<HTMLElement | null>(null)

const formatYearRange = (from?: number | null, to?: number | null) => {
  if (from && to) {
    return `${from}—${to}`
  }
  if (from) {
    return `${t("common.from")} ${from}`
  }
  if (to) {
    return `${t("common.to")} ${to}`
  }
  return ""
}

const formatBoolean = (val: unknown) => {
  if (val === true || val === "true" || val === 1 || val === "1") {
    return t("common.yes")
  }
  if (val === false || val === "false" || val === 0 || val === "0") {
    return t("common.no")
  }
  return "—"
}

function variantImage(variant: SearchRequestVariantDetail): string | null {
  return hydrateVariantSpecs(variant.cars).primaryImage
}

function variantHeader(variant: SearchRequestVariantDetail): string {
  const brand = variant.brand?.name || ""
  const series = variant.series?.name || ""
  return [brand, series].filter(Boolean).join(" ") || t("needs.form.variant_unnamed", { n: variant.priority })
}

function variantSubtext(variant: SearchRequestVariantDetail): string {
  const years = formatYearRange(variant.year_from, variant.year_to)
  const trimCount = variant.cars?.length ?? 0
  const trimsLabel = trimCount
    ? t("needs.trims.trims_count", { count: trimCount })
    : ""
  return [years, trimsLabel].filter(Boolean).join(" • ")
}

function variantRowValues(
  getter: (variant: SearchRequestVariantDetail, specs: ReturnType<typeof hydrateVariantSpecs>) => string | string[] | null,
): (string | string[])[] {
  return props.variants.map((variant) => {
    const specs = hydrateVariantSpecs(variant.cars)
    const val = getter(variant, specs)
    if (val == null || val === "") {
      return "—"
    }
    if (Array.isArray(val)) {
      return val.length ? val : "—"
    }
    return val
  })
}

const visibleRows = computed(() => {
  if (!props.variants.length) {
    return []
  }

  const rows: any[] = []

  rows.push({
    key: "section-overview",
    isSection: true,
    id: "overview",
    name: t("needs.trims.overview"),
  })

  const paramRows: Array<{ key: string, name: string, values: (string | string[])[] }> = [
    {
      key: "condition",
      name: t("needs.detail.condition"),
      values: variantRowValues(v => v.condition ? t(`needs.detail.conditions.${v.condition}`) : null),
    },
    {
      key: "brand",
      name: t("needs.detail.brand"),
      values: variantRowValues(v => v.brand?.name ?? null),
    },
    {
      key: "model",
      name: t("needs.detail.model"),
      values: variantRowValues(v => v.series?.name ?? null),
    },
    {
      key: "year",
      name: t("needs.detail.year_range"),
      values: variantRowValues(v => formatYearRange(v.year_from, v.year_to) || null),
    },
    {
      key: "engine_type",
      name: t("needs.detail.engine_type"),
      values: variantRowValues((_, specs) =>
        specs.powerTypes.length
          ? specs.powerTypes.map(v => t(`cars.power_type.${v}`)).join(", ")
          : null,
      ),
    },
    {
      key: "engine",
      name: t("needs.detail.engine"),
      values: variantRowValues((_, specs) =>
        specs.displacements.length ? specs.displacements.map(String).join(", ") : null,
      ),
    },
    {
      key: "power",
      name: t("needs.detail.power"),
      values: variantRowValues((_, specs) =>
        specs.powers.length ? specs.powers.map(String).join(", ") : null,
      ),
    },
    {
      key: "transmission",
      name: t("needs.detail.transmission"),
      values: variantRowValues((_, specs) =>
        specs.gearboxes.length ? specs.gearboxes.map(v => t(`cars.gearbox.${v}`)).join(", ") : null,
      ),
    },
    {
      key: "drive",
      name: t("needs.detail.drive"),
      values: variantRowValues((_, specs) =>
        specs.drives.length ? specs.drives.map(v => t(`cars.drive_type.${v}`)).join(", ") : null,
      ),
    },
    {
      key: "equipment",
      name: t("needs.detail.equipment"),
      values: variantRowValues(v =>
        (v.cars ?? []).map(c => c.name || String(c.car_id)).filter(Boolean),
      ),
    },
    {
      key: "scale",
      name: t("needs.detail.scale"),
      values: variantRowValues((_, specs) =>
        specs.bodies.length ? specs.bodies.map(v => t(`cars.scale_type.${v}`)).join(", ") : null,
      ),
    },
    {
      key: "body_color",
      name: t("needs.detail.body_color"),
      values: variantRowValues(v =>
        variantColorNames(v.body_colors, t).length
          ? variantColorNames(v.body_colors, t).join(", ")
          : null,
      ),
    },
    {
      key: "original_paint",
      name: t("common.original_paint"),
      values: variantRowValues(v => formatBoolean(v.original_paint)),
    },
    {
      key: "mileage",
      name: t("needs.detail.mileage_up_to"),
      values: variantRowValues(v =>
        v.mileage_to ? formatInt(v.mileage_to as number, locale.value) : null,
      ),
    },
    {
      key: "price",
      name: t("needs.detail.price_up_to"),
      values: variantRowValues((v) => {
        const price = variantPriceTo(v.price_to)
        return price !== null ? formatInt(price, locale.value) : null
      }),
    },
    {
      key: "description",
      name: t("needs.detail.other_wishes"),
      values: variantRowValues(v =>
        v.description_ru || v.description_zh || v.description || null,
      ),
    },
  ]

  for (const row of paramRows) {
    if (row.values.some(v => v !== "—" && (Array.isArray(v) ? v.length > 0 : true))) {
      rows.push({ ...row, isSection: false })
    }
  }

  return rows
})

function onTableScroll() {
  if (carBarInnerRef.value && tableAreaRef.value) {
    carBarInnerRef.value.style.transform = `translateX(-${tableAreaRef.value.scrollLeft}px)`
  }
}
</script>

<style module>
.wrapper {
  @apply flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white h-full;
}

.carBar {
  @apply flex flex-row shrink-0 bg-white z-10 border-b border-gray-200;
}

.carBarClip {
  @apply w-full min-w-0 relative bg-white;
}

.carBarStickyOverlay {
  @apply absolute left-0 top-0 bottom-0 w-[120px] bg-white pointer-events-none lg:w-[200px];
}

.carBarInner {
  @apply flex will-change-transform pl-[120px] pr-0 lg:pl-[200px];
}

.carCardCell {
  @apply w-[260px] min-w-[260px] max-w-[260px] h-[96px] p-1.5 shrink-0 lg:w-[438px] lg:min-w-[438px] lg:max-w-[438px] lg:h-28 lg:p-2;
}

.tableArea {
  @apply flex-1 min-w-0 overflow-auto;
}

.table {
  @apply border-collapse;
}

.carCard {
  @apply bg-white border border-gray-200 rounded-lg overflow-hidden h-full flex items-center;
}

.carHeaderContent {
  @apply flex flex-row items-center gap-3 px-3 w-full;
}

.carThumb {
  @apply object-cover rounded shrink-0 w-[72px] h-[54px];
}

.carThumbPlaceholder {
  @apply rounded shrink-0 bg-gray-100 w-[72px] h-[54px];
}

.carInfo {
  @apply flex flex-col gap-0.5 min-w-0;
}

.priorityBadge {
  @apply text-xs font-medium text-blue-700;
}

.carName {
  @apply text-sm font-medium leading-tight truncate text-[#1A1117];
}

.carSubtext {
  @apply text-xs truncate text-[#757575];
}

.sectionRow {
  @apply bg-white border-b border-gray-200 pt-3 pb-2 align-bottom;
}

.sectionLabel {
  @apply inline-block sticky left-0 -ml-px font-normal leading-[1.2] text-[#1A1117] whitespace-nowrap text-base px-3 lg:text-xl lg:px-4;
}

.paramRow:hover .labelCell,
.paramRow:hover .valueCell {
  @apply bg-gray-50;
}

.labelCell {
  @apply sticky left-0 z-10 bg-white py-2 px-[10px] text-[13px] font-normal text-[#757575] align-top min-w-[120px] max-w-[120px] w-[120px] border-b border-gray-100 lg:px-4 lg:text-base lg:min-w-[200px] lg:max-w-[200px] lg:w-[200px];
}

.valueCell {
  @apply py-2 px-[10px] text-[13px] font-normal text-[#1A1117] align-top w-[260px] min-w-[260px] max-w-[260px] border-b border-gray-100 lg:px-4 lg:text-base lg:w-[438px] lg:min-w-[438px] lg:max-w-[438px];
}

.emptyState {
  @apply text-gray-400 text-sm py-8 text-center;
}
</style>
