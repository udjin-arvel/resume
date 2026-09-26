<template>
  <div>
    <div :class="$style.header">
      <div :class="$style.titleRow">
        <CommonBackButton :to="{ name: 'personal-needs' }" />
        <div>
          <h1 :class="$style.title">
            <template v-if="isCreate">
              {{ t('needs.detail.title_new') }}
            </template>
            <template v-else>
              {{ t('needs.detail.title', { number: String(numericId).padStart(4, '0') }) }}
            </template>
          </h1>
        </div>
      </div>
    </div>

    <template v-if="!isEdit || requestFound">
      <form @submit.prevent>
        <div :class="$style.container">
          <div :class="$style.leftColumn">
            <CommonAlert
              v-if="alert"
              :alert="alert"
              :class="$style.alert"
            />

            <NeedVariantsList
              v-if="variants.length > 1 || !isCreate"
              :variants="variants"
              :active-index="activeIndex"
              :can-remove="canRemoveVariants"
              @select="onSelectVariant"
              @remove="onRemoveVariant"
              @move-up="onMoveVariantUp"
              @move-down="onMoveVariantDown"
            />

            <div :class="$style.variantBadge">
              <Label
                kind="red"
                :text="t('needs.form.priority_label', { n: activeVariant?.priority ?? 1 })"
              />
            </div>

            <div :class="$style.formRow">
              <div :class="$style.formSubField">
                <SearchableSelect
                  v-model="requestData.brand"
                  :options="sortedBrands"
                  :label="t('needs.form.brand')"
                  :loading="isInitializing && !sortedBrands.length"
                  :disabled="isLoading"
                  :invalid-message="errors.get('brand')"
                  @update:model-value="errors.clear('brand')"
                />
              </div>
              <div :class="$style.formSubField">
                <SearchableSelect
                  v-model="requestData.series"
                  :options="series"
                  :label="t('needs.form.series')"
                  :loading="!!requestData.brand && isLoadingSeries"
                  :disabled="!requestData.brand || isLoading"
                  :invalid-message="errors.get('series')"
                  @update:model-value="errors.clear('series')"
                />
              </div>
            </div>

            <div :class="$style.formRow">
              <SearchableSelect
                v-model="yearFromSelect"
                :options="yearFromOptions"
                :loading="isSeriesCatalogLoading"
                :label="t('needs.form.year')"
                :placeholder="t('needs.form.year_from')"
                :class="$style.formSubField"
                :return-value-only="true"
                :disabled="!requestData.series || isLoading"
                :default-to-first-option="false"
                @update:model-value="onYearFromChange"
              />
              <SearchableSelect
                v-model="yearToSelect"
                :options="yearToOptions"
                :loading="isSeriesCatalogLoading"
                :label="t('needs.form.year_to')"
                :placeholder="t('needs.form.year_to')"
                :class="$style.formSubField"
                :return-value-only="true"
                :disabled="!requestData.series || isLoading"
                :default-to-first-option="false"
                @update:model-value="onYearToChange"
              />
            </div>

            <div :class="$style.formGroup">
              <div class="relative">
                <Select
                  v-model="engineTypeModel"
                  :options="availableEngineTypes"
                  :loading="isSeriesCatalogLoading"
                  :label="t('needs.engine_type')"
                  :required="specRequired.engineType"
                  :disabled="!requestData.series || (!isSeriesCatalogLoading && !specHasOptions.engineType)"
                  :placeholder="noDataPlaceholder(specHasOptions.engineType) ?? t('needs.form.select_value')"
                  :invalid-message="errors.get('engine_type')"
                />
                <Button
                  v-if="engineTypeModel && availableEngineTypes.length"
                  kind="unset"
                  size="unset"
                  :class="$style.resetFilterBtn"
                  @click="engineTypeModel = ''"
                >
                  <XMarkIcon class="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div :class="$style.formGroup">
              <div :class="$style.complectationHead">
                <span :class="$style.complectationLabel">{{ t('needs.form.model') }} <span>*</span></span>
                <Label
                  v-if="variantsLoaded"
                  kind="red"
                  :text="t('needs.form.variants_available', { count: filteredVariants.length })"
                />
              </div>
              <div
                class="relative"
              >
                <SearchableSelect
                  v-model="selectedModelsProxy"
                  :options="filteredModelOptions"
                  :loading="isSeriesCatalogLoading"
                  :display-fn="customModelDisplay"
                  :label="''"
                  :placeholder="variantsLoaded ? t('needs.form.variants_available', { count: filteredVariants.length }) : (isSeriesCatalogLoading ? t('common.loading') : '')"
                  :multiple="true"
                  :disabled="!requestData.series || isLoading || suppressWatch"
                  :invalid-message="errors.get('models')"
                  :default-to-first-option="false"
                  @input="alert = null"
                />
                <Button
                  v-if="requestData.models && requestData.models.length > 0"
                  kind="unset"
                  size="unset"
                  :class="$style.resetFilterBtn"
                  @click="requestData.models = []"
                >
                  <XMarkIcon class="w-4 h-4" />
                </Button>
              </div>
            </div>
            <SelectedCarsList
              :selected-cars="selectedCarsWithDetails"
              @remove="removeSelectedCar"
              @clear-all="clearAllSelectedCars"
            />
            <div :class="$style.formRow">
              <div :class="$style.formSubField">
                <div class="relative">
                  <SearchableSelect
                    v-model="engineModel"
                    :options="availableEngines"
                    :loading="isSeriesCatalogLoading"
                    :label="t('needs.engine')"
                    :required="specRequired.engine"
                    :disabled="!requestData.series || (!isSeriesCatalogLoading && !specHasOptions.engine)"
                    :placeholder="noDataPlaceholder(specHasOptions.engine)"
                    :default-to-first-option="false"
                    :return-value-only="true"
                    :invalid-message="errors.get('engine')"
                  />
                  <Button
                    v-if="engineModel && availableEngines.length"
                    kind="unset"
                    size="unset"
                    :class="$style.resetFilterBtn"
                    @click="engineModel = ''"
                  >
                    <XMarkIcon class="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div :class="$style.formSubField">
                <div class="relative">
                  <SearchableSelect
                    v-model="powerSelectModel"
                    :options="availablePowers"
                    :loading="isSeriesCatalogLoading"
                    :label="t('needs.power')"
                    :required="specRequired.power"
                    :disabled="!requestData.series || (!isSeriesCatalogLoading && !specHasOptions.power)"
                    :placeholder="noDataPlaceholder(specHasOptions.power)"
                    :default-to-first-option="false"
                    :return-value-only="true"
                    :invalid-message="errors.get('power')"
                  />
                  <Button
                    v-if="powerSelectModel && availablePowers.length"
                    kind="unset"
                    size="unset"
                    :class="$style.resetFilterBtn"
                    @click="powerSelectModel = ''"
                  >
                    <XMarkIcon class="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div :class="$style.formRow">
              <div :class="$style.formSubField">
                <div class="relative">
                  <Select
                    v-model="transmissionModel"
                    :options="availableTransmissions"
                    :loading="isSeriesCatalogLoading"
                    :label="t('needs.transmission')"
                    :required="specRequired.transmission"
                    :disabled="!requestData.series || (!isSeriesCatalogLoading && !specHasOptions.transmission)"
                    :placeholder="noDataPlaceholder(specHasOptions.transmission) ?? t('needs.form.select_value')"
                    :invalid-message="errors.get('transmission')"
                  />
                  <Button
                    v-if="transmissionModel && availableTransmissions.length"
                    kind="unset"
                    size="unset"
                    :class="$style.resetFilterBtn"
                    @click="transmissionModel = ''"
                  >
                    <XMarkIcon class="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div :class="$style.formSubField">
                <div class="relative">
                  <Select
                    v-model="driveModel"
                    :options="availableDrives"
                    :loading="isSeriesCatalogLoading"
                    :label="t('needs.drive')"
                    :required="specRequired.drive"
                    :disabled="!requestData.series || (!isSeriesCatalogLoading && !specHasOptions.drive)"
                    :placeholder="noDataPlaceholder(specHasOptions.drive) ?? t('needs.form.select_value')"
                    :invalid-message="errors.get('drive')"
                  />
                  <Button
                    v-if="driveModel && availableDrives.length"
                    kind="unset"
                    size="unset"
                    :class="$style.resetFilterBtn"
                    @click="driveModel = ''"
                  >
                    <XMarkIcon class="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div :class="$style.formRow">
              <div :class="$style.formSubField">
                <div class="relative">
                  <Select
                    v-model="bodyTypeModel"
                    :options="availableBodyTypes"
                    :loading="isSeriesCatalogLoading"
                    :label="t('needs.body_type')"
                    :required="specRequired.bodyType"
                    :placeholder="noDataPlaceholder(specHasOptions.bodyType) ?? t('needs.body_type')"
                    :class="$style.input"
                    :disabled="!requestData.series || (!isSeriesCatalogLoading && !specHasOptions.bodyType)"
                    :invalid-message="errors.get('body_type')"
                  />
                  <Button
                    v-if="bodyTypeModel && availableBodyTypes.length"
                    kind="unset"
                    size="unset"
                    :class="$style.resetFilterBtn"
                    @click="bodyTypeModel = ''"
                  >
                    <XMarkIcon class="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div :class="$style.formSubField">
                <SearchableSelect
                  v-model="(requestData as any).bodyColors"
                  :options="colorOptions"
                  :label="t('needs.form.body_color')"
                  :multiple="true"
                  :disabled="isLoading"
                  :invalid-message="errors.get('body_colors')"
                  @update:model-value="onBodyColorsChange"
                />
              </div>
            </div>

            <div :class="$style.rangeRow">
              <div :class="$style.rangeToField">
                <SearchableSelect
                  v-model="mileageSelect"
                  :options="mileageOptions"
                  :label="t('needs.form.mileage')"
                  :required="true"
                  :placeholder="t('needs.form.mileage_to')"
                  :class="$style.input"
                  :disabled="isLoading"
                  :allow-custom-input="true"
                  :return-value-only="true"
                  :show-invalid-message="true"
                  :invalid-message="errors.get('mileage_to')"
                  @update:model-value="onMileageUpdate"
                />
              </div>
              <div :class="$style.rangeToField">
                <SearchableSelect
                  v-model="priceSelect"
                  :options="priceOptions"
                  :label="t('needs.form.price')"
                  :required="true"
                  :placeholder="t('needs.form.price_to')"
                  :class="$style.input"
                  :disabled="isLoading"
                  :allow-custom-input="true"
                  :return-value-only="true"
                  :show-invalid-message="true"
                  :invalid-message="errors.get('price_to')"
                  @update:model-value="onPriceUpdate"
                />
              </div>
            </div>

            <div :class="$style.formGroup">
              <CheckBox
                v-model="requestData.originalPaint"
                :option-label="t('common.original_paint')"
              />
            </div>

            <div :class="$style.formGroup">
              <Textarea
                v-model="requestData.description"
                :label="t('needs.form.other_wishes')"
                :rows="4"
                :disabled="isLoading"
                :invalid-message="errors.get('description')"
                @update:model-value="errors.clear('description')"
              />
            </div>

            <div :class="$style.formGroup">
              <Input
                v-model="requestData.clientName"
                :label="t('needs.form.client_name')"
                :placeholder="t('needs.form.client_name_placeholder')"
                :class="$style.formField"
                :disabled="isLoading"
                :invalid-message="errors.get('client_name')"
                @input="errors.clear('client_name')"
              />
            </div>

            <div :class="$style.submitSection">
              <div :class="$style.submitSecondary">
                <Button
                  v-if="canSaveAsDraft"
                  type="button"
                  kind="white"
                  :disabled="isLoading"
                  @click="submitForm(true)"
                >
                  {{ t('needs.form.save_draft') }}
                </Button>

                <Button
                  type="button"
                  kind="white"
                  :disabled="isLoading"
                  @click="onAddVariant"
                >
                  {{ t('needs.form.add_variant') }}
                </Button>
              </div>

              <div>
                <Button
                  type="button"
                  kind="black"
                  :disabled="isLoading"
                  @click="submitForm(false)"
                >
                  {{ t('needs.form.submit') }}
                </Button>
              </div>
            </div>
          </div>

          <div :class="$style.rightColumn">
            <div
              v-if="carImage"
              :class="$style.stickyImage"
              @click="openFullscreen"
            >
              <img
                :src="carImage"
                alt="Car image"
                :class="$style.carImage"
              >
              <Button
                kind="unset"
                size="unset"
                :class="$style.iconOverlay"
                aria-label="Zoom image"
                @click.stop="openFullscreen"
              >
                <TwoArrows />
              </Button>
            </div>
          </div>
        </div>
      </form>

      <Teleport to="body">
        <transition name="fade">
          <div
            v-if="fullscreen.active"
            :class="$style.fullscreenOverlay"
            @click.self="closeFullscreen"
          >
            <Button
              kind="unset"
              size="unset"
              :class="$style.fullscreenClose"
              aria-label="Close"
              @click="closeFullscreen"
            >
              <XMarkIcon :class="$style.fullscreenCloseIcon" />
            </Button>
            <img
              :src="carImage!"
              alt="Car image large"
              :class="$style.fullscreenImg"
            >
          </div>
        </transition>
      </Teleport>
    </template>

    <CommonDataState
      v-if="isEdit"
      :loading="isRequestPending"
      :has-data="requestFound"
      :loading-text="t('needs.detail.loading')"
      :empty-text="t('needs.list.not_found')"
    />

    <Modal
      v-model="draftModalVisible"
      size="lg"
    >
      <template #body>
        <div class="text-left">
          <h3 class="text-lg font-medium text-gray-900 mb-2">
            {{ t('needs.form.draft_modal.title') }}
          </h3>
          <p class="text-sm text-gray-500">
            {{ canSaveAsDraft ? t('needs.form.draft_modal.desc_draft') : t('needs.form.draft_modal.desc_active') }}
          </p>
        </div>
      </template>
      <template #footer>
        <div class="flex gap-3 justify-end w-full mt-2">
          <Button
            kind="white"
            class="!text-red-600 border-red-200 hover:bg-red-50"
            @click="handleModalAction('leave')"
          >
            {{ t('needs.form.draft_modal.leave') }}
          </Button>

          <Button
            v-if="canSaveAsDraft"
            kind="black"
            @click="handleModalAction('save')"
          >
            {{ t('needs.form.draft_modal.save') }}
          </Button>

          <Button
            v-else
            kind="black"
            @click="handleModalAction('cancel')"
          >
            {{ t('needs.form.draft_modal.cancel') }}
          </Button>
        </div>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { onBeforeRouteLeave } from "vue-router"
