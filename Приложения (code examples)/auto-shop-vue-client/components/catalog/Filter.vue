<template>
  <div :class="$style.filterBox">
    <div
      :class="[$style.fieldsGrid, { [$style.collapsed]: !isExpanded }]"
    >
      <Select
        v-if="shouldShowVisibility"
        :model-value="filters.visibility || 'all'"
        :options="filteredOptions.visibility"
        :label="t('catalog.filter.visibility')"
        @update:model-value="updateVisibility"
      />
      <SearchableSelect
        v-if="shouldShowStatus"
        :model-value="statusFilterItems"
        :options="statusOptionsWithAll"
        :label="t(bookedMode ? 'catalog.filter.status_delivery' : 'catalog.filter.status')"
        :multiple="true"
        :return-value-only="false"
        :searchable="false"
        :clearable="true"
        @update:model-value="updateStatus"
      />
      <SearchableSelect
        v-if="shouldShowBuyer"
        :model-value="getOptionByValue(localOptions.buyer, filters.buyer)"
        :options="filteredOptions.buyer"
        :label="t('catalog.common.buyer')"
        :placeholder="t('catalog.filter.select')"
        @update:model-value="updateBuyer"
      />
      <template v-if="shouldShowDate">
        <DateInput
          :model-value="filters.bought_at || null"
          :label="t('catalog.filter.filter_bought_date')"
          :disabled-future-dates="true"
          range
          :placeholder="t('catalog.filter.filter_bought_date_placeholder')"
          @update:model-value="emit('update:filters', { ...filters, bought_at: $event })"
        />
      </template>
      <template v-if="shouldShowVin">
        <Input
          :model-value="filters.vin || ''"
          :label="t('catalog.filter.vin')"
          :class="$style.vinInput"
          @update:model-value="emit('update:filters', { ...filters, vin: $event })"
        />
      </template>
      <template v-if="shouldShowInternalNumber">
        <Input
          :model-value="filters.internal_number || ''"
          :label="t('catalog.filter.internal_number')"
          :class="$style.vinInput"
          @update:model-value="emit('update:filters', { ...filters, internal_number: $event })"
        />
      </template>
      <Select
        :model-value="filters.condition"
        :options="filteredOptions.condition"
        :label="t('catalog.filter.condition')"
        :disabled="true"
        @update:model-value="updateCondition"
      />
      <SearchableSelect
        :model-value="getOptionByValue(localOptions.brand, filters.brand)"
        :options="filteredOptions.brand"
        :label="t('catalog.filter.brand')"
        @update:model-value="updateBrand"
      />
      <SearchableSelect
        :model-value="getOptionByValue(localOptions.model, filters.model)"
        :options="filteredOptions.model"
        :label="t('catalog.filter.model')"
        :disabled="modelDisabled"
        @update:model-value="updateModel"
      />
      <div :class="$style.rangeWrapper">
        <RangeSelect
          :model-value="filters.year"
          :left-options="filteredOptions.year"
          :right-options="filteredOptions.year"
          :label="t('catalog.filter.year')"
          :left-placeholder="t('catalog.filter.from')"
          :right-placeholder="t('catalog.filter.to')"
          @update:model-value="$emit('update:filters', { ...filters, year: $event })"
        />
        <button
          v-if="filters.year.left || filters.year.right"
          :class="$style.clearButton"
          :title="t('catalog.filter.clear')"
          @click="$emit('update:filters', { ...filters, year: { left: undefined, right: undefined } })"
        >
          <XMarkIcon :class="$style.closeIcon" />
        </button>
      </div>
      <div :class="$style.rangeWrapper">
        <RangeSelect
          :model-value="filters.displacement"
          :left-options="filteredOptions.displacement"
          :right-options="filteredOptions.displacement"
          :label="t('catalog.filter.displacement')"
          :left-placeholder="t('catalog.filter.from')"
          :right-placeholder="t('catalog.filter.to')"
          @update:model-value="$emit('update:filters', { ...filters, displacement: $event })"
        />
        <button
          v-if="filters.displacement.left || filters.displacement.right"
          :class="$style.clearButton"
          :title="t('catalog.filter.clear')"
          @click="$emit('update:filters', { ...filters, displacement: { left: undefined, right: undefined } })"
        >
          <XMarkIcon :class="$style.closeIcon" />
        </button>
      </div>
      <SearchableSelect
        :model-value="equipmentFilterItems"
        :options="equipmentOptionsWithAll"
        :label="t('catalog.filter.equipment')"
        :disabled="equipmentDisabled"
        :multiple="true"
        :return-value-only="false"
        :clearable="true"
        @update:model-value="updateEquipment"
      />
      <div
        v-if="shouldShowPrice"
        :class="$style.rangeWrapper"
      >
        <SearchableSelect
          :key="priceKey"
          :model-value="getOptionByValue(localOptions.price, filters.price)"
          :options="filteredOptions.price"
          :label="t('catalog.filter.price_to')"
          :placeholder="t('catalog.filter.select')"
          :allow-custom-input="true"
          @update:model-value="updatePrice"
        />
        <button
          v-if="filters.price"
          :class="$style.clearButton"
          :title="t('catalog.filter.clear')"
          @click="resetPrice"
        >
          <XMarkIcon :class="$style.closeIcon" />
        </button>
      </div>
      <div :class="$style.rangeWrapper">
        <SearchableSelect
          :key="mileageKey"
          :model-value="getOptionByValue(localOptions.mileage, filters.mileage)"
          :options="filteredOptions.mileage"
          :label="t('catalog.filter.mileage_to')"
          :placeholder="t('catalog.filter.select')"
          :allow-custom-input="true"
          @update:model-value="updateMileage"
        />
        <button
          v-if="filters.mileage"
          :class="$style.clearButton"
          :title="t('catalog.filter.clear')"
          @click="resetMileage"
        >
          <XMarkIcon :class="$style.closeIcon" />
        </button>
      </div>
      <Select
        :model-value="filters.gearbox"
        :options="filteredOptions.gearbox"
        :label="t('catalog.filter.gearbox')"
        :disabled="gearboxDisabled"
        @update:model-value="$emit('update:filters', { ...filters, gearbox: $event })"
      />
      <Select
        :model-value="filters.power_type"
        :options="filteredOptions.power_type"
        :label="t('catalog.filter.fuel')"
        :disabled="powerTypeDisabled"
        @update:model-value="$emit('update:filters', { ...filters, power_type: $event })"
      >
        <template #label>
          {{ t('catalog.filter.fuel') }}
          <span :class="$style.engineTypeHint">({{ t('catalog.filter.engine_type') }})</span>
        </template>
      </Select>
      <Select
        :model-value="filters.drive_type"
        :options="filteredOptions.drive_type"
        :label="t('catalog.filter.drive_type')"
        :disabled="driveTypeDisabled"
        @update:model-value="$emit('update:filters', { ...filters, drive_type: $event })"
      />
      <Select
        :model-value="filters.scale"
        :options="filteredOptions.scale"
        :label="t('catalog.filter.scale')"
        :disabled="scaleDisabled"
        @update:model-value="$emit('update:filters', { ...filters, scale: $event })"
      />
      <SearchableSelect
        :model-value="getOptionByValue(localOptions.color, filters.color)"
        :options="filteredOptions.color"
        :label="t('catalog.filter.color')"
        :disabled="colorDisabled"
        @update:model-value="updateColor"
      />
      <Select
        v-if="shouldShowManager"
        :model-value="filters.seller_id || 'mine'"
        :options="filteredOptions.manager"
        :label="t('catalog.filter.manager')"
        @update:model-value="updateManager"
      />
      <div :class="$style.togglesContainer">
        <div
          :class="[$style.videoRow, isOriginalPaintLocked ? $style.videoRowLocked : '']"
          @click="onOriginalPaintClick"
        >
          <ClientOnly>
            <Switch
              v-model="hasOriginalPaint"
              :disabled="isOriginalPaintLocked"
              :class="[$style.videoSwitch, isOriginalPaintLocked ? $style.videoSwitchLocked : '']"
            />
          </ClientOnly>
          <span :class="$style.videoLabel">{{ t('catalog.filter.original_paint') }}</span>
          <AuthLockIcon
            v-if="isOriginalPaintLocked"
            align="start"
          />
        </div>
        <div
          v-if="!filters.archive"
          :class="$style.videoRow"
        >
          <ClientOnly>
            <Switch
              v-model="hasVideo"
              :class="$style.videoSwitch"
            />
          </ClientOnly>
          <span :class="$style.videoLabel">{{ t('catalog.filter.has_video') }}</span>
        </div>
        <div
          v-if="!filters.archive"
          :class="$style.videoRow"
        >
          <ClientOnly>
            <Switch
              v-model="hasDiagnostics"
              :class="$style.videoSwitch"
            />
          </ClientOnly>
          <span :class="$style.videoLabel">{{ t('catalog.filter.has_diagnostics') }}</span>
        </div>
        <div
          v-if="!filters.archive"
          :class="$style.videoRow"
        >
          <ClientOnly>
            <Switch
              v-model="hasCompensation"
              :class="$style.videoSwitch"
            />
          </ClientOnly>
          <span :class="$style.videoLabel">{{ t('catalog.filter.has_compensation') }}</span>
        </div>
      </div>
    </div>
    <div :class="$style.buttonsGroup">
      <button
        :class="$style.collapseLink"
        @click="toggleFilter"
      >
        {{ isExpanded ? t('catalog.filter.collapse') : t('catalog.filter.expand') }}
      </button>
      <Button
        kind="transparent"
        :class="$style.filterShowBtn"
        @click="$emit('apply-filters')"
      >
        {{ t('catalog.filter.show') }}
      </Button>
      <Button
        kind="lightgrey"
        :class="$style.filterResetBtn"
        @click="resetFilters"
      >
        {{ t('catalog.filter.clear') }}
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed, nextTick } from "vue"
import { useI18n } from "vue-i18n"
import pkg from "lodash"
import { Switch } from "@headlessui/vue"
import { XMarkIcon } from "@heroicons/vue/24/outline"
import { storeToRefs } from "pinia"
import AuthLockIcon from "@/components/common/AuthLockIcon.vue"
import { useLoginRedirect } from "@/composables/useLoginRedirect"
import Select from "@/components/form/Select.vue"
import SearchableSelect from "@/components/form/SearchableSelect.vue"
import RangeSelect from "@/components/form/RangeSelect.vue"
import Button from "@/components/common/Button.vue"
import type { Filters, FilterOptions, FilterOptionParams } from "@/types/catalog/filter"
import type { OptionBase } from "@/types/form/optionType"
import { useNotificationsStore } from "@/stores/notifications"
import { useApiCatalogFilter } from "@/composables/api/useApiCatalogFilter"
import Input from "@/components/form/Input.vue"
import { SaleStatusBooked, SaleStatusSold } from "~/constants/catalog"
import DateInput from "@/components/form/Date.vue"
import useCarColors from "@/composables/useCarColors"

