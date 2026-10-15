<template>
  <div class="mx-auto">
    <div :class="$style.content">
      <div :class="$style.formContainer">
        <TabGroup
          :selected-index="selectedTab"
          as="div"
          @change="onTabChange"
        >
          <TabList :class="$style.tabList">
            <Tab :class="$style.tabLeft">
              {{ t("calc.used") }}
            </Tab>
            <Tab
              v-if="showNewTab"
              :class="$style.tabRight"
            >
              {{ t("calc.new") }}
            </Tab>
          </TabList>
          <TabPanels :class="$style.tabPanels">
            <TabPanel>
              <div :class="$style.formGrid">
                <div>
                  <Input
                    v-model="usedCar.price"
                    :label="t('calc.price_yuan')"
                    placeholder="0"
                    type="text"
                    class="w-full"
                    :invalid-message="errors.get('cost')"
                    @update:model-value="() => errors.clear('cost')"
                  />
                </div>
                <div />
                <div v-if="!selectedPortFixed">
                  <SearchableSelect
                    v-model="usedCar.city"
                    :label="t('calc.city_label')"
                    :options="citiesOptions"
                    class="w-full"
                    :invalid-message="errors.get('city')"
                    @update:model-value="() => errors.clear('city')"
                  />
                </div>
                <div>
                  <SearchableSelect
                    v-model="usedCar.port"
                    :label="t('calc.port_label')"
                    :options="ports"
                    class="w-full"
                    :invalid-message="errors.get('seaport')"
                    @update:model-value="() => errors.clear('seaport')"
                  />
                </div>
                <div />
                <div :class="$style.buttonContainer">
                  <span :class="$style.autoCalcLabel">
                    {{ t('calc.auto_calculation_hint') }}
                  </span>
                </div>
              </div>
            </TabPanel>
            <TabPanel v-if="showNewTab">
              <div :class="$style.formGrid">
                <div>
                  <Input
                    v-model="newCar.price"
                    :label="t('calc.price_yuan')"
                    placeholder="0"
                    type="text"
                    class="w-full"
                    :invalid-message="errors.get('cost')"
                    @update:model-value="() => errors.clear('cost')"
                  />
                </div>
                <div class="mt-1">
                  <SearchableSelect
                    v-model="newCar.fuelType"
                    :label="t('calc.fuel_type_label')"
                    :options="fuelTypes"
                    class="w-full"
                    :invalid-message="errors.get('power_type')"
                    @update:model-value="() => errors.clear('power_type')"
                  />
                </div>
                <div />
                <div :class="$style.buttonContainer">
                  <span :class="$style.autoCalcLabel">
                    {{ t('calc.auto_calculation_hint') }}
                  </span>
                </div>
              </div>
            </TabPanel>
          </TabPanels>
        </TabGroup>
        <div :class="$style.tabSettings">
          <CheckBox
            v-model="showNewTab"
            :option-label="t('calc.show_new_tab')"
          />
        </div>
      </div>
      <div
        v-if="isLoading"
        :class="$style.resultContainer"
      >
        <div :class="$style.resultPlaceholder">
          {{ t('calc.recalculating') }}
        </div>
      </div>
      <div
        v-else-if="result"
        :class="$style.resultContainer"
      >
        <div :class="$style.resultTitle">
          {{ t('calc.calculation') }}
        </div>
        <div :class="$style.resultItem">
          <span :class="$style.resultLabel">
            {{ t('calc.cost') }}
            <span :class="$style.resultValue">{{ formatPrice(result.cost) }} {{ yuanSymbol }}</span>
          </span>
        </div>
        <div :class="$style.resultItem">
          <span :class="$style.resultLabel">
            {{ t('calc.china_expenses') }}
            <span :class="$style.resultValue">
              {{ formatPrice(result.china_expenses) }} {{ yuanSymbol }}
            </span>
          </span>
        </div>
        <template v-if="Number(result.delivery_cost) > 0">
          <div

            :class="$style.resultItemSingle"
          >
            <span :class="$style.resultLabelBlack">
              {{ t('calc.delivery_to_warehouse') }}
            </span>
          </div>
          <div
            :class="$style.resultTotal"
            class="mb-4"
          >
            {{ formatPrice(result.delivery_cost) }} {{ yuanSymbol }}
          </div>
        </template>
        <div :class="$style.resultItemSingle">
          <span :class="$style.resultLabelBlack">{{ t('calc.total') }}</span>
        </div>
        <div :class="$style.resultTotal">
          {{ formatPrice(result.total) }} {{ yuanSymbol }}
        </div>
      </div>
      <div
        v-else
        :class="$style.resultContainerEmpty"
      >
        <div :class="$style.resultPlaceholder">
          <div class="mb-3">
            {{ t('calc.calculating') }}
          </div>
          <div>{{ t('calc.calculating_description') }}</div>
          <div>{{ t('calc.calculating_formula') }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue"
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from "@headlessui/vue"
import { useDebounceFn, useLocalStorage } from "@vueuse/core"
import Input from "@/components/form/Input.vue"
import SearchableSelect from "@/components/form/SearchableSelect.vue"
import CheckBox from "@/components/form/CheckBox.vue"
import { useLoadingIndicator } from "#imports"
import currency from "~/lang/ru/currency.json"
import useCities from "@/composables/useCities"
import usePorts from "@/composables/usePorts"
import { useApiCalculatorOption } from "@/composables/api/useApiCalculatorOption"
import type { Calculate } from "@/types/responses/calculatorOption"
import type { OptionBase } from "@/types/form/optionType"
import type { CalculateBody } from "@/types/requests/calculatorOption"
import {
  StatusNew, StatusUsed,
  PowerTypePetrol, PowerTypeDiesel, PowerTypeElectric,
} from "@/constants/cars"
import type { Seaport, CalculatePowerType } from "@/types/common/cars"
import Errors from "@/classes/errors"

const yuanSymbol = currency.CNY_symbol
const { t } = useI18n()

definePageMeta({ auth: true, layout: "personal" })

const { isLoading, start, finish } = useLoadingIndicator()
const selectedTab = ref(0)
const showNewTab = useLocalStorage("calc.showNewTab", false)
const result = ref<Calculate | null>(null)
const errors = ref(new Errors())

watch(showNewTab, (val) => {
  if (!val && selectedTab.value === 1) {
    selectedTab.value = 0
    result.value = null
    errors.value.clear()
  }
})

const usedCar = ref({
  price: "",
  city: undefined as OptionBase | undefined,
  port: undefined as OptionBase | undefined,
})
const newCar = ref({
  price: "",
  fuelType: undefined as OptionBase | undefined,
})

const { cities, reloadAll } = useCities()
const { portOptions: ports, reload: reloadPorts, findPort } = usePorts()

const selectedPortFixed = computed(
  () => findPort(usedCar.value.port?.value as string | undefined)?.pricing_type === "fixed",
)

const { calculate } = useApiCalculatorOption()

onMounted(async () => {
  reloadAll()
  await reloadPorts()
  if (usedCar.value.port && !ports.value.some(p => p.value === usedCar.value.port?.value)) {
    usedCar.value.port = undefined
  }
})

const formatPrice = (value: number | undefined | null) => {
  if (!value) {
    return "0"
  }
  return new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 0,
  }).format(Number(value))
}
const fuelTypes = computed<OptionBase[]>(() => [
  { id: 1, value: PowerTypePetrol, name: t("cars.power_type.petrol"), disabled: false },
  { id: 2, value: PowerTypeDiesel, name: t("cars.power_type.diesel"), disabled: false },
  { id: 3, value: PowerTypeElectric, name: t("cars.power_type.electric"), disabled: false },
])
const citiesOptions = computed<OptionBase[]>(() =>
  cities.value.map(c => ({
    id: c.id,
    value: c.code,
    name: c.name_ru + (c.name_zh ? ` (${c.name_zh})` : ""),
    disabled: false,
  })),
)