import { XMarkIcon } from "@heroicons/vue/24/outline"
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import { useRoute, useRouter } from "#app"
import CommonAlert from "@/components/common/Alert.vue"
import Button from "@/components/common/Button.vue"
import Label from "@/components/common/Label.vue"
import Modal from "@/components/common/Modal.vue"
import Input from "@/components/form/Input.vue"
import SearchableSelect from "@/components/form/SearchableSelect.vue"
import CheckBox from "@/components/form/CheckBox.vue"
import Select from "@/components/form/Select.vue"
import Textarea from "@/components/form/Textarea.vue"
import TwoArrows from "@/components/icon/TwoArrows.vue"
import { RequestStatusNew, RequestStatusDraft, RequestStatusCompleted, RequestStatusCancelled } from "@/constants/statuses"
import SelectedCarsList from "@/components/needs/SelectedCarsList.vue"
import NeedVariantsList from "@/components/needs/NeedVariantsList.vue"
import { useApiCar } from "@/composables/api/useApiCar"
import useCarColors from "@/composables/useCarColors"
import useSearchRequest from "@/composables/useSearchRequest"
import { useSortedBrands } from "@/composables/useSortedBrands"
import {
  useNeedVariantsForm,
  createEmptyVariant,
  optionFromEntity,
} from "@/composables/needs/useNeedVariantsForm"
import type { Alert } from "@/types/common/alert"
import type { OptionBase } from "@/types/form/optionType"
import type { NeedVariantFormState, SearchRequestStore, SearchRequestUpdate } from "@/types/requests/searchRequest"