const userStore = useUserStore()
const { isAuthenticated } = storeToRefs(userStore)
const { goToLogin } = useLoginRedirect()

const { getFilterOptions, getBrands, getModels, getCompletions, getParts, getBuyers, getManagers } = useApiCatalogFilter()
const { errorNotify } = useNotificationsStore()
const { debounce } = pkg
const { t } = useI18n()
const props = defineProps<{
  filters: Filters
  isSeller?: boolean
}>()
const emit = defineEmits<{
  (e: "update:filters", value: Filters): void
  (e: "apply-filters" | "reset-filters"): void
}>()
const { colors: carColors } = useCarColors()
const colorDisabled = ref(false)

function catalogScopeParams(): Pick<FilterOptionParams, "isSeller" | "condition" | "sale_status" | "deleted" | "archive" | "favorites"> {
  return {
    isSeller: props.isSeller,
    condition: props.filters.condition,
    sale_status: props.filters.sale_status,
    deleted: props.filters.deleted,
    archive: props.filters.archive,
    favorites: props.filters.favorites,
  }
}

const modelDisabled = ref(true)
const equipmentDisabled = ref(true)
const scaleDisabled = ref(false)
const driveTypeDisabled = ref(false)
const powerTypeDisabled = ref(false)
const gearboxDisabled = ref(false)
const mileageKey = ref(0)
const priceKey = ref(0)
const isInitializing = ref(false)
const hasVideo = ref(!!props.filters.hasVideo)
const hasDiagnostics = ref(!!props.filters.hasDiagnostics)
const hasCompensation = ref(!!props.filters.hasCompensation)
const hasOriginalPaint = ref(!!props.filters.original_paint)
const bookedMode = computed(() => {
  const status = props.filters.sale_status

  if (props.isSeller) {
    return status === SaleStatusBooked || status === SaleStatusSold
  }

  return status === SaleStatusBooked
})
const shouldShowStatus = computed(() => {
  if (props.filters.archive || !isAuthenticated.value) {
    return false
  }

  const status = props.filters.sale_status

  if (userStore.isSellerContent || userStore.isSellerSearch) {
    return !!status
  }

  if (!status) {
    return true
  }

  if (props.isSeller) {
    return status === SaleStatusBooked || status === SaleStatusSold
  }

  return status === SaleStatusBooked
})
const shouldShowBuyer = computed(() => {
  const status = props.filters.sale_status

  if (!status || (!userStore.isDirector && !userStore.isAdmin)) {
    return false
  }

  return status === SaleStatusBooked || status === SaleStatusSold
})
const shouldShowManager = computed(() => {
  return userStore.isSellerClient && !props.filters.sale_status && !props.filters.archive && !props.filters.deleted
})
const shouldShowDate = computed(() => {
  const status = props.filters.sale_status

  if (!status || props.isSeller) {
    return false
  }

  return status === SaleStatusSold
})
const shouldShowVisibility = computed(() => {
  return props.isSeller && !props.filters.sale_status
})
const shouldShowVin = computed(() => !props.filters.deleted && isAuthenticated.value)
const shouldShowPrice = computed(() => isAuthenticated.value)
const isOriginalPaintLocked = computed(() => !isAuthenticated.value)

