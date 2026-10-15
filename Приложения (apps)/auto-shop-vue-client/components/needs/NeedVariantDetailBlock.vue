<template>
  <div :class="$style.block">
    <div
      v-if="showPriority"
      :class="$style.blockHeader"
    >
      <Label
        kind="blue"
        :text="t('needs.form.priority_label', { n: variant.priority })"
      />
      <span :class="$style.blockTitle">{{ headerLabel }}</span>
    </div>

    <div :class="$style.specs">
      <div :class="$style.specRowNoBorder">
        <span :class="$style.specLabel">{{ t("needs.detail.condition") }}</span>
        <span :class="$style.specValue">
          {{ variant.condition ? t(`needs.detail.conditions.${variant.condition}`) : '—' }}
        </span>
      </div>

      <div
        v-if="variant.brand?.name"
        :class="$style.specRowNoBorder"
      >
        <span :class="$style.specLabel">{{ t("needs.detail.brand") }}</span>
        <span :class="$style.specValue">{{ variant.brand.name }}</span>
      </div>

      <div
        v-if="variant.series?.name"
        :class="$style.specRowNoBorder"
      >
        <span :class="$style.specLabel">{{ t("needs.detail.model") }}</span>
        <span :class="$style.specValue">{{ variant.series.name }}</span>
      </div>

      <div
        v-if="variant.year_from || variant.year_to"
        :class="$style.specRow"
      >
        <span :class="$style.specLabel">{{ t("needs.detail.year_range") }}</span>
        <span :class="$style.specValue">{{ yearRange }}</span>
      </div>

      <div
        v-if="specs.powerTypes.length"
        :class="$style.specRow"
      >
        <span :class="$style.specLabel">{{ t("needs.detail.engine_type") }}</span>
        <span :class="$style.specValue">
          <ul :class="[specs.powerTypes.length > 1 ? 'list-disc' : 'list-none pl-0', 'inline-block text-left']">
            <li
              v-for="v in specs.powerTypes"
              :key="v"
              class="flex items-center"
            >
              <span>{{ t(`cars.power_type.${v}`) }}</span>
              <LabelTooltip
                v-if="v === PowerTypeHybrid"
                :icon="InformationCircleIcon"
                tooltip-text="catalog.common.hybrid_tooltip"
                kind="unset"
                class="flex flex-shrink-0 items-center justify-center w-5 h-5 ml-1 text-gray-500 opacity-70 hover:opacity-100 transition-opacity"
              />
            </li>
          </ul>
        </span>
      </div>

      <div
        v-if="specs.displacements.length"
        :class="$style.specRow"
      >
        <span :class="$style.specLabel">{{ t("needs.detail.engine") }}</span>
        <span :class="$style.specValue">
          <ul :class="[specs.displacements.length > 1 ? 'list-disc' : 'list-none pl-0', 'inline-block text-left']">
            <li
              v-for="v in specs.displacements"
              :key="v"
            >{{ v }}</li>
          </ul>
        </span>
      </div>

      <div
        v-if="specs.powers.length"
        :class="$style.specRow"
      >
        <span :class="$style.specLabel">{{ t("needs.detail.power") }}</span>
        <span :class="$style.specValue">
          <ul :class="[specs.powers.length > 1 ? 'list-disc' : 'list-none pl-0', 'inline-block text-left']">
            <li
              v-for="v in specs.powers"
              :key="v"
            >{{ v }}</li>
          </ul>
        </span>
      </div>

      <div
        v-if="specs.gearboxes.length"
        :class="$style.specRow"
      >
        <span :class="$style.specLabel">{{ t("needs.detail.transmission") }}</span>
        <span :class="$style.specValue">
          <ul :class="[specs.gearboxes.length > 1 ? 'list-disc' : 'list-none pl-0', 'inline-block text-left']">
            <li
              v-for="v in specs.gearboxes"
              :key="v"
            >{{ t(`cars.gearbox.${v}`) }}</li>
          </ul>
        </span>
      </div>

      <div
        v-if="specs.drives.length"
        :class="$style.specRow"
      >
        <span :class="$style.specLabel">{{ t("needs.detail.drive") }}</span>
        <span :class="$style.specValue">
          <ul :class="[specs.drives.length > 1 ? 'list-disc' : 'list-none', 'space-y-2 inline-block text-left']">
            <li
              v-for="v in specs.drives"
              :key="v"
            >{{ t(`cars.drive_type.${v}`) }}</li>
          </ul>
        </span>
      </div>

      <div
        v-if="variantCars.length"
        :class="$style.specRowNoBorder"
      >
        <span :class="$style.specLabel">{{ t("needs.detail.equipment") }}</span>
        <span :class="$style.specValue">
          <ol :class="[(variantCars.length > 1 ? 'list-decimal' : 'list-none'), 'space-y-2 text-left']">
            <li
              v-for="(c, idx) in displayedCars"
              :key="c.car_id ?? idx"
            >{{ c.name || c.car_id }}</li>
          </ol>
          <button
            v-if="variantCars.length > CARS_PREVIEW_LIMIT"
            type="button"
            :class="$style.toggleCarsButton"
            @click="showAllCars = !showAllCars"
          >
            <template v-if="!showAllCars">
              {{ t('needs.detail.show_more_equipment', { count: remainingCarsCount }) }}
              <ChevronDownIcon :class="$style.toggleCarsIcon" />
            </template>
            <template v-else>
              {{ t('needs.detail.collapse') }}
              <ChevronDownIcon :class="[$style.toggleCarsIcon, $style.rotated]" />
            </template>
          </button>
        </span>
      </div>

      <div
        v-if="specs.bodies.length"
        :class="$style.specRow"
      >
        <span :class="$style.specLabel">{{ t("needs.detail.scale") }}</span>
        <span :class="$style.specValue">
          <ul :class="[specs.bodies.length > 1 ? 'list-disc' : 'list-none', 'space-y-2 inline-block text-left']">
            <li
              v-for="v in specs.bodies"
              :key="v"
            >{{ t(`cars.scale_type.${v}`) }}</li>
          </ul>
        </span>
      </div>

      <div
        v-if="colorNames.length"
        :class="$style.specRow"
      >
        <span :class="$style.specLabel">{{ t("needs.detail.body_color") }}</span>
        <span :class="$style.specValue">
          <ul :class="[colorNames.length > 1 ? 'list-disc' : 'list-none', 'space-y-2 inline-block text-left']">
            <li
              v-for="v in colorNames"
              :key="v"
            >{{ v }}</li>
          </ul>
        </span>
      </div>

      <div :class="$style.specRow">
        <span :class="$style.specLabel">{{ t("common.original_paint") }}</span>
        <span :class="$style.specValue">{{ formatBoolean(variant.original_paint) }}</span>
      </div>

      <div
        v-if="variant.mileage_to"
        :class="$style.specRow"
      >
        <span :class="$style.specLabel">{{ t("needs.detail.mileage_up_to") }}</span>
        <span :class="$style.specValue">{{ formatInt(variant.mileage_to as number, locale) }}</span>
      </div>

      <div
        v-if="priceTo !== null"
        :class="$style.specRow"
      >
        <span :class="$style.specLabel">{{ t('needs.detail.price_up_to') }}</span>
        <span :class="$style.specValue">{{ formatInt(priceTo, locale) }}</span>
      </div>

      <div
        v-if="variant.description"
        :class="$style.specRow"
      >
        <span :class="$style.specLabel">{{ t("needs.detail.other_wishes") }}</span>
        <span :class="[$style.specValue, 'w-full']">
          <TranslatableWrapper
            :data="variant"
            :config="{
              keys: {
                ru: 'description_ru',
                zh: 'description_zh',
                original: 'description_original_locale',
              },
            }"
            control-class="absolute top-0 right-0 z-10"
            class="relative pr-8"
          >
            <template #default="{ displayedText }">
              <span class="whitespace-pre-wrap">{{ displayedText }}</span>
            </template>
          </TranslatableWrapper>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import { useI18n } from "vue-i18n"