const props = defineProps<{ mode: "create" | "edit", requestId?: number }>()
const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()

const rawId = computed(() => (props.requestId != null ? String(props.requestId) : String(route.params.id ?? "")))
const numericId = computed(() => Number(rawId.value))
const isCreate = computed(() => props.mode === "create" || rawId.value === "0" || !Number.isFinite(numericId.value) || numericId.value === 0)
const isEdit = computed(() => !isCreate.value)

const prefillBrandId = computed(() => route.query.brand_id ? Number(route.query.brand_id) : null)
const prefillSeriesId = computed(() => route.query.series_id ? Number(route.query.series_id) : null)

const {
  isLoading, errors, requestData, store, update, show,
  brands, series,
  carImage,
  getBrands, getSeries, getModelsFullBySeries, allModelsFull,
} = useSearchRequest()

const { sortedBrands } = useSortedBrands(brands)

const {
  variants,
  activeIndex,
  activeVariant,
  addVariant,
  removeVariant,
  setActive,
  replaceVariantAt,
  moveVariant,
  replaceAll,
} = useNeedVariantsForm()

const { getYearsBySeries } = useApiCar()
const { colors } = useCarColors()

const alert = ref<Alert | null>(null)
const suppressWatch = ref(true)
const isDirty = ref(false)
const draftModalVisible = ref(false)
const isInitializing = ref(false)
const isSwitchingVariant = ref(false)
const hasFetchedRequest = ref(false)
const requestFound = ref(false)

const isRequestPending = computed(() =>
  isEdit.value && (!hasFetchedRequest.value || isInitializing.value),
)

let draftModalResolve: ((action: "save" | "leave" | "cancel") => void) | null = null

const canSaveAsDraft = computed(() => {
  return isCreate.value || requestData.value.status === RequestStatusDraft
})

const canRemoveVariants = computed(() => {
  return isCreate.value
    || ![RequestStatusCompleted, RequestStatusCancelled].includes(requestData.value.status as any)
})

const numberFormatter = computed(() => {
  return new Intl.NumberFormat(locale.value, { maximumFractionDigits: 0 })
})

const mileageOptions = computed<OptionBase[]>(() => {
  const out: OptionBase[] = []
  let id = 1
  for (let v = 10000; v <= 100000; v += 10000) {
    out.push({ id: id++, value: v, name: numberFormatter.value.format(v), disabled: false })
  }
  return out
})

const priceOptions = computed<OptionBase[]>(() => {
  const out: OptionBase[] = []
  let id = 1
  for (let v = 50000; v <= 250000; v += 5000) {
    out.push({ id: id++, value: v, name: numberFormatter.value.format(v), disabled: false })
  }
  return out
})

const ANY_COLOR: OptionBase = { id: 0, value: "__any__", name: t("cars.colors.any"), disabled: false }
const colorOptions = computed<OptionBase[]>(() => {
  const arr = colors.value ? [...colors.value] : []
  return [ANY_COLOR, ...arr]
})

const yearPool = ref<number[]>([])
const yearFromSelect = ref<number | undefined>(undefined)
const yearToSelect = ref<number | undefined>(undefined)
const mileageSelect = ref<number | string | undefined>(undefined)
const priceSelect = ref<number | string | undefined>(undefined)

const seriesCatalogCache = new Map<number, { models: any[], years: number[] }>()
const seriesOptionsCache = new Map<number, OptionBase[]>()

const filters = reactive({
  engineType: undefined as string | undefined,
  engine: undefined as string | undefined,
  power: undefined as number | undefined,
  transmission: undefined as string | undefined,
  drive: undefined as string | undefined,
  bodyType: undefined as string | undefined,
})

const engineTypeModel = computed({
  get: () => filters.engineType ?? "",
  set: (val: string | number) => {
    filters.engineType = val ? String(val) : undefined
    if (val) {
      errors.value.clear("engine_type")
    }
  },
})

const engineModel = computed({
  get: () => filters.engine ?? "",
  set: (val: string | number) => {
    filters.engine = val ? String(val) : undefined
    if (val) {
      errors.value.clear("engine")
    }
  },
})

const powerSelectModel = computed({
  get: () => filters.power ? String(filters.power) : "",
  set: (val: string | number | undefined) => {
    filters.power = val ? Number(val) : undefined
    if (val) {
      errors.value.clear("power")
    }
  },
})

const transmissionModel = computed({
  get: () => filters.transmission ?? "",
  set: (val: string | number) => {
    filters.transmission = val ? String(val) : undefined
    if (val) {
      errors.value.clear("transmission")
    }
  },
})

const driveModel = computed({
  get: () => filters.drive ?? "",
  set: (val: string | number) => {
    filters.drive = val ? String(val) : undefined
    if (val) {
      errors.value.clear("drive")
    }
  },
})

const bodyTypeModel = computed({
  get: () => filters.bodyType ?? "",
  set: (val: string | number) => {
    filters.bodyType = val ? String(val) : undefined
    if (val) {
      errors.value.clear("body_type")
    }
  },
})

const variantsLoaded = computed(() => allModelsFull.value.length > 0 && !!requestData.value.series)

const isSeriesCatalogLoading = computed(() => {
  return !!requestData.value.series?.value && (isInitializing.value || isSwitchingVariant.value)
})