function onOriginalPaintClick() {
  if (isOriginalPaintLocked.value) {
    goToLogin()
  }
}
const shouldShowInternalNumber = computed(() => {
  return (props.isSeller || userStore.isAdmin) && !props.filters.deleted
})
const baseStatusOptions = () => ([
  { id: 1, value: "all", name: t("catalog.list.all"), disabled: false },
  { id: 2, value: "video_requested", name: t("catalog.list.video_requested"), disabled: false },
  { id: 3, value: "video_closed", name: t("catalog.list.video_closed"), disabled: false },
  { id: 4, value: "diagnostic_requested", name: t("catalog.list.diagnostic_requested"), disabled: false },
  { id: 5, value: "diagnostic_closed", name: t("catalog.list.diagnostic_closed"), disabled: false },
  { id: 6, value: "booking_requested", name: t("catalog.list.booking_requested"), disabled: false },
  { id: 9, value: "diagnostic_subscribed", name: t("catalog.list.diagnostic_subscribed"), disabled: false },
])
const deliveryStatusOptions = computed(() => ([
  { id: 0, value: "all", name: t("catalog.list.all"), disabled: false },
  { id: 1, value: "awaiting_buyer_data", name: t("order_status.default.awaiting_buyer_data"), disabled: false },
  { id: 2, value: "added_buyer_data", name: t("order_status.default.added_buyer_data"), disabled: false },
  { id: 3, value: "invoice_issued", name: t("order_status.default.invoice_issued"), disabled: false },
  { id: 4, value: "payment_docs_uploaded", name: t("order_status.default.payment_docs_uploaded"), disabled: false },
  { id: 5, value: "payment_received", name: t("order_status.default.payment_received"), disabled: false },
  { id: 6, value: "car_purchased", name: t("order_status.default.car_purchased"), disabled: false },
  { id: 7, value: "car_docs_received", name: t("order_status.default.car_docs_received"), disabled: false },
  { id: 8, value: "export_docs_prepared", name: t("order_status.default.export_docs_prepared"), disabled: false },
  { id: 9, value: "sent_to_china_hub", name: t("order_status.default.sent_to_china_hub"), disabled: false },
  { id: 10, value: "photo_from_transit", name: t("order_status.default.photo_from_transit"), disabled: false },
  { id: 11, value: "prepared_for_ru_dispatch", name: t("order_status.default.prepared_for_ru_dispatch"), disabled: false },
  { id: 12, value: "shipped_to_russia", name: t("order_status.default.shipped_to_russia"), disabled: false },
  { id: 13, value: "arrived_in_russia", name: t("order_status.default.arrived_in_russia"), disabled: false },
  { id: 14, value: "sent_to_cfs", name: t("order_status.default.sent_to_cfs"), disabled: false },
  { id: 15, value: "incident", name: t("order_status.default.incident"), disabled: false },
]))

const currentYear = new Date().getFullYear()

const localOptions = ref<FilterOptions>({
  status: baseStatusOptions(),
  buyer: [{ id: 0, value: "all", name: t("catalog.list.all"), disabled: false }],
  manager: [
    { id: -1, value: "mine", name: t("catalog.filter.manager_mine"), disabled: false },
    { id: 0, value: "all", name: t("catalog.list.all"), disabled: false },
  ],
  condition: [
    { id: 1, value: "all", name: t("catalog.list.all"), disabled: false },
    { id: 2, value: "new", name: t("cars.condition.new"), disabled: false },
    { id: 3, value: "used", name: t("cars.condition.used"), disabled: false },
  ],
  brand: [{ id: 0, value: "all", name: t("catalog.list.all"), disabled: false }],
  model: [{ id: 0, value: "all", name: t("catalog.list.all"), disabled: true }],
  equipment: [{ id: 0, value: "all", name: t("catalog.list.all"), disabled: true }],
  mileage: Array.from({ length: 10 }, (_, i) => {
    const value = (i + 1) * 10000
    return { id: i + 1, value, name: value.toString(), disabled: false }
  }),
  gearbox: [
    { id: 1, value: "all", name: t("cars.gearbox.all"), disabled: false },
    { id: 2, value: "mt", name: t("cars.gearbox.mt"), disabled: false },
    { id: 3, value: "at", name: t("cars.gearbox.at"), disabled: false },
    { id: 4, value: "dct", name: t("cars.gearbox.dct"), disabled: false },
    { id: 5, value: "cvt", name: t("cars.gearbox.cvt"), disabled: false },
    { id: 6, value: "am", name: t("cars.gearbox.am"), disabled: false },
    { id: 7, value: "ecvt", name: t("cars.gearbox.ecvt"), disabled: false },
    { id: 8, value: "single", name: t("cars.gearbox.single"), disabled: false },
    { id: 9, value: "dht", name: t("cars.gearbox.dht"), disabled: false },
    { id: 10, value: "other", name: t("cars.gearbox.other"), disabled: false },
  ],
  power_type: [
    { id: 1, value: "all", name: t("catalog.list.all"), disabled: false },
    { id: 2, value: "petrol", name: t("cars.power_type.petrol"), disabled: false },
    { id: 3, value: "diesel", name: t("cars.power_type.diesel"), disabled: false },
    { id: 4, value: "hybrid", name: t("cars.power_type.hybrid"), disabled: false },
    { id: 5, value: "electric", name: t("cars.power_type.electric"), disabled: false },
    { id: 6, value: "gas", name: t("cars.power_type.gas"), disabled: false },
  ],
  drive_type: [
    { id: 1, value: "all", name: t("cars.drive_type.all"), disabled: false },
    { id: 2, value: "awd", name: t("cars.drive_type.awd"), disabled: false },
    { id: 3, value: "fwd", name: t("cars.drive_type.fwd"), disabled: false },
    { id: 4, value: "rwd", name: t("cars.drive_type.rwd"), disabled: false },
  ],
  scale: [
    { id: 1, value: "all", name: t("catalog.list.all"), disabled: false },
    { id: 2, value: "sedan", name: t("cars.scale_type.sedan"), disabled: false },
    { id: 3, value: "hatchback", name: t("cars.scale_type.hatchback"), disabled: false },
    { id: 4, value: "wagon", name: t("catalog.list.wagon"), disabled: false },
    { id: 5, value: "suv", name: t("cars.scale_type.suv"), disabled: false },
    { id: 6, value: "coupe", name: t("cars.scale_type.coupe"), disabled: false },
    { id: 7, value: "cabriolet", name: t("catalog.list.cabriolet"), disabled: false },
    { id: 8, value: "pickup", name: t("cars.scale_type.pickup"), disabled: false },
    { id: 9, value: "minivan", name: t("cars.scale_type.minivan"), disabled: false },
  ],
  color: [
    { id: 1, value: "all", name: t("catalog.list.all"), disabled: false },
    ...carColors.value.map(c => ({ ...c, disabled: false })),
  ],
  year: Array.from({ length: currentYear - 2000 + 1 }, (_, i) => {
    const value = currentYear - i
    return { id: i + 1, value, name: value, disabled: false }
  }),
  price: Array.from({ length: 41 }, (_, i) => {
    const value = 50000 + i * 5000
    const name = value.toLocaleString("ru-RU")
    return { id: i + 1, value, name, disabled: false }
  }),
  displacement: Array.from({ length: 53 }, (_, i) => {
    const value = (0.8 + i * 0.1).toFixed(1)
    return { id: i + 1, value, name: value, disabled: false }
  }),
  visibility: [
    { id: 1, value: "all", name: t("catalog.filter.visibility_all"), disabled: false },
    { id: 2, value: "visible", name: t("catalog.filter.visibility_visible"), disabled: false },
    { id: 3, value: "hidden", name: t("catalog.filter.visibility_hidden"), disabled: false },
  ],
})

