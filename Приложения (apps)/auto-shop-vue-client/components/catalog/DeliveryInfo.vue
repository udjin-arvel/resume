<template>
  <div :class="$style.deliveryBlock">
    <div :class="$style.deliveryTitle">
      {{ t('catalog.detail.delivery_calc') }}
    </div>
    <div :class="$style.deliveryRow">
      <div :class="$style.deliveryColValue">
        {{ t('catalog.detail.car_location_city') }}
      </div>
      <div :class="$style.deliveryColValue">
        {{ locationName }}
      </div>
    </div>
    <div :class="$style.deliveryRow">
      <div :class="$style.deliveryColValue">
        {{ t('catalog.detail.delivery_port') }}
      </div>
      <div :class="$style.deliveryColValue">
        <Select
          v-model="localSelectedPort"
          :options="deliveryPorts"
        />
      </div>
    </div>
    <div :class="$style.deliverySumBlock">
      <div :class="$style.deliverySumLabel">
        {{ t('catalog.detail.cost') }}
        <template v-if="!isCalcLocked">
          {{ formatPrice(calcResult.cost) }} {{ currencySymbol }}
        </template>
        <span
          v-else
          :class="$style.lockedValue"
        >
          <span :class="$style.fakePriceLine" />
          <LockClosedIcon :class="$style.lockIcon" />
        </span>
      </div>
      <div :class="$style.deliverySumLabel">
        {{ t('catalog.detail.china_expenses') }}
        <template v-if="!isCalcLocked">
          {{ formatPrice((calcResult.chinaExpenses || 0) + (calcResult.deliveryCost || 0)) }} {{ currencySymbol }}
        </template>
        <span
          v-else
          :class="$style.lockedValue"
        >
          <span :class="$style.fakePriceLine" />
          <LockClosedIcon :class="$style.lockIcon" />
        </span>
      </div>
      <div :class="$style.deliverySumTo">
        {{ t('catalog.detail.total_delivery_sum') }}
      </div>
      <div :class="$style.deliverySumValue">
        <template v-if="!isCalcLocked">
          {{ formatPrice(calcResult.total) }} {{ currencySymbol }}
        </template>
        <span
          v-else
          :class="$style.lockedValue"
        >
          <span :class="$style.fakeTotalLine" />
          <LockClosedIcon :class="$style.lockIcon" />
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { computed } from "vue"
import { LockClosedIcon } from "@heroicons/vue/24/solid"
import Select from "@/components/form/Select.vue"
import type { OptionBase } from "~/types/form/optionType"

interface Props {
  locationName: string
  deliveryPorts: OptionBase[]
  selectedPort: string
  calcResult: {
    cost: number
    chinaExpenses: number
    deliveryCost: number
    total: number
    deliveryPort: string
  }
  currencySymbol: string
  isGuest?: boolean
  hasCalculations?: boolean
}

const _props = defineProps<Props>()
const _emit = defineEmits<{
  (e: "update:selectedPort", value: string): void
}>()

const { t } = useI18n()

const isCalcLocked = computed(() => _props.isGuest === true && !_props.hasCalculations)

const formatPrice = (value: number | undefined | null) => {
  if (!value) {
    return "0"
  }
  return new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 0,
  }).format(Number(value))
}

const localSelectedPort = computed({
  get: () => _props.selectedPort,
  set: value => _emit("update:selectedPort", value),
})
</script>

<style module>
.deliveryBlock {
  @apply mt-8 bg-white border border-gray-200 rounded-xl p-6;
}
.deliveryTitle {
  @apply font-bold text-base;
}
.deliveryRow {
  @apply flex flex-row items-center mb-4;
}
.deliveryColValue {
  @apply w-1/2 text-black text-base font-medium;
}
.deliveryRow:last-child {
  @apply mb-0;
}
.deliverySumBlock {
  @apply mt-8 bg-white border border-gray-200 rounded-xl p-6;
}
.deliverySumLabel {
  @apply text-gray-500 text-base font-medium mb-2;
}
.deliverySumTo {
  @apply text-black text-base font-medium mb-0;
}
.deliverySumValue {
  @apply text-black text-xl font-bold;
}
.lockedValue {
  @apply inline-flex items-center align-middle;
}
.fakePriceLine {
  @apply inline-block h-5 w-24 bg-gray-200 rounded;
}
.fakeTotalLine {
  @apply inline-block h-6 w-32 bg-gray-200 rounded;
}
.lockIcon {
  @apply w-4 h-4 text-gray-400 ml-2;
}
</style>