const isLoadingSeries = ref(false)

const isMatch = (carVal: any, filterVal: any) => {
  if (filterVal === undefined || filterVal === "" || filterVal === null) {
    return true
  }
  if (carVal === undefined || carVal === null || carVal === "" || carVal === "-" || carVal === "0") {
    return true
  }
  if (typeof filterVal === "string") {
    return String(carVal).toLowerCase() === String(filterVal).toLowerCase()
  }
  return Number(carVal) === Number(filterVal)
}

const matchesFilters = (m: any, excludeKey?: string) => {
  const y = Number(m.year)
  const yFrom = yearFromSelect.value
  const yTo = yearToSelect.value
  if (yFrom != null && Number.isFinite(y) && y < yFrom) {
    return false
  }
  if (yTo != null && Number.isFinite(y) && y > yTo) {
    return false
  }

  if (excludeKey !== "engineType" && !isMatch(m.engine, filters.engineType)) {
    return false
  }
  if (excludeKey !== "engine" && !isMatch(m.displ ?? m.displacement, filters.engine)) {
    return false
  }
  if (excludeKey !== "power" && !isMatch(m.power, filters.power)) {
    return false
  }
  if (excludeKey !== "transmission" && !isMatch(m.gearbox, filters.transmission)) {
    return false
  }
  if (excludeKey !== "drive" && !isMatch(m.drive, filters.drive)) {
    return false
  }
  if (excludeKey !== "bodyType" && !isMatch(m.body, filters.bodyType)) {
    return false
  }

  return true
}

const filteredVariants = computed(() => {
  if (!variantsLoaded.value) {
    return []
  }
  return allModelsFull.value.filter(m => matchesFilters(m))
})

const ANY_MODEL: OptionBase = { id: 0, value: "__any_model__", name: t("needs.form.select_all"), disabled: false }

const filteredModelOptions = computed<OptionBase[]>(() => {
  const models = filteredVariants.value.map(m => ({
    id: Number(m.id),
    value: Number(m.id),
    name: m.name,
    disabled: false,
  }))

  if (models.length > 1) {
    return [ANY_MODEL, ...models]
  }

  return models
})

const resetFilters = () => {
  Object.assign(filters, {
    engineType: undefined,
    engine: undefined,
    power: undefined,
    transmission: undefined,
    drive: undefined,
    bodyType: undefined,
  })
}

const availableEngineTypes = computed<OptionBase[]>(() => {
  if (!variantsLoaded.value) {
    return []
  }
  const candidates = allModelsFull.value.filter(m => matchesFilters(m, "engineType"))
  const values = new Set(candidates.map(m => m.engine).filter(Boolean))

  const staticOpts = [
    { id: 1, value: "hybrid", name: t("cars.power_type.hybrid"), disabled: false },
    { id: 2, value: "petrol", name: t("cars.power_type.petrol"), disabled: false },
    { id: 3, value: "diesel", name: t("cars.power_type.diesel"), disabled: false },
    { id: 4, value: "electric", name: t("cars.power_type.electric"), disabled: false },
    { id: 5, value: "gas", name: t("cars.power_type.gas"), disabled: false },
  ]
  return staticOpts.filter(o => values.has(String(o.value)))
})

const availableEngines = computed<OptionBase[]>(() => {
  if (!variantsLoaded.value) {
    return []
  }
  const candidates = allModelsFull.value.filter(m => matchesFilters(m, "engine"))
  const values = new Set(candidates.map(m => m.displ ?? m.displacement).filter(v => v && v !== "0"))

  return Array.from(values).sort().map((val, idx) => ({
    id: idx, value: val, name: String(val), disabled: false,
  }))
})

const availablePowers = computed<OptionBase[]>(() => {
  if (!variantsLoaded.value) {
    return []
  }
  const candidates = allModelsFull.value.filter(m => matchesFilters(m, "power"))
  const values = new Set(candidates.map(m => Number(m.power)).filter(v => v > 0))

  return Array.from(values).sort((a, b) => a - b).map((val, idx) => ({
    id: idx, value: val, name: String(val), disabled: false,
  }))
})

const availableTransmissions = computed<OptionBase[]>(() => {
  if (!variantsLoaded.value) {
    return []
  }
  const candidates = allModelsFull.value.filter(m => matchesFilters(m, "transmission"))
  const values = new Set(candidates.map(m => m.gearbox).filter(Boolean))

  const staticOpts = [
    { id: 1, value: "mt", name: t("cars.gearbox.mt"), disabled: false },
    { id: 2, value: "at", name: t("cars.gearbox.at"), disabled: false },
    { id: 3, value: "dct", name: t("cars.gearbox.dct"), disabled: false },
    { id: 4, value: "cvt", name: t("cars.gearbox.cvt"), disabled: false },
    { id: 5, value: "am", name: t("cars.gearbox.am"), disabled: false },
    { id: 6, value: "ecvt", name: t("cars.gearbox.ecvt"), disabled: false },
    { id: 7, value: "single", name: t("cars.gearbox.single"), disabled: false },
    { id: 8, value: "dht", name: t("cars.gearbox.dht"), disabled: false },
    { id: 9, value: "other", name: t("cars.gearbox.other"), disabled: false },
  ]
  return staticOpts.filter(o => values.has(String(o.value)))
})

const availableDrives = computed<OptionBase[]>(() => {
  if (!variantsLoaded.value) {
    return []
  }
  const candidates = allModelsFull.value.filter(m => matchesFilters(m, "drive"))
  const values = new Set(candidates.map(m => m.drive).filter(Boolean))

  const staticOpts = [
    { id: 1, value: "awd", name: t("cars.drive_type.awd"), disabled: false },
    { id: 2, value: "fwd", name: t("cars.drive_type.fwd"), disabled: false },
    { id: 3, value: "rwd", name: t("cars.drive_type.rwd"), disabled: false },
  ]
  return staticOpts.filter(o => values.has(String(o.value)))
})

const availableBodyTypes = computed<OptionBase[]>(() => {
  if (!variantsLoaded.value) {
    return []
  }
  const candidates = allModelsFull.value.filter(m => matchesFilters(m, "bodyType"))
  const values = new Set(candidates.map(m => m.body).filter(Boolean))

  const staticOpts = [
    { id: 1, value: "sedan", name: t("cars.scale_type.sedan"), disabled: false },
    { id: 2, value: "suv", name: t("cars.scale_type.suv"), disabled: false },
    { id: 3, value: "coupe", name: t("cars.scale_type.coupe"), disabled: false },
    { id: 4, value: "hatchback", name: t("cars.scale_type.hatchback"), disabled: false },
    { id: 5, value: "minivan", name: t("cars.scale_type.minivan"), disabled: false },
    { id: 6, value: "pickup", name: t("cars.scale_type.pickup"), disabled: false },
  ]
  return staticOpts.filter(o => values.has(String(o.value)))
})

const specHasOptions = computed(() => ({
  engineType: availableEngineTypes.value.length > 0,
  engine: availableEngines.value.length > 0,
  power: availablePowers.value.length > 0,
  transmission: availableTransmissions.value.length > 0,
  drive: availableDrives.value.length > 0,
  bodyType: availableBodyTypes.value.length > 0,
}))