const filteredOptions = computed(() => {
  return {
    status: localOptions.value.status.filter(option => !option.disabled),
    buyer: localOptions.value.buyer.filter(option => !option.disabled),
    manager: localOptions.value.manager.filter(option => !option.disabled),
    condition: localOptions.value.condition.filter(option => !option.disabled),
    brand: localOptions.value.brand.filter(option => !option.disabled),
    model: localOptions.value.model.filter(option => !option.disabled),
    equipment: localOptions.value.equipment.filter(option => !option.disabled),
    mileage: localOptions.value.mileage.filter(option => !option.disabled),
    gearbox: localOptions.value.gearbox.filter(option => !option.disabled),
    power_type: localOptions.value.power_type.filter(option => !option.disabled),
    drive_type: localOptions.value.drive_type.filter(option => !option.disabled),
    scale: localOptions.value.scale.filter(option => !option.disabled),
    color: localOptions.value.color.filter(option => !option.disabled),
    year: localOptions.value.year.filter(option => !option.disabled),
    price: localOptions.value.price.filter(option => !option.disabled),
    displacement: localOptions.value.displacement.filter(option => !option.disabled),
    visibility: localOptions.value.visibility.filter(option => !option.disabled),
  }
})

const applyStatusOptionsByMode = (isDelivery: boolean) => {
  if (isDelivery) {
    localOptions.value.status = deliveryStatusOptions.value
    emit("update:filters", {
      ...props.filters,
      status: [],
    })
  }
  else {
    localOptions.value.status = baseStatusOptions()
  }
}

function normalizeStatusFilter(status: string | string[] | undefined): string[] {
  if (Array.isArray(status)) {
    return status.filter(value => value && value !== "all")
  }
  if (!status || status === "all") {
    return []
  }
  return [status]
}

function normalizeEquipmentFilter(equipment: string | string[] | undefined): string[] {
  if (Array.isArray(equipment)) {
    return equipment.filter(value => value && value !== "all").map(String)
  }
  if (!equipment || equipment === "all") {
    return []
  }
  return [String(equipment)]
}

const statusOptionsWithAll = computed(() => [
  { id: 0, value: "all", name: t("catalog.list.all"), disabled: false },
  ...filteredOptions.value.status,
])

const statusFilterItems = computed(() => {
  const statuses = normalizeStatusFilter(props.filters.status)
  if (!statuses.length) {
    return [statusOptionsWithAll.value[0]]
  }
  return statusOptionsWithAll.value.filter(option => statuses.includes(String(option.value)))
})

const equipmentOptionsWithAll = computed(() => [
  { id: 0, value: "all", name: t("catalog.list.all"), disabled: false },
  ...filteredOptions.value.equipment.filter(option => String(option.value) !== "all"),
])

const equipmentFilterItems = computed(() => {
  const equipmentIds = normalizeEquipmentFilter(props.filters.equipment)
  if (!equipmentIds.length) {
    return [equipmentOptionsWithAll.value[0]]
  }
  return equipmentOptionsWithAll.value.filter(option => equipmentIds.includes(String(option.value)))
})

function applyEquipmentDependentDisabled(hasSpecificEquipment: boolean) {
  scaleDisabled.value = hasSpecificEquipment
  driveTypeDisabled.value = hasSpecificEquipment
  powerTypeDisabled.value = hasSpecificEquipment
  gearboxDisabled.value = hasSpecificEquipment
}

watch(
  bookedMode,
  (isBooked) => {
    applyStatusOptionsByMode(isBooked)
  },
  { immediate: true },
)

const debouncedFetchBrands = debounce(async () => {
  try {
    const brandParams: FilterOptionParams = {
      ...catalogScopeParams(),
    }
    const response = await getBrands(brandParams)
    if (response.data) {
      localOptions.value.brand = [
        { id: 0, value: "all", name: t("catalog.list.all"), disabled: false },
        ...response.data.map(brand => ({
          id: brand.id,
          value: brand.id.toString(),
          name: `${brand.name} (${brand.listings_count})`,
          disabled: brand.listings_count === 0,
          image: brand.image,
        })),
      ]
    }
    else {
      localOptions.value.brand = [{ id: 0, value: "all", name: t("catalog.list.all"), disabled: false }]
    }
  }
  catch {
    localOptions.value.brand = [{ id: 0, value: "all", name: t("catalog.list.all"), disabled: false }]
  }
}, 300)

const fetchBuyers = async () => {
  if (!userStore.isDirector && !userStore.isAdmin) {
    localOptions.value.buyer = [{ id: 0, value: "all", name: t("catalog.list.all"), disabled: false }]
    return
  }

  try {
    const response = await getBuyers()

    if (response.data && Array.isArray(response.data)) {
      localOptions.value.buyer = [
        { id: 0, value: "all", name: t("catalog.list.all"), disabled: false },
        ...response.data.map(user => ({
          id: user.id,
          value: String(user.id),
          name: user.name,
          disabled: false,
        })),
      ]
    }
    else {
      localOptions.value.buyer = [{ id: 0, value: "all", name: t("catalog.list.all"), disabled: false }]
    }
  }
  catch (error) {
    console.error("Failed to fetch buyers:", error)
    localOptions.value.buyer = [{ id: 0, value: "all", name: t("catalog.list.all"), disabled: false }]
  }
}

const fetchManagers = async () => {
  if (!userStore.isSellerClient) {
    return
  }

  try {
    const response = await getManagers()

    if (response.data && Array.isArray(response.data)) {
      const currentUserId = userStore.currentUserId
      const others = response.data
        .filter(m => m.id !== currentUserId)
        .map(m => ({
          id: m.id,
          value: String(m.id),
          name: m.name,
          disabled: false,
        }))
      localOptions.value.manager = [
        { id: -1, value: "mine", name: t("catalog.filter.manager_mine"), disabled: false },
        { id: 0, value: "all", name: t("catalog.list.all"), disabled: false },
        ...others,
      ]
    }
  }
  catch {
    localOptions.value.manager = [
      { id: -1, value: "mine", name: t("catalog.filter.manager_mine"), disabled: false },
      { id: 0, value: "all", name: t("catalog.list.all"), disabled: false },
    ]
  }
}