function onTabChange(tabIndex: number) {
  selectedTab.value = tabIndex
  result.value = null
  errors.value.clear()
  if (tabIndex === 1) {
    usedCar.value.port = undefined
  }
  if (tabIndex === 0
    && usedCar.value.price
    && Number(usedCar.value.price) > 0
    && usedCar.value.port
    && (selectedPortFixed.value || usedCar.value.city)
  ) {
    debouncedCalculateUsed()
  }
  else if (tabIndex === 1
    && newCar.value.price
    && Number(newCar.value.price) > 0
    && newCar.value.fuelType
  ) {
    debouncedCalculateNew()
  }
}

async function calculateUsed(_auto = false) {
  start()
  try {
    if (
      !usedCar.value.price
      || Number(usedCar.value.price) <= 0
      || !usedCar.value.port
      || (!selectedPortFixed.value && !usedCar.value.city)
    ) {
      return
    }
    const body: CalculateBody = {
      status: StatusUsed,
      cost: Number(usedCar.value.price),
      seaport: usedCar.value.port?.value as Seaport,
    }
    if (!selectedPortFixed.value) {
      body.city = usedCar.value.city?.value as string
    }
    const response = await calculate(body)
    result.value = response.data ?? null
    errors.value.clear()
  }
  catch (error: any) {
    if (error?.data?.errors) {
      errors.value.record(error.data.errors)
    }
  }
  finally {
    finish()
  }
}