const selectedVariants = computed(() => {
  const ids = new Set((requestData.value.models || []).map((m: any) => Number(m?.value ?? m)))
  if (!ids.size) {
    return []
  }
  return allModelsFull.value.filter((m: any) => ids.has(Number(m.id)))
})

const hasSpecValue = (getter: (m: any) => unknown): boolean => {
  if (!selectedVariants.value.length) {
    return true
  }
  return selectedVariants.value.some((m: any) => {
    const value = getter(m)
    if (value == null) {
      return false
    }
    const str = String(value).trim()
    return str !== "" && str !== "0" && str !== "-"
  })
}

const specRequired = computed(() => ({
  engineType: specHasOptions.value.engineType && hasSpecValue(m => m.engine),
  engine: specHasOptions.value.engine && hasSpecValue(m => m.displ ?? m.displacement),
  power: specHasOptions.value.power && hasSpecValue(m => m.power),
  transmission: specHasOptions.value.transmission && hasSpecValue(m => m.gearbox),
  drive: specHasOptions.value.drive && hasSpecValue(m => m.drive),
  bodyType: specHasOptions.value.bodyType && hasSpecValue(m => m.body),
}))

const noDataPlaceholder = (hasOptions: boolean): string | undefined => {
  return variantsLoaded.value && !hasOptions ? t("needs.form.no_data") : undefined
}

const specErrorKeys = {
  engineType: "engine_type",
  engine: "engine",
  power: "power",
  transmission: "transmission",
  drive: "drive",
  bodyType: "body_type",
} as const

watch(specRequired, (required) => {
  (Object.keys(specErrorKeys) as (keyof typeof specErrorKeys)[]).forEach((key) => {
    if (!required[key]) {
      errors.value.clear(specErrorKeys[key])
    }
  })
}, { deep: true })

watch(
  () => [requestData.value, filters, yearFromSelect.value, yearToSelect.value, mileageSelect.value, priceSelect.value],
  () => {
    if (!suppressWatch.value && !isInitializing.value) {
      isDirty.value = true
    }
  },
  { deep: true },
)

function handleModalAction(action: "save" | "leave" | "cancel") {
  if (draftModalResolve) {
    draftModalResolve(action)
    draftModalResolve = null
  }
  draftModalVisible.value = false
}

watch(draftModalVisible, (isOpen) => {
  if (!isOpen && draftModalResolve) {
    draftModalResolve("cancel")
    draftModalResolve = null
  }
})

watch(filteredVariants, (newVariants) => {
  if (suppressWatch.value || isInitializing.value) {
    return
  }

  if (newVariants.length === 1 && newVariants[0].img) {
    carImage.value = newVariants[0].img
  }
  else if (newVariants.length === 0) {
    carImage.value = null
  }

  const validIds = new Set(newVariants.map(m => Number(m.id)))
  const currentSelection = (requestData.value.models || []) as OptionBase[]

  const nextSelection = currentSelection.filter((sel) => {
    const val = String(sel?.value ?? sel)
    return val === "__any_model__" || validIds.has(Number(val))
  })

  if (nextSelection.length !== currentSelection.length) {
    requestData.value.models = nextSelection
  }
}, { deep: true })

watch(() => requestData.value.models, (newModels) => {
  if (!newModels || newModels.length === 0) {
    carImage.value = null
    return
  }
  const firstModel = newModels[0]
  const modelId = Number((firstModel as any).value ?? firstModel)

  const modelData = allModelsFull.value.find(m => Number(m.id) === modelId)

  if (modelData?.img) {
    carImage.value = modelData.img
  }
  else {
    carImage.value = null
  }
}, { deep: true })

const selectedCarsWithDetails = computed(() => {
  return (requestData.value.models || []).map((modelOption: any) => {
    const modelId = Number(modelOption?.value ?? modelOption)
    const modelData = allModelsFull.value.find((m: any) => Number(m.id) === modelId)

    return {
      id: modelId,
      name: modelData?.name || modelOption?.name || `ID: ${modelId}`,
      year: modelData?.year,
      img: modelData?.img || carImage.value,
      displacement: modelData?.displ || modelData?.displacement,
      horse_power: modelData?.power,
      geartype: modelData?.gearbox,
      driven_type: modelData?.drive,
      short_scale_type: modelData?.body,
      params: modelData?.params || [],
    }
  })
})

const removeSelectedCar = (carId: number) => {
  requestData.value.models = (requestData.value.models || []).filter(
    (m: any) => Number(m?.value ?? m) !== carId,
  )
}

const clearAllSelectedCars = () => {
  requestData.value.models = []
}

const customModelDisplay = (item: unknown) => {
  if (Array.isArray(item)) {
    const realCount = item.filter((i: any) => {
      const val = String(i?.value ?? i)
      return val !== "__any_model__" && val !== "__any__"
    }).length

    if (realCount === 0) {
      return ""
    }
    return `${t("common.selected")}: ${realCount}`
  }
  return undefined
}

const selectedModelsProxy = computed({
  get: () => {
    const current = (requestData.value.models || []) as OptionBase[]
    const totalReal = filteredModelOptions.value.length - 1

    if (totalReal > 0 && current.length === totalReal) {
      const anyModelOpt = filteredModelOptions.value[0]
      if (!current.some(c => String(c.value) === "__any_model__")) {
        return [anyModelOpt, ...current]
      }
    }
    return current
  },
  set: (newVals: any) => {
    const newList = Array.isArray(newVals) ? newVals : [newVals]
    const oldList = selectedModelsProxy.value
    const hadAny = oldList.some((v: any) => String(v?.value ?? v) === "__any_model__")
    const hasAny = newList.some((v: any) => String(v?.value ?? v) === "__any_model__")
    const realOptions = filteredModelOptions.value.filter(o => String(o.value) !== "__any_model__")
    const realNewList = newList.filter((v: any) => String(v?.value ?? v) !== "__any_model__")

    if (!hadAny && hasAny) {
      requestData.value.models = [...realOptions]
    }
    else if (hadAny && !hasAny) {
      requestData.value.models = []
    }
    else {
      requestData.value.models = realNewList
    }

    errors.value.clear("models")
  },
})

const yearFromOptions = computed<OptionBase[]>(() => {
  const max = yearToSelect.value
  const src = yearPool.value.filter(y => max == null || y <= max)
  return src.map((y, i) => ({ id: i + 1, value: y, name: String(y), disabled: false }))
})

const yearToOptions = computed<OptionBase[]>(() => {
  const min = yearFromSelect.value
  const src = yearPool.value.filter(y => min == null || y >= min)
  return src.map((y, i) => ({ id: i + 1, value: y, name: String(y), disabled: false }))
})

function onYearFromChange(v: unknown) {
  const n = Number((v as any)?.value ?? v)
  yearFromSelect.value = Number.isFinite(n) ? n : undefined
  requestData.value.yearFrom = yearFromSelect.value ?? null
}

function onYearToChange(v: unknown) {
  const n = Number((v as any)?.value ?? v)
  yearToSelect.value = Number.isFinite(n) ? n : undefined
  requestData.value.yearTo = yearToSelect.value ?? null
}