const reloadOptions = () => {
  debouncedFetchBrands()

  if (props.filters.brand && props.filters.brand !== "all") {
    debouncedFetchModels(props.filters.brand)
  }
  else {
    localOptions.value.model = [{ id: 0, value: "all", name: t("catalog.list.all"), disabled: true }]
    localOptions.value.equipment = [{ id: 0, value: "all", name: t("catalog.list.all"), disabled: true }]
    modelDisabled.value = true
    equipmentDisabled.value = true
  }

  if (props.filters.model && props.filters.model !== "all") {
    debouncedFetchCompletions(props.filters.model)
  }

  pendingInit = true
  debouncedFetchParts(true)
}

const debouncedFetchModels = debounce(async (brandId: string | undefined) => {
  if (!brandId || brandId === "all") {
    localOptions.value.model = [{ id: 0, value: "all", name: t("catalog.list.all"), disabled: true }]
    localOptions.value.equipment = [{ id: 0, value: "all", name: t("catalog.list.all"), disabled: true }]
    modelDisabled.value = true
    equipmentDisabled.value = true
    return
  }
  try {
    const response = await getModels(Number(brandId), catalogScopeParams())
    if (response.data) {
      localOptions.value.model = [
        { id: 0, value: "all", name: t("catalog.list.all"), disabled: false },
        ...response.data.map(model => ({
          id: model.id,
          value: model.id.toString(),
          name: `${model.name} (${model.listings_count})`,
          disabled: model.listings_count === 0,
        })),
      ]
      modelDisabled.value = false
    }
    else {
      localOptions.value.model = [{ id: 0, value: "all", name: t("catalog.list.all"), disabled: true }]
      modelDisabled.value = true
    }
  }
  catch {
    localOptions.value.model = [{ id: 0, value: "all", name: t("catalog.list.all"), disabled: true }]
    modelDisabled.value = true
  }
  localOptions.value.equipment = [{ id: 0, value: "all", name: t("catalog.list.all"), disabled: true }]
  equipmentDisabled.value = true
}, 300)

const debouncedFetchCompletions = debounce(async (modelId: string | undefined) => {
  if (!modelId || modelId === "all") {
    localOptions.value.equipment = [{ id: 0, value: "all", name: t("catalog.list.all"), disabled: true }]
    equipmentDisabled.value = true
    return
  }
  try {
    const response = await getCompletions(Number(modelId), catalogScopeParams())
    if (response.data) {
      localOptions.value.equipment = [
        { id: 0, value: "all", name: t("catalog.list.all"), disabled: false },
        ...response.data.map(completion => ({
          id: completion.id,
          value: completion.id.toString(),
          name: `${completion.name} (${completion.listings_count})`,
          disabled: completion.listings_count === 0,
        })),
      ]
      equipmentDisabled.value = false
    }
    else {
      localOptions.value.equipment = [{ id: 0, value: "all", name: t("catalog.list.all"), disabled: true }]
      equipmentDisabled.value = true
    }
  }
  catch {
    localOptions.value.equipment = [{ id: 0, value: "all", name: t("catalog.list.all"), disabled: true }]
    equipmentDisabled.value = true
  }
}, 300)

let pendingInit = false

const debouncedFetchParts = debounce(async (initArg = false) => {
  const init = initArg || pendingInit
  pendingInit = false

  const resetOptions = () => {
    localOptions.value.gearbox = localOptions.value.gearbox.map(option => ({
      ...option,
      name: t(`cars.gearbox.${option.value}`),
      disabled: option.value !== "all",
    }))
    localOptions.value.power_type = localOptions.value.power_type.map(option => ({
      ...option,
      name: t(`cars.power_type.${option.value}`),
      disabled: option.value !== "all",
    }))
    localOptions.value.drive_type = localOptions.value.drive_type.map(option => ({
      ...option,
      name: t(`cars.drive_type.${option.value}`),
      disabled: option.value !== "all",
    }))
    localOptions.value.scale = localOptions.value.scale.map(option => ({
      ...option,
      name: t(`cars.scale_type.${option.value}`),
      disabled: option.value !== "all",
    }))

    if (init) {
      localOptions.value.condition = localOptions.value.condition.map(option => ({
        ...option,
        name: t(`cars.condition.${option.value}`),
        disabled: option.value !== "all",
      }))
    }
  }

  try {
    const params: FilterOptionParams = {
      ...catalogScopeParams(),
      brand_id: props.filters.brand && props.filters.brand !== "all" ? Number(props.filters.brand) : undefined,
      model_id: props.filters.model && props.filters.model !== "all" ? Number(props.filters.model) : undefined,
      init,
    }

    const response = await getParts(params)

    if (response.data) {
      localOptions.value.gearbox = localOptions.value.gearbox.map((option) => {
        if (option.value === "all") {
          return option
        }
        const count = typeof response.data?.gearbox?.[option.value] === "number" ? response.data?.gearbox[option.value] : 0
        return {
          ...option,
          name: `${t(`cars.gearbox.${option.value}`)} (${count})`,
          disabled: count === 0,
        }
      })

      localOptions.value.power_type = localOptions.value.power_type.map((option) => {
        if (option.value === "all") {
          return option
        }
        const count = typeof response.data?.power_type?.[option.value] === "number" ? response.data?.power_type[option.value] : 0
        return {
          ...option,
          name: `${t(`cars.power_type.${option.value}`)} (${count})`,
          disabled: count === 0,
        }
      })

      localOptions.value.drive_type = localOptions.value.drive_type.map((option) => {
        if (option.value === "all") {
          return option
        }
        const count = typeof response.data?.drive_type?.[option.value] === "number" ? response.data?.drive_type[option.value] : 0
        return {
          ...option,
          name: `${t(`cars.drive_type.${option.value}`)} (${count})`,
          disabled: count === 0,
        }
      })

      localOptions.value.scale = localOptions.value.scale.map((option) => {
        if (option.value === "all") {
          return option
        }
        const count = typeof response.data?.scale?.[option.value] === "number" ? response.data?.scale[option.value] : 0
        return {
          ...option,
          name: `${t(`cars.scale_type.${option.value}`)} (${count})`,
          disabled: count === 0,
        }
      })

      if (init) {
        localOptions.value.condition = localOptions.value.condition.map((option) => {
          if (option.value === "all") {
            return option
          }
          const count = typeof response.data?.condition?.[option.value] === "number" ? response.data?.condition[option.value] : 0
          return {
            ...option,
            name: `${t(`cars.condition.${option.value}`)} (${count})`,
            disabled: count === 0,
          }
        })

        const statusMap = response.data?.status ?? {}
        localOptions.value.status = localOptions.value.status.map((option) => {
          if (option.value === "all") {
            return option
          }

          const rawCount = statusMap[option.value as string]
          const count = typeof rawCount === "number" ? rawCount : 0

          const labelKey = bookedMode.value
            ? `order_status.default.${option.value}`
            : `catalog.list.${option.value}`

          return {
            ...option,
            name: `${t(labelKey)} (${count})`,
            disabled: count === 0,
          }
        })
      }
    }
    else {
      resetOptions()
    }
  }
  catch {
    resetOptions()
  }
}, 300)