async function calculateNew(_auto = false) {
  start()
  try {
    if (
      !newCar.value.price
      || Number(newCar.value.price) <= 0
      || !newCar.value.fuelType
    ) {
      return
    }
    const body: CalculateBody = {
      status: StatusNew,
      cost: Number(newCar.value.price),
      power_type: newCar.value.fuelType?.value as CalculatePowerType,
    }
    const response = await calculate(body)
    result.value = response.data ?? null
    errors.value.clear()
  }
  catch (error: any) {
    if (error?.data?.errors) {
      errors.value.record(error.data.errors)
    }
  }
  finally {
    finish()
  }
}

const debouncedCalculateUsed = useDebounceFn(() => calculateUsed(true), 1000)
const debouncedCalculateNew = useDebounceFn(() => calculateNew(true), 1000)

watch(
  () => [usedCar.value.price, usedCar.value.city?.value, usedCar.value.port?.value],
  (vals) => {
    if (
      selectedTab.value === 0
      && vals[0]
      && Number(vals[0]) > 0
      && vals[2]
      && (selectedPortFixed.value || vals[1])
    ) {
      debouncedCalculateUsed()
    }
  },
  { deep: true },
)

watch(
  () => [newCar.value.price, newCar.value.fuelType?.value],
  (vals) => {
    if (
      selectedTab.value === 1
      && vals[0]
      && Number(vals[0]) > 0
      && vals[1]
    ) {
      debouncedCalculateNew()
    }
  },
  { deep: true },
)
</script>

<style module>
.content {
  @apply flex h-full gap-6;
}
.formContainer {
  @apply w-1/2 p-6 border border-gray-300 rounded-lg;
}
.tabList {
  @apply flex mt-[-16px] mb-8;
}
.tabLeft {
  @apply px-4 py-1.5 focus:outline-none rounded-tl transition-colors duration-150 border-b;
}
.tabRight {
  @apply px-4 py-1.5 focus:outline-none rounded-tr transition-colors duration-150 border-b;
}
.tabLeft[data-headlessui-state~='selected'],
.tabRight[data-headlessui-state~='selected'] {
  @apply font-bold border-b-2 border-b-black;
}
.tabLeft[data-headlessui-state~='unselected'],
.tabRight[data-headlessui-state~='unselected'] {
  @apply border-b border-b-gray-300;
}
.tabPanels {
  @apply mt-4;
}
.tabSettings {
  @apply mt-4 pt-4 border-t border-gray-200;
}
.formGrid {
  @apply grid-cols-2 gap-6;
  display: grid;
}
.buttonContainer {
  @apply flex justify-end items-end h-full pb-2;
}
.autoCalcLabel {
  @apply text-sm text-gray-400 italic text-right w-full;
}
.resultContainer {
  @apply w-1/2 p-6 border border-gray-300 rounded-lg;
}
.resultContainerEmpty {
  @apply w-1/2 p-6 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center;
}
.resultPlaceholder {
  @apply text-gray-400 text-center;
}
.resultTitle {
  @apply text-base font-bold mb-4 text-left;
}
.resultItem {
  @apply flex justify-between items-center mb-4 text-left;
}
.resultItemSingle {
  @apply block text-left;
}
.resultLabel {
  @apply text-gray-500 text-sm;
}
.resultLabelBlack {
  @apply text-black text-sm block;
}
.resultValue {
  @apply text-gray-500 text-sm;
}
.resultTotal {
  @apply text-xl font-bold text-left mb-2;
}
@media (max-width: 1500px) {
  .formGrid {
    @apply grid-cols-1 gap-4;
    display: grid;
  }
  .formGrid > div {
    @apply w-full;
  }
}
@media (max-width: 1024px) {
  .content {
    @apply flex-col gap-4;
  }
  .formContainer {
    @apply w-full;
  }
  .resultContainer {
    @apply w-full;
  }
  .resultContainerEmpty {
    @apply w-full;
  }
  .tabList {
    @apply mb-6;
  }
}
@media (max-width: 768px) {
  .content {
    @apply gap-3;
  }
  .formContainer {
    @apply p-4;
  }
  .resultContainer {
    @apply p-4;
  }
  .resultContainerEmpty {
    @apply p-4;
  }
  .resultPlaceholder div {
    @apply text-sm;
  }
  .resultTitle {
    @apply text-sm mb-3;
  }
  .resultTotal {
    @apply text-lg;
  }
  .formGrid {
    @apply gap-3;
  }
}
@media (max-width: 480px) {
  .tabLeft,
  .tabRight {
    @apply px-3 py-1 text-sm;
  }
  .resultItem {
    @apply flex-col items-start gap-1 mb-3;
  }
  .resultLabel {
    @apply mb-1;
  }
  .formContainer {
    @apply p-3;
  }
  .resultContainer {
    @apply p-3;
  }
  .resultContainerEmpty {
    @apply p-3;
  }
}
</style>