async function buildYearsForSeries(seriesId: number) {
  try {
    const years = await getYearsBySeries(seriesId)
    yearPool.value = [...new Set(years.map(Number).filter(y => Number.isFinite(y)))]
      .sort((a, b) => b - a)
  }
  catch {
    yearPool.value = []
  }
}

function applyCachedSeriesCatalog(seriesId: number): boolean {
  const cached = seriesCatalogCache.get(seriesId)
  if (!cached) {
    return false
  }
  allModelsFull.value = cached.models
  yearPool.value = cached.years
  loadedSeriesId.value = seriesId
  return true
}

function rememberSeriesCatalog(seriesId: number) {
  seriesCatalogCache.set(seriesId, {
    models: [...allModelsFull.value],
    years: [...yearPool.value],
  })
  loadedSeriesId.value = seriesId
}

async function ensureSeriesCatalog(seriesId: number) {
  if (applyCachedSeriesCatalog(seriesId)) {
    return
  }

  await getModelsFullBySeries(seriesId)
  await buildYearsForSeries(seriesId)
  rememberSeriesCatalog(seriesId)
}

const loadSeriesForBrand = async (brandId: number, isInitialLoad = false) => {
  if (!Number.isFinite(brandId) || brandId <= 0) {
    return
  }
  isLoadingSeries.value = true
  try {
    const cached = seriesOptionsCache.get(brandId)
    if (cached?.length) {
      series.value = cached
    }
    else {
      const loaded = await getSeries(brandId)
      series.value = loaded
      seriesOptionsCache.set(brandId, [...loaded])
    }
    if (!isInitialLoad) {
      requestData.value.series = undefined
      requestData.value.models = []
      resetFilters()
      allModelsFull.value = []
      yearFromSelect.value = undefined
      yearToSelect.value = undefined
      yearPool.value = []
      loadedSeriesId.value = null
    }
  }
  catch { /* ignore */ }
  finally {
    isLoadingSeries.value = false
  }
}

const loadedSeriesId = ref<number | null>(null)

async function prefillDefaultBrandAndSeries(brandId?: number | null, seriesId?: number | null) {
  const brandToSet = brandId
    ? sortedBrands.value.find(b => Number(b.value) === brandId)
    : undefined
  const brand = brandToSet ?? sortedBrands.value[0]
  if (!brand) {
    return
  }

  requestData.value.brand = { ...brand }
  await loadSeriesForBrand(Number(brand.value), true)

  const seriesFromId = seriesId
    ? series.value.find(s => Number(s.value) === seriesId)
    : undefined
  const seriesToSet = seriesFromId ?? series.value[0]
  if (!seriesToSet) {
    return
  }

  requestData.value.series = { ...seriesToSet }
  await ensureSeriesCatalog(Number(seriesToSet.value))
}

watch(() => requestData.value.brand, async (brand, oldBrand) => {
  if (suppressWatch.value || !brand?.value || brand.value === oldBrand?.value) {
    return
  }
  await loadSeriesForBrand(Number(brand.value), false)
})

watch(() => requestData.value.series, async (seriesVal, oldSeries) => {
  if (suppressWatch.value || !seriesVal?.value || seriesVal.value === oldSeries?.value) {
    return
  }

  if (oldSeries?.value != null) {
    requestData.value.models = []
    errors.value.clear("models")
  }

  const seriesId = Number(seriesVal.value)
  if (loadedSeriesId.value === seriesId && allModelsFull.value.length > 0) {
    return
  }

  if (applyCachedSeriesCatalog(seriesId)) {
    resetFilters()
    return
  }

  try {
    isInitializing.value = true
    await ensureSeriesCatalog(seriesId)
    resetFilters()
  }
  catch (e) {
    console.error("Error loading models:", e)
  }
  finally {
    isInitializing.value = false
  }
})

watch(
  () => [
    requestData.value.brand?.value,
    requestData.value.series?.value,
    requestData.value.models?.length,
    requestData.value.models?.map(m => m.value).join(","),
    requestData.value.yearFrom,
    requestData.value.yearTo,
    requestData.value.priceTo,
    requestData.value.mileageTo,
    String(requestData.value.originalPaint),
    requestData.value.description,
    ((requestData.value as any).bodyColors || []).map((c: OptionBase) => c.value).join(","),
    filters.engineType,
    filters.engine,
    String(filters.power ?? ""),
    filters.transmission,
    filters.drive,
    filters.bodyType,
  ],
  () => {
    if (suppressWatch.value || isSwitchingVariant.value || isInitializing.value) {
      return
    }
    syncActiveIntoList()
  },
)

onBeforeRouteLeave(async (to, from, next) => {
  if (isDirty.value) {
    draftModalVisible.value = true

    const action = await new Promise<"save" | "leave" | "cancel">((resolve) => {
      draftModalResolve = resolve
    })

    if (action === "save") {
      await submitForm(true)
      next(false)
    }
    else if (action === "leave") {
      isDirty.value = false
      next()
    }
    else {
      next(false)
    }
  }
  else {
    next()
  }
})

onMounted(async () => {
  isInitializing.value = true
  suppressWatch.value = true

  try {
    if (!brands.value.length) {
      brands.value = await getBrands()
    }

    if (isCreate.value) {
      requestData.value.brand = undefined
      requestData.value.series = undefined
      requestData.value.models = []
      allModelsFull.value = []
      resetFilters()
      yearFromSelect.value = undefined
      yearToSelect.value = undefined
      yearPool.value = []
      loadedSeriesId.value = null

      await prefillDefaultBrandAndSeries(prefillBrandId.value, prefillSeriesId.value)

      await nextTick()
      suppressWatch.value = false
      isInitializing.value = false
      syncActiveIntoList()
    }
    else {
      await loadRequestData(numericId.value)
    }
  }
  catch (e) {
    console.error("Error in onMounted:", e)
    suppressWatch.value = false
    isInitializing.value = false
    if (isEdit.value) {
      hasFetchedRequest.value = true
    }
  }
})

const findOption = (options: OptionBase[], source: any, explicitId?: any): OptionBase | undefined => {
  return optionFromEntity(source, options, explicitId)
}

function snapshotActiveVariant(): NeedVariantFormState {
  const current = variants.value[activeIndex.value] ?? createEmptyVariant(1)
  return {
    ...current,
    condition: requestData.value.condition ?? "used",
    brand: requestData.value.brand ? { ...requestData.value.brand } : undefined,
    series: requestData.value.series ? { ...requestData.value.series } : undefined,
    models: Array.isArray(requestData.value.models) ? [...requestData.value.models] : [],
    yearFrom: requestData.value.yearFrom,
    yearTo: requestData.value.yearTo,
    priceTo: requestData.value.priceTo,
    mileageTo: requestData.value.mileageTo,
    bodyColors: (requestData.value as any).bodyColors ? [...(requestData.value as any).bodyColors] : undefined,
    originalPaint: !!requestData.value.originalPaint,
    description: requestData.value.description || "",
    filters: { ...filters },
  }
}

function syncActiveIntoList() {
  const snap = snapshotActiveVariant()
  replaceVariantAt(activeIndex.value, snap)
}