const getOptionValue = (option: any): any => {
  if (option && typeof option === "object" && "value" in option) {
    return option.value
  }
  return option
}

const getOptionByValue = (options: any[], value: any) => {
  if (value === undefined || value === null) {
    return undefined
  }
  return options.find(option =>
    (typeof option === "object" && "value" in option) ? option.value === value : option === value,
  )
}

async function validateOptions(savedFilters: Filters): Promise<{ filters: Filters, wasModified: boolean }> {
  isInitializing.value = true
  const validatedFilters = {
    ...savedFilters,
    status: normalizeStatusFilter(savedFilters.status as string | string[] | undefined),
    equipment: normalizeEquipmentFilter(savedFilters.equipment as string | string[] | undefined),
  }
  let wasModified = false
  try {
    const params: FilterOptionParams = {
      isSeller: props.isSeller,
      condition: savedFilters.condition,
      sale_status: savedFilters.sale_status,
      deleted: savedFilters.deleted,
      archive: savedFilters.archive,
      favorites: savedFilters.favorites,
    }
    if (savedFilters.brand && savedFilters.brand !== "all") {
      params.brand_id = savedFilters.brand
    }
    if (savedFilters.model && savedFilters.model !== "all") {
      params.model_id = savedFilters.model
    }
    const response = await getFilterOptions(params)

    localOptions.value.brand = [
      { id: 0, value: "all", name: t("catalog.list.all"), disabled: false },
      ...(response.data?.brands ?? []).map(brand => ({
        id: brand.id,
        value: brand.id.toString(),
        name: `${brand.name} (${brand.listings_count})`,
        disabled: brand.listings_count === 0,
      })),
    ]

    if (savedFilters.brand && savedFilters.brand !== "all") {
      const brandExists = localOptions.value.brand.some(option => option.value === savedFilters.brand)
      if (!brandExists) {
        validatedFilters.brand = undefined
        validatedFilters.model = undefined
        validatedFilters.equipment = []
        wasModified = true
      }
    }

    localOptions.value.model = (response.data?.models?.length ?? 0)
      ? [
          { id: 0, value: "all", name: t("catalog.list.all"), disabled: false },
          ...(response.data?.models ?? []).map(model => ({
            id: model.id,
            value: model.id.toString(),
            name: `${model.name} (${model.listings_count})`,
            disabled: model.listings_count === 0,
          })),
        ]
      : [{ id: 0, value: "all", name: t("catalog.list.all"), disabled: true }]
    modelDisabled.value = (response.data?.models?.length ?? 0) === 0

    if (savedFilters.model && savedFilters.model !== "all") {
      const modelExists = localOptions.value.model.some(option => option.value === savedFilters.model)
      if (!modelExists) {
        validatedFilters.model = undefined
        validatedFilters.equipment = []
        wasModified = true
      }
    }

    localOptions.value.equipment = (response.data?.completions?.length ?? 0)
      ? [
          { id: 0, value: "all", name: t("catalog.list.all"), disabled: false },
          ...(response.data?.completions ?? []).map(completion => ({
            id: completion.id,
            value: completion.id.toString(),
            name: `${completion.name} (${completion.listings_count})`,
            disabled: completion.listings_count === 0,
          })),
        ]
      : [{ id: 0, value: "all", name: t("catalog.list.all"), disabled: true }]
    equipmentDisabled.value = (response.data?.completions?.length ?? 0) === 0

    const savedEquipment = normalizeEquipmentFilter(savedFilters.equipment as string | string[] | undefined)
    if (savedEquipment.length > 0) {
      const existingEquipment = savedEquipment.filter(id =>
        localOptions.value.equipment.some(option => String(option.value) === id),
      )
      if (existingEquipment.length !== savedEquipment.length) {
        wasModified = true
      }
      validatedFilters.equipment = existingEquipment
    }
    else {
      validatedFilters.equipment = []
    }
    applyEquipmentDependentDisabled(validatedFilters.equipment.length > 0)

    localOptions.value.gearbox = localOptions.value.gearbox.map((option) => {
      if (option.value === "all") {
        return option
      }
      const count = typeof response.data?.parts?.gearbox?.[option.value] === "number"
        ? response.data.parts.gearbox[option.value]
        : 0
      return {
        ...option,
        name: `${t(`cars.gearbox.${option.value}`)} (${count})`,
        disabled: count === 0,
      }
    })

    localOptions.value.power_type = localOptions.value.power_type.map((option) => {
      if (option.value === "all") {
        return option
      }
      const count = typeof response.data?.parts?.power_type?.[option.value] === "number"
        ? response.data.parts.power_type[option.value]
        : 0
      return {
        ...option,
        name: `${t(`cars.power_type.${option.value}`)} (${count})`,
        disabled: count === 0,
      }
    })

    localOptions.value.drive_type = localOptions.value.drive_type.map((option) => {
      if (option.value === "all") {
        return option
      }
      const count = typeof response.data?.parts?.drive_type?.[option.value] === "number"
        ? response.data.parts.drive_type[option.value]
        : 0
      return {
        ...option,
        name: `${t(`cars.drive_type.${option.value}`)} (${count})`,
        disabled: count === 0,
      }
    })

    localOptions.value.scale = localOptions.value.scale.map((option) => {
      if (option.value === "all") {
        return option
      }
      const count = typeof response.data?.parts?.scale?.[option.value] === "number"
        ? response.data.parts.scale[option.value]
        : 0
      return {
        ...option,
        name: `${t(`cars.scale_type.${option.value}`)} (${count})`,
        disabled: count === 0,
      }
    })

    localOptions.value.condition = localOptions.value.condition.map((option) => {
      if (option.value === "all") {
        return option
      }
      const count = typeof response.data?.parts?.condition?.[option.value] === "number"
        ? response.data.parts.condition[option.value]
        : 0
      return {
        ...option,
        name: `${t(`cars.condition.${option.value}`)} (${count})`,
        disabled: count === 0,
      }
    })

    if (savedFilters.gearbox && savedFilters.gearbox !== "all" && !localOptions.value.gearbox.some(option => option.value === savedFilters.gearbox)) {
      validatedFilters.gearbox = "all"
      wasModified = true
    }
    if (savedFilters.power_type && savedFilters.power_type !== "all" && !localOptions.value.power_type.some(option => option.value === savedFilters.power_type)) {
      validatedFilters.power_type = "all"
      wasModified = true
    }
    if (savedFilters.drive_type && savedFilters.drive_type !== "all" && !localOptions.value.drive_type.some(option => option.value === savedFilters.drive_type)) {
      validatedFilters.drive_type = "all"
      wasModified = true
    }
    if (savedFilters.scale && savedFilters.scale !== "all" && !localOptions.value.scale.some(option => option.value === savedFilters.scale)) {
      validatedFilters.scale = "all"
      wasModified = true
    }
    if (savedFilters.color && savedFilters.color !== "all" && !localOptions.value.color.some(option => option.value === savedFilters.color)) {
      validatedFilters.color = "all"
      wasModified = true
    }
    if (savedFilters.condition && savedFilters.condition !== "all" && !localOptions.value.condition.some(option => option.value === savedFilters.condition)) {
      validatedFilters.condition = "all"
      wasModified = true
    }
  }
  catch {
    validatedFilters.brand = undefined
    validatedFilters.model = undefined
    validatedFilters.equipment = []
    validatedFilters.gearbox = "all"
    validatedFilters.power_type = "all"
    validatedFilters.drive_type = "all"
    validatedFilters.scale = "all"
    validatedFilters.color = "all"
    validatedFilters.condition = "all"
    validatedFilters.hasVideo = false
    validatedFilters.hasDiagnostics = false
    validatedFilters.hasCompensation = false
    localOptions.value.brand = [{ id: 0, value: "all", name: t("catalog.list.all"), disabled: false }]
    localOptions.value.model = [{ id: 0, value: "all", name: t("catalog.list.all"), disabled: true }]
    localOptions.value.equipment = [{ id: 0, value: "all", name: t("catalog.list.all"), disabled: true }]
    modelDisabled.value = true
    equipmentDisabled.value = true
    applyEquipmentDependentDisabled(false)
    wasModified = true
    errorNotify(t("catalog.filter.validation_failed"))
  }
  emit("update:filters", validatedFilters)

  nextTick(() => {
    isInitializing.value = false
  })

  return { filters: validatedFilters, wasModified }
}