import { InformationCircleIcon } from "@heroicons/vue/24/outline"
import { ChevronDownIcon } from "@heroicons/vue/24/solid"
import { formatInt } from "@/utils/formatters"
import Label from "@/components/common/Label.vue"
import LabelTooltip from "@/components/common/LabelTooltip.vue"
import TranslatableWrapper from "@/components/common/TranslatableWrapper.vue"
import {
  hydrateVariantSpecs,
  variantColorNames,
  variantPriceTo,
  variantLabel,
} from "@/composables/needs/useVariantSpecs"
import type { SearchRequestVariantDetail } from "@/types/responses/searchRequest"
import { PowerTypeHybrid } from "@/constants/cars"

const props = defineProps<{
  variant: SearchRequestVariantDetail
  showPriority?: boolean
}>()

const { t, locale } = useI18n()

const CARS_PREVIEW_LIMIT = 5
const showAllCars = ref(false)

const showPriority = computed(() => props.showPriority !== false)

const variantCars = computed(() => props.variant.cars ?? [])

const displayedCars = computed(() =>
  showAllCars.value ? variantCars.value : variantCars.value.slice(0, CARS_PREVIEW_LIMIT),
)

const remainingCarsCount = computed(() => variantCars.value.length - CARS_PREVIEW_LIMIT)

const specs = computed(() => hydrateVariantSpecs(variantCars.value))

const colorNames = computed(() => variantColorNames(props.variant.body_colors, t))

const priceTo = computed(() => variantPriceTo(props.variant.price_to))

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

const yearRange = computed(() => formatYearRange(props.variant.year_from, props.variant.year_to))

const headerLabel = computed(() => variantLabel(props.variant, formatYearRange))

const formatBoolean = (val: unknown) => {
  if (val === true || val === "true" || val === 1 || val === "1") {
    return t("common.yes")
  }
  if (val === false || val === "false" || val === 0 || val === "0") {
    return t("common.no")
  }
  return "—"
}
</script>

<style module>
.block {
  @apply border border-gray-200 rounded-lg p-4 mb-4 last:mb-0 bg-gray-50/50;
}

.blockHeader {
  @apply flex flex-wrap items-center gap-2 mb-4 pb-3 border-b border-gray-200;
}

.blockTitle {
  @apply text-lg font-semibold text-gray-900;
}

.specs {
  @apply space-y-1;
}

.specRowNoBorder,
.specRow {
  @apply grid grid-cols-1 sm:grid-cols-2 sm:items-start sm:gap-x-8 py-2;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.specLabel {
  @apply text-gray-600 font-medium mb-1 sm:mb-0 text-left;
}

.specValue {
  @apply text-gray-900 text-left break-words;
}

.toggleCarsButton {
  @apply inline-flex items-center gap-1 mt-1 text-sm text-red-600 hover:text-red-800 font-medium transition-colors;
}

.toggleCarsIcon {
  @apply w-4 h-4 transition-transform;
}

.rotated {
  @apply rotate-180;
}
</style>