async function applyVariantToForm(variant: NeedVariantFormState) {
  isSwitchingVariant.value = true
  suppressWatch.value = true

  try {
    requestData.value.condition = variant.condition || "used"
    requestData.value.brand = variant.brand ? { ...variant.brand } : undefined
    requestData.value.series = undefined
    requestData.value.models = []
    requestData.value.yearFrom = variant.yearFrom
    requestData.value.yearTo = variant.yearTo
    requestData.value.priceTo = variant.priceTo
    requestData.value.mileageTo = variant.mileageTo
    requestData.value.originalPaint = variant.originalPaint
    requestData.value.description = variant.description || ""
    ;(requestData.value as any).bodyColors = variant.bodyColors ? [...variant.bodyColors] : undefined

    yearFromSelect.value = variant.yearFrom ?? undefined
    yearToSelect.value = variant.yearTo ?? undefined
    mileageSelect.value = variant.mileageTo ?? undefined
    priceSelect.value = variant.priceTo ?? undefined

    Object.assign(filters, {
      engineType: variant.filters?.engineType,
      engine: variant.filters?.engine,
      power: variant.filters?.power,
      transmission: variant.filters?.transmission,
      drive: variant.filters?.drive,
      bodyType: variant.filters?.bodyType,
    })

    allModelsFull.value = []
    yearPool.value = []
    carImage.value = null

    if (variant.brand) {
      await loadSeriesForBrand(Number(variant.brand.value), true)
      if (variant.series) {
        const seriesObj = findOption(series.value, variant.series, variant.series.value)
        if (seriesObj) {
          requestData.value.series = { ...seriesObj }
          await ensureSeriesCatalog(Number(seriesObj.value))
          requestData.value.models = Array.isArray(variant.models) ? [...variant.models] : []

          if (requestData.value.models.length === 1) {
            const modelId = Number(requestData.value.models[0].value)
            const modelData = allModelsFull.value.find(m => Number(m.id) === modelId)
            if (modelData?.img) {
              carImage.value = modelData.img
            }
          }
        }
      }
    }
  }
  finally {
    await nextTick()
    suppressWatch.value = false
    isSwitchingVariant.value = false
  }
}

async function onSelectVariant(index: number) {
  if (index === activeIndex.value) {
    return
  }
  syncActiveIntoList()
  setActive(index)
  await applyVariantToForm(variants.value[index])
}

async function onRemoveVariant(index: number) {
  if (variants.value.length <= 1) {
    return
  }
  syncActiveIntoList()
  removeVariant(index)
  await applyVariantToForm(variants.value[activeIndex.value])
}

async function onMoveVariantUp(index: number) {
  if (index <= 0) {
    return
  }
  syncActiveIntoList()
  moveVariant(index, index - 1)
  await applyVariantToForm(variants.value[activeIndex.value])
}

async function onMoveVariantDown(index: number) {
  if (index >= variants.value.length - 1) {
    return
  }
  syncActiveIntoList()
  moveVariant(index, index + 1)
  await applyVariantToForm(variants.value[activeIndex.value])
}

async function onAddVariant() {
  const newErrors = validateCurrentVariant(false)
  if (Object.keys(newErrors).length > 0) {
    errors.value.record(newErrors)
    return
  }

  syncActiveIntoList()
  addVariant()
  await resetFormForNewVariant()
}

async function resetFormForNewVariant() {
  isSwitchingVariant.value = true
  suppressWatch.value = true
  try {
    requestData.value.brand = undefined
    requestData.value.series = undefined
    requestData.value.models = []
    requestData.value.yearFrom = null
    requestData.value.yearTo = null
    requestData.value.priceTo = null
    requestData.value.mileageTo = null
    requestData.value.originalPaint = false
    requestData.value.description = ""
    ;(requestData.value as any).bodyColors = undefined
    yearFromSelect.value = undefined
    yearToSelect.value = undefined
    mileageSelect.value = undefined
    priceSelect.value = undefined
    resetFilters()
    allModelsFull.value = []
    yearPool.value = []
    carImage.value = null
    series.value = []
    loadedSeriesId.value = null

    await prefillDefaultBrandAndSeries()
  }
  finally {
    await nextTick()
    suppressWatch.value = false
    isSwitchingVariant.value = false
    syncActiveIntoList()
  }
}

function validateCurrentVariant(isDraft: boolean): Record<string, string> {
  const newErrors: Record<string, string> = {}
  if (isDraft) {
    return newErrors
  }

  if (!requestData.value.models?.length) {
    newErrors.models = t("validation.required")
  }

  const mileageOk = requestData.value.mileageTo != null && Number(requestData.value.mileageTo) > 0
  if (!mileageOk) {
    newErrors.mileage_to = t("validation.required")
  }

  const priceOk = requestData.value.priceTo != null && Number(requestData.value.priceTo) > 0
  if (!priceOk) {
    newErrors.price_to = t("validation.required")
  }

  const specs = specRequired.value
  if (specs.engineType && !filters.engineType) {
    newErrors.engine_type = t("validation.required")
  }
  if (specs.engine && !filters.engine) {
    newErrors.engine = t("validation.required")
  }
  if (specs.power && !filters.power) {
    newErrors.power = t("validation.required")
  }
  if (specs.transmission && !filters.transmission) {
    newErrors.transmission = t("validation.required")
  }
  if (specs.drive && !filters.drive) {
    newErrors.drive = t("validation.required")
  }
  if (specs.bodyType && !filters.bodyType) {
    newErrors.body_type = t("validation.required")
  }

  return newErrors
}

async function loadRequestData(id: number) {
  isInitializing.value = true
  suppressWatch.value = true

  try {
    const raw = await show(id)
    if (!raw) {
      return
    }

    const r = raw as any

    requestData.value.status = r.status || RequestStatusNew
    requestData.value.clientName = r.client_name || ""

    if (!brands.value.length) {
      brands.value = await getBrands()
    }

    const apiVariants = Array.isArray(r.variants) && r.variants.length
      ? r.variants
      : [r]

    const loaded: NeedVariantFormState[] = []

    for (let i = 0; i < apiVariants.length; i++) {
      const v = apiVariants[i]
      const variant = createEmptyVariant(v.priority ?? (i + 1))
      variant.id = v.id
      variant.condition = v.condition || "used"
      variant.yearFrom = v.year_from ?? null
      variant.yearTo = v.year_to ?? null
      variant.priceTo = v.price_to ? Number(v.price_to) : null
      variant.mileageTo = v.mileage_to ?? null
      variant.originalPaint = !!v.original_paint
      variant.description = v.description || ""

      if (v.body_colors?.length) {
        const keys = Array.isArray(v.body_colors) ? v.body_colors.map(String) : [String(v.body_colors)]
        const hasAny = keys.includes("__any__")
        variant.bodyColors = hasAny
          ? [ANY_COLOR]
          : keys.map((k: string) =>
              colorOptions.value.find(o => String(o.value) === k)
              ?? { id: 0, value: k, name: k, disabled: false },
            )
      }

      const brandObj = findOption(sortedBrands.value, v.brand, v.brand_id ?? v.brand?.id)
      if (brandObj) {
        variant.brand = { ...brandObj }
        const cachedSeries = seriesOptionsCache.get(Number(brandObj.value))
        const seriesOptions = cachedSeries?.length
          ? cachedSeries
          : await getSeries(Number(brandObj.value))
        if (!cachedSeries?.length) {
          seriesOptionsCache.set(Number(brandObj.value), [...seriesOptions])
        }
        const seriesObj = findOption(seriesOptions, v.series, v.series_id ?? v.series?.id)
        if (seriesObj) {
          variant.series = { ...seriesObj }
          await ensureSeriesCatalog(Number(seriesObj.value))
          const savedModels = v.cars || v.models || []
          const restored: OptionBase[] = []
          for (const item of savedModels) {
            const itemId = (item as any)?.model_id ?? (item as any)?.car_id ?? (item as any)?.id
            if (!itemId) {
              continue
            }
            const modelData = allModelsFull.value.find(m => Number(m.id) === Number(itemId))
            if (modelData) {
              restored.push({
                id: Number(modelData.id),
                value: Number(modelData.id),
                name: modelData.name,
                disabled: false,
              })
            }
          }
          variant.models = restored
        }
      }

      variant.filters = {
        engineType: v.engine_type ? String(v.engine_type) : undefined,
        engine: v.engine ? String(v.engine) : undefined,
        power: v.horse_power ? Number(v.horse_power) : undefined,
        transmission: v.transmission ? String(v.transmission) : undefined,
        drive: v.drive ? String(v.drive) : undefined,
        bodyType: v.body_type ? String(v.body_type) : undefined,
      }

      loaded.push(variant)
    }

    replaceAll(loaded)
    await applyVariantToForm(variants.value[0])
    requestFound.value = true
  }
  catch (e) {
    console.error("Error loading request data:", e)
  }
  finally {
    hasFetchedRequest.value = true
    await nextTick()
    setTimeout(() => {
      suppressWatch.value = false
      isInitializing.value = false
    }, 150)
  }
}