const updateVisibility = (value: any) => {
  const visibilityValue = getOptionValue(value)
  emit("update:filters", {
    ...props.filters,
    visibility: visibilityValue,
  })
}

const updateBuyer = (value: any) => {
  const buyerValue = getOptionValue(value)
  emit("update:filters", {
    ...props.filters,
    buyer: buyerValue,
  })
}

const updateManager = (value: any) => {
  emit("update:filters", {
    ...props.filters,
    seller_id: getOptionValue(value),
  })
}

const updateStatus = (value: OptionBase[] | OptionBase | string | number) => {
  const nextArray = (Array.isArray(value) ? value : [value])
    .map((item) => {
      if (typeof item === "object" && item !== null) {
        return item as OptionBase
      }
      return statusOptionsWithAll.value.find(option => String(option.value) === String(item))
        || { id: 0, value: String(item), name: String(item), disabled: false }
    })
    .filter(option => String(option.value) === "all"
      || statusOptionsWithAll.value.some(item => String(item.value) === String(option.value)))

  const currentArray = statusFilterItems.value
  const nextHasAll = nextArray.some(item => String(item.value) === "all")
  const currentHasAll = currentArray.some(item => String(item.value) === "all")

  let nextStatuses: string[] = []

  if (nextHasAll && !currentHasAll) {
    nextStatuses = []
  }
  else if (currentHasAll && nextHasAll && nextArray.length > 1) {
    nextStatuses = nextArray
      .filter(item => String(item.value) !== "all")
      .map(item => String(item.value))
  }
  else if (nextArray.length === 0) {
    nextStatuses = []
  }
  else {
    nextStatuses = nextArray
      .filter(item => String(item.value) !== "all")
      .map(item => String(item.value))
  }

  emit("update:filters", {
    ...props.filters,
    status: nextStatuses,
  })
}

const updateCondition = (value: any) => {
  const conditionValue = getOptionValue(value)
  emit("update:filters", {
    ...props.filters,
    condition: conditionValue,
    brand: undefined,
    model: undefined,
    equipment: [],
    power_type: "all",
    gearbox: "all",
    drive_type: "all",
    scale: "all",
    color: "all",
    hasVideo: false,
    hasDiagnostics: false,
    hasCompensation: false,
    original_paint: false,
  })
  localOptions.value.brand = [{ id: 0, value: "all", name: t("catalog.list.all"), disabled: false }]
  localOptions.value.model = [{ id: 0, value: "all", name: t("catalog.list.all"), disabled: true }]
  localOptions.value.equipment = [{ id: 0, value: "all", name: t("catalog.list.all"), disabled: true }]
  modelDisabled.value = true
  equipmentDisabled.value = true
  applyEquipmentDependentDisabled(false)
  debouncedFetchBrands()
  debouncedFetchParts()
}

const updateBrand = (value: any) => {
  const brandValue = getOptionValue(value)
  emit("update:filters", {
    ...props.filters,
    brand: brandValue,
    model: "all",
    equipment: [],
    power_type: "all",
    gearbox: "all",
    drive_type: "all",
    scale: "all",
    color: "all",
    hasVideo: false,
    hasDiagnostics: false,
    hasCompensation: false,
    original_paint: false,
  })
  applyEquipmentDependentDisabled(false)
  debouncedFetchModels(brandValue)
}

const updateModel = (value: any) => {
  const modelValue = getOptionValue(value)
  emit("update:filters", {
    ...props.filters,
    model: modelValue,
    equipment: [],
    power_type: "all",
    gearbox: "all",
    drive_type: "all",
    scale: "all",
    color: "all",
    hasVideo: false,
    hasDiagnostics: false,
    hasCompensation: false,
    original_paint: false,
  })
  applyEquipmentDependentDisabled(false)
  debouncedFetchCompletions(modelValue)
}

const updateEquipment = (value: OptionBase[] | OptionBase | string | number) => {
  const nextArray = (Array.isArray(value) ? value : [value])
    .map((item) => {
      if (typeof item === "object" && item !== null) {
        return item as OptionBase
      }
      return equipmentOptionsWithAll.value.find(option => String(option.value) === String(item))
        || { id: 0, value: String(item), name: String(item), disabled: false }
    })
    .filter(option => String(option.value) === "all"
      || equipmentOptionsWithAll.value.some(item => String(item.value) === String(option.value)))

  const currentArray = equipmentFilterItems.value
  const nextHasAll = nextArray.some(item => String(item.value) === "all")
  const currentHasAll = currentArray.some(item => String(item.value) === "all")

  let nextEquipment: string[] = []

  if (nextHasAll && !currentHasAll) {
    nextEquipment = []
  }
  else if (currentHasAll && nextHasAll && nextArray.length > 1) {
    nextEquipment = nextArray
      .filter(item => String(item.value) !== "all")
      .map(item => String(item.value))
  }
  else if (nextArray.length === 0) {
    nextEquipment = []
  }
  else {
    nextEquipment = nextArray
      .filter(item => String(item.value) !== "all")
      .map(item => String(item.value))
  }

  const hasSpecificEquipment = nextEquipment.length > 0
  applyEquipmentDependentDisabled(hasSpecificEquipment)
  emit("update:filters", {
    ...props.filters,
    equipment: nextEquipment,
    scale: hasSpecificEquipment ? "all" : props.filters.scale,
    color: hasSpecificEquipment ? "all" : props.filters.color,
    drive_type: hasSpecificEquipment ? "all" : props.filters.drive_type,
    power_type: hasSpecificEquipment ? "all" : props.filters.power_type,
    gearbox: hasSpecificEquipment ? "all" : props.filters.gearbox,
    hasVideo: false,
    hasDiagnostics: false,
    hasCompensation: false,
    original_paint: false,
  })
}