async function submitForm(isDraft = false) {
  const newErrors = validateCurrentVariant(isDraft)
  if (Object.keys(newErrors).length > 0) {
    errors.value.record(newErrors)
    return
  }

  syncActiveIntoList()

  if (!isDraft) {
    for (let i = 0; i < variants.value.length; i++) {
      const v = variants.value[i]
      if (!v.models?.length && !(v.brand || v.series)) {
        errors.value.record({ models: t("validation.required") })
        setActive(i)
        await applyVariantToForm(v)
        return
      }
      if (v.mileageTo == null || Number(v.mileageTo) <= 0 || v.priceTo == null || Number(v.priceTo) <= 0) {
        errors.value.record({
          ...(v.mileageTo == null || Number(v.mileageTo) <= 0 ? { mileage_to: t("validation.required") } : {}),
          ...(v.priceTo == null || Number(v.priceTo) <= 0 ? { price_to: t("validation.required") } : {}),
        })
        setActive(i)
        await applyVariantToForm(v)
        return
      }
    }
  }

  try {
    let reqId: number | undefined
    const statusPayload = isDraft ? "draft" : (isCreate.value ? "new" : undefined)
    const variantsState = variants.value

    if (isCreate.value) {
      reqId = await store(requestData.value as SearchRequestStore, statusPayload, variantsState)
    }
    else {
      const success = await update(numericId.value, requestData.value as SearchRequestUpdate, statusPayload, variantsState)
      if (success) {
        reqId = numericId.value
      }
    }

    if (reqId) {
      isDirty.value = false
      router.push(`/personal/needs/${reqId}`)
    }
  }
  catch (e) {
    console.error(e)
  }
}

function onBodyColorsChange(vals: OptionBase[]) {
  const list = (vals || []).filter(Boolean)
  const hasAny = list.some(v => String(v?.value) === "__any__")
  const cleaned: OptionBase[] = hasAny ? [ANY_COLOR] : list.filter(v => String(v?.value) !== "__any__")
  ;(requestData.value as any).bodyColors = cleaned.slice()
  errors.value.clear("body_colors")
}

function onMileageUpdate(val: unknown) {
  const n = Number((val as any)?.value ?? val)
  if (Number.isFinite(n)) {
    mileageSelect.value = n
    requestData.value.mileageTo = n
    errors.value.clear("mileage_to")
  }
}

function onPriceUpdate(val: unknown) {
  const n = Number((val as any)?.value ?? val)
  if (Number.isFinite(n)) {
    const i = Math.trunc(n)
    priceSelect.value = i
    requestData.value.priceTo = i
    errors.value.clear("price_to")
  }
}

const fullscreen = ref<{ active: boolean }>({ active: false })
function openFullscreen() {
  fullscreen.value.active = true
  document.documentElement.classList.add("overflow-hidden")
}
function closeFullscreen() {
  fullscreen.value.active = false
  document.documentElement.classList.remove("overflow-hidden")
}

const handleEscapeKey = (e: KeyboardEvent) => {
  if (e.key === "Escape") {
    closeFullscreen()
  }
}

onMounted(() => {
  window.addEventListener("keydown", handleEscapeKey)
})

onUnmounted(() => {
  window.removeEventListener("keydown", handleEscapeKey)
})
</script>

<style module>
.header {
  @apply flex items-start justify-between gap-3 mb-5;
}

.container {
  @apply flex flex-col lg:flex-row w-full mb-8 border border-gray-200 rounded-[9px] bg-white shadow-sm;
}

.title {
  @apply text-2xl sm:text-3xl font-bold tracking-tight leading-tight;
}

.leftColumn {
  @apply w-full p-5 sm:p-6;
}

.rightColumn {
  @apply w-full lg:w-1/2 p-5 sm:p-6;
}

.alert {
  @apply mb-4;
}

.formGroup {
  @apply mb-4;
}

.formField {
  @apply w-full;
}

.formRow {
  @apply grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4;
}

.formSubField {
  @apply w-full;
}

.variantBadge {
  @apply mb-4;
}

.complectationHead {
  @apply mb-1.5 flex items-center justify-between gap-3;
}

.complectationLabel {
  @apply text-sm text-gray-900;
}

.rangeRow {
  @apply grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4;
}

.rangeToField {
  @apply w-full;
}

.submitSection {
  @apply mt-5 flex flex-col gap-3;
}

.submitSecondary {
  @apply flex flex-wrap gap-3;
}

.stickyImage {
  @apply sticky top-6 cursor-pointer;
}

.input {
  @apply w-full;
}

.carImage {
  @apply block w-full h-auto cursor-zoom-in rounded-[9px];
}

.iconOverlay {
  @apply absolute right-4 bottom-4 flex items-center justify-center z-20 w-14 h-14 rounded-[9px] bg-black/55 cursor-zoom-in;
}

.fullscreenOverlay {
  @apply fixed inset-0 z-50 flex items-center justify-center bg-black/95;
}

.fullscreenImg {
  @apply max-w-full max-h-full object-contain shadow-2xl;
}

.fullscreenClose {
  @apply absolute top-6 right-6 z-50 bg-black/60 rounded-full p-2 hover:bg-black/80;
}

.fullscreenCloseIcon {
  @apply w-7 h-7 text-white;
}

.titleRow {
  @apply flex gap-4;
}

.resetFilterBtn {
  @apply absolute bottom-[0.38rem] right-8 p-1 text-gray-400 hover:text-red-500 transition;
}
</style>