const updateMileage = (value: any) => {
  emit("update:filters", { ...props.filters, mileage: getOptionValue(value) })
}
const updateColor = (value: any) => {
  const colorValue = getOptionValue(value)

  emit("update:filters", {
    ...props.filters,
    color: colorValue,
  })
}
const updatePrice = (value: any) => {
  emit("update:filters", { ...props.filters, price: getOptionValue(value) })
}
const resetFilters = () => {
  emit("update:filters", {
    ...props.filters,
    status: [],
    buyer: undefined,
    seller_id: userStore.isSellerClient ? "mine" : undefined,
    condition: "all",
    brand: undefined,
    model: undefined,
    year: { left: undefined, right: undefined },
    displacement: { left: undefined, right: undefined },
    equipment: [],
    price: undefined,
    mileage: undefined,
    gearbox: "all",
    power_type: "all",
    drive_type: "all",
    scale: "all",
    color: "all",
    visibility: "all",
    hasVideo: false,
    hasDiagnostics: false,
    hasCompensation: false,
    original_paint: false,
    vin: "",
    internal_number: "",
    bought_at: null,
  })
  localOptions.value.brand = [{ id: 0, value: "all", name: t("catalog.list.all"), disabled: false }]
  localOptions.value.model = [{ id: 0, value: "all", name: t("catalog.list.all"), disabled: true }]
  localOptions.value.equipment = [{ id: 0, value: "all", name: t("catalog.list.all"), disabled: true }]
  modelDisabled.value = true
  equipmentDisabled.value = true
  applyEquipmentDependentDisabled(false)
  mileageKey.value += 1
  priceKey.value += 1
  fetchBuyers()
  debouncedFetchBrands()
  debouncedFetchParts()
  emit("apply-filters")
}

const resetMileage = () => {
  emit("update:filters", { ...props.filters, mileage: undefined })
  mileageKey.value += 1
}
const resetPrice = () => {
  emit("update:filters", { ...props.filters, price: undefined })
  priceKey.value += 1
}
onMounted(() => {
  debouncedFetchBrands()
  debouncedFetchParts(true)
  fetchBuyers()
  fetchManagers()
})

watch(() => props.filters.brand, (newBrand, oldBrand) => {
  if (isInitializing.value) {
    return
  }
  if (newBrand !== oldBrand) {
    debouncedFetchModels(newBrand)
    debouncedFetchParts()
  }
})

watch(() => props.filters.model, (newModel, oldModel) => {
  if (isInitializing.value) {
    return
  }
  if (newModel !== oldModel) {
    debouncedFetchCompletions(newModel)
    debouncedFetchParts()
  }
})

watch(() => props.filters.equipment, (equipment) => {
  applyEquipmentDependentDisabled(normalizeEquipmentFilter(equipment).length > 0)
}, { deep: true })

watch(hasVideo, (value) => {
  emit("update:filters", { ...props.filters, hasVideo: value })
})

watch(() => props.filters.hasVideo, (value) => {
  if (value !== hasVideo.value) {
    hasVideo.value = !!value
  }
})

watch(hasDiagnostics, (value) => {
  emit("update:filters", { ...props.filters, hasDiagnostics: value })
})

watch(() => props.filters.hasDiagnostics, (value) => {
  if (value !== hasDiagnostics.value) {
    hasDiagnostics.value = !!value
  }
})

watch(hasCompensation, (value) => {
  emit("update:filters", { ...props.filters, hasCompensation: value })
})

watch(() => props.filters.hasCompensation, (value) => {
  if (value !== hasCompensation.value) {
    hasCompensation.value = !!value
  }
})

watch(hasOriginalPaint, (value) => {
  emit("update:filters", { ...props.filters, original_paint: value })
})

watch(() => props.filters.original_paint, (value) => {
  if (value !== hasOriginalPaint.value) {
    hasOriginalPaint.value = !!value
  }
})

watch(() => props.filters.condition, () => {
  if (isInitializing.value) {
    return
  }
  debouncedFetchBrands()
  debouncedFetchParts()
})

const isExpanded = ref(true)

const toggleFilter = () => {
  isExpanded.value = !isExpanded.value
}

defineExpose({
  validateOptions,
  reloadOptions,
})
</script>

<style module>
.filterBox {
  @apply bg-gray-100 rounded-xl p-6;
  @apply flex flex-col gap-6;
}

.fieldsGrid {
  @apply grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 items-start;
  @apply w-full;
}

.collapseLink {
  @apply text-sm text-gray-500 underline decoration-gray-400 decoration-1 underline-offset-4 hover:text-gray-700 transition-colors;
  @apply w-full text-center md:text-left;
  @apply md:col-start-1 md:justify-self-start;
}

.buttonsGroup {
  @apply w-full mt-2;
  @apply flex flex-col-reverse gap-4;
  @apply md:grid md:grid-cols-3 md:items-center md:gap-0;
  @apply md:flex-none;
}

.togglesContainer {
  @apply col-span-full;
  @apply flex flex-row flex-wrap items-center gap-x-6 gap-y-3;
}

.videoRow {
  @apply flex w-full items-center justify-start gap-3 px-1 md:w-auto;
}

.videoLabel {
  @apply text-sm font-medium text-gray-900;
}

.videoRowLocked {
  @apply cursor-pointer;
}

.videoSwitchLocked {
  @apply opacity-60 pointer-events-none;
}

.videoSwitch {
  @apply relative inline-flex h-6 w-11 items-center rounded-full bg-white border border-gray-400 transition-colors flex-shrink-0;
}
.videoSwitch[aria-checked="true"] {
  @apply bg-blue-600 border-blue-600;
}
.videoSwitch::after {
  @apply absolute h-4 w-4 rounded-full bg-gray-400 transition-transform;
  content: '';
  transform: translateX(2px);
}
.videoSwitch[aria-checked="true"]::after {
  @apply bg-white translate-x-6;
}

.filterShowBtn {
  @apply w-full;
  @apply md:w-auto md:min-w-[300px] md:justify-self-center md:col-start-2;
}

.filterResetBtn {
  @apply w-full;
  @apply md:w-auto md:justify-self-end md:col-start-3;
}

.engineTypeHint {
  @apply text-xs text-gray-400 ml-1;
}

.rangeWrapper {
  @apply relative;
}

.clearButton {
  top: 20%;
  @apply absolute right-0 transform -translate-y-1/2 text-gray-500 hover:text-gray-700;
}

.closeIcon {
  @apply w-4 h-4;
}

.vinInput {
  @apply w-full;
  margin-top: -.2rem;
}

.collapsed > *:nth-child(n+2) {
  display: none;
}

@media (min-width: 768px) {
  .collapsed > *:nth-child(n+2) {
    display: block;
  }
  .collapsed > *:nth-child(n+4) {
    display: none;
  }
}

@media (min-width: 1024px) {
  .collapsed > *:nth-child(n+4) {
    display: block;
  }
  .collapsed > *:nth-child(n+5) {
    display: none;
  }
}
</style>
