<template>
  <div>
    <div class="mb-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
      <DateField
        v-model="filterDate"
        :label="t('listing_request.request_date')"
        range
      />

      <Select
        v-model="filterVisibility"
        :label="t('common.visibility')"
        :options="visibilityOptions"
      />

      <SearchableSelect
        v-if="!isSellerContent"
        :model-value="filterEventItems"
        :options="eventOptionsWithAll"
        :label="t('listing_request.request_text')"
        :multiple="true"
        :return-value-only="false"
        :searchable="false"
        :clearable="true"
        @update:model-value="onEventFilterChange"
      />

      <SearchableSelect
        v-if="!isSellerContent"
        :model-value="filterSearchRequestEventItems"
        :options="searchRequestEventOptionsWithAll"
        :label="t('search_request_events.filter_label')"
        :multiple="true"
        :return-value-only="false"
        :searchable="false"
        :clearable="true"
        @update:model-value="onSearchRequestEventFilterChange"
      />
    </div>

    <div class="mb-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
      <SearchableSelect
        v-if="!isSellerContent"
        :model-value="filterCarLinkEventItems"
        :options="carLinkEventOptionsWithAll"
        :label="t('car_link_events.filter_label')"
        :multiple="true"
        :return-value-only="false"
        :searchable="false"
        :clearable="true"
        @update:model-value="onCarLinkEventFilterChange"
      />

      <SearchableSelect
        v-if="listingSourceEventTypes.length > 0"
        :model-value="filterListingSourceEventItems"
        :options="listingSourceEventOptionsWithAll"
        :label="t('listing_source_events.filter_label')"
        :multiple="true"
        :return-value-only="false"
        :searchable="false"
        :clearable="true"
        @update:model-value="onListingSourceEventFilterChange"
      />

      <Input
        v-model="filterVin"
        label="VIN"
        placeholder="VIN"
      />

      <SearchableSelect
        v-model="filterBrand"
        :label="t('listing_request.brand')"
        :options="brandOptions"
      />

      <SearchableSelect
        v-model="filterSeries"
        :label="t('listing_request.series')"
        :options="seriesOptions"
      />
    </div>

    <div
      v-if="isShowClientFilter || isShowEmployeeFilter || isTeamTable"
      class="mb-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end"
    >
      <SearchableSelect
        v-if="isShowClientFilter"
        v-model="filterClient"
        :label="t('listing_request.client')"
        :options="clientOptions"
      />

      <SearchableSelect
        v-if="isShowEmployeeFilter || isTeamTable"
        v-model="filterEmployee"
        :label="t('listing_request.employee')"
        :options="employeeOptions"
      />
    </div>

    <div class="mb-4 flex gap-2 items-center">
      <CommonButton
        kind="primary"
        @click="applyFilters"
      >
        {{ t('actions.apply') }}
      </CommonButton>
      <CommonButton
        v-if="isFilterApplied"
        kind="white"
        @click="resetFilters"
      >
        {{ t('actions.reset') }}
      </CommonButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia"
import Select from "~/components/form/Select.vue"
import Input from "~/components/form/Input.vue"
import DateField from "~/components/form/Date.vue"
import SearchableSelect from "~/components/form/SearchableSelect.vue"
import type { OptionBase } from "~/types/form/optionType"
import type { ActivityEventsFilter } from "~/types/responses/activityEvent"
import { useApiActivityEvents } from "~/composables/api/useApiActivityEvents"
import { useUserStore } from "~/stores/user"

const props = withDefaults(defineProps<{
  isShowClientFilter?: boolean
  isShowEmployeeFilter?: boolean
  isTeamTable?: boolean
}>(), {
  isShowClientFilter: false,
  isShowEmployeeFilter: false,
  isTeamTable: false,
})

const emit = defineEmits<{
  apply: [filter: ActivityEventsFilter]
}>()

const { t } = useI18n()
const { start, finish } = useLoadingIndicator()
const { getFiltersOptions } = useApiActivityEvents()
const userStore = useUserStore()
const { isSellerContent } = storeToRefs(userStore)

const filterDate = ref<Date[] | null>(null)
const filterVisibility = ref("all")
const filterVin = ref("")
const filterBrand = ref<OptionBase | "">("")
const filterSeries = ref<OptionBase | "">("")
const filterClient = ref<OptionBase | "">("")
const filterEmployee = ref<OptionBase | "">("")
const filterInitiator = ref<OptionBase | "">("")

const ALL_EVENT_VALUE = "__all__"
const makeAllEventOption = (): OptionBase => ({
  id: 0,
  value: ALL_EVENT_VALUE,
  name: t("common.all"),
  disabled: false,
})

const listingRequestTypes = ref<string[]>([])
const carLinkActionTypes = ref<string[]>([])
const searchRequestEventTypes = ref<string[]>([])
const listingSourceEventTypes = ref<string[]>([])
const toNotificationOptions = (types: string[], idOffset: number) => types.map((type, index) => ({
  id: idOffset + index,
  value: type,
  name: t(`user_notifications.types.${type}`),
  disabled: false,
}))

const eventOptionsRaw = computed(() => toNotificationOptions(listingRequestTypes.value, 1))
const carLinkEventOptionsRaw = computed(() => toNotificationOptions(carLinkActionTypes.value, 100))
const searchRequestEventOptionsRaw = computed(() => toNotificationOptions(searchRequestEventTypes.value, 200))
const eventOptionsWithAll = computed(() => [makeAllEventOption(), ...eventOptionsRaw.value])
const carLinkEventOptionsWithAll = computed(() => [makeAllEventOption(), ...carLinkEventOptionsRaw.value])
const searchRequestEventOptionsWithAll = computed(() => [makeAllEventOption(), ...searchRequestEventOptionsRaw.value])
const listingSourceEventOptionsRaw = computed(() => toNotificationOptions(listingSourceEventTypes.value, 300))
const listingSourceEventOptionsWithAll = computed(() => [makeAllEventOption(), ...listingSourceEventOptionsRaw.value])

const filterEventItems = ref<OptionBase[]>([makeAllEventOption()])
const filterCarLinkEventItems = ref<OptionBase[]>([makeAllEventOption()])
const filterSearchRequestEventItems = ref<OptionBase[]>([makeAllEventOption()])
const filterListingSourceEventItems = ref<OptionBase[]>([makeAllEventOption()])
const selectedValues = (items: OptionBase[]) => items
  .filter(option => String(option.value) !== ALL_EVENT_VALUE)
  .map(option => String(option.value))
const selectedEventValues = computed(() => selectedValues(filterEventItems.value))
const selectedCarLinkEventValues = computed(() => selectedValues(filterCarLinkEventItems.value))
const selectedSearchRequestEventValues = computed(() => selectedValues(filterSearchRequestEventItems.value))
const selectedListingSourceEventValues = computed(() => selectedValues(filterListingSourceEventItems.value))

const visibilityOptions = computed(() => [
  { id: 1, value: "all", name: t("common.all"), disabled: false },
  { id: 2, value: "unread", name: t("common.unread"), disabled: false },
  { id: 3, value: "read", name: t("common.read"), disabled: false },
])
const brandOptions = ref<OptionBase[]>([{ id: 0, value: "", name: t("common.all"), disabled: false }])
const seriesOptions = ref<OptionBase[]>([{ id: 0, value: "", name: t("common.all"), disabled: false }])
const clientOptions = ref<OptionBase[]>([{ id: 0, value: "", name: t("common.all"), disabled: false }])
const employeeOptions = ref<OptionBase[]>([{ id: 0, value: "", name: t("common.all"), disabled: false }])
const initiatorOptions = ref<OptionBase[]>([{ id: 0, value: "", name: t("common.all"), disabled: false }])
const isFilterApplied = computed(() =>
  !!filterDate.value
  || selectedEventValues.value.length > 0
  || selectedCarLinkEventValues.value.length > 0
  || selectedSearchRequestEventValues.value.length > 0
  || selectedListingSourceEventValues.value.length > 0
  || !!filterVin.value
  || filterBrand.value !== ""
  || filterSeries.value !== ""
  || filterClient.value !== ""
  || filterEmployee.value !== ""
  || filterInitiator.value !== ""
  || filterVisibility.value !== "all",
)

function onMultiFilterChange(
  next: OptionBase[] | (number | string | OptionBase)[],
  allowed: OptionBase[],
  target: { value: OptionBase[] },
) {
  const nextArray = (Array.isArray(next) ? next : [])
    .map((value) => {
      if (typeof value === "object") {
        return value as OptionBase
      }
      return allowed.find(option => String(option.value) === String(value))
        ?? { id: 0, value: String(value), name: String(value), disabled: false }
    })
    .filter(option => String(option.value) === ALL_EVENT_VALUE
      || allowed.some(item => String(item.value) === String(option.value)))

  const currentHasAll = target.value.some(option => String(option.value) === ALL_EVENT_VALUE)
  const nextHasAll = nextArray.some(option => String(option.value) === ALL_EVENT_VALUE)
  if (nextHasAll && !currentHasAll) {
    target.value = [makeAllEventOption()]
    return
  }
  if (currentHasAll && nextHasAll && nextArray.length > 1) {
    target.value = nextArray.filter(option => String(option.value) !== ALL_EVENT_VALUE)
    return
  }
  target.value = nextArray.length > 0 ? nextArray : [makeAllEventOption()]
}

function onEventFilterChange(next: OptionBase[] | (number | string | OptionBase)[]) {
  onMultiFilterChange(next, eventOptionsRaw.value, filterEventItems)
}

function onCarLinkEventFilterChange(next: OptionBase[] | (number | string | OptionBase)[]) {
  onMultiFilterChange(next, carLinkEventOptionsRaw.value, filterCarLinkEventItems)
}

function onSearchRequestEventFilterChange(next: OptionBase[] | (number | string | OptionBase)[]) {
  onMultiFilterChange(next, searchRequestEventOptionsRaw.value, filterSearchRequestEventItems)
}

function onListingSourceEventFilterChange(next: OptionBase[] | (number | string | OptionBase)[]) {
  onMultiFilterChange(next, listingSourceEventOptionsRaw.value, filterListingSourceEventItems)
}

function addOptionFilter(
  filter: ActivityEventsFilter,
  key: "brand_id" | "series_id" | "client_id" | "user_id" | "initiator_user_id",
  option: OptionBase | "",
) {
  if (option && typeof option === "object" && option.value !== "") {
    filter[key] = option.value
  }
}

function makeFilter(): ActivityEventsFilter {
  const filter: ActivityEventsFilter = { visibility: filterVisibility.value }
  if (filterDate.value?.length === 2) {
    filter.created_at = {
      from: filterDate.value[0].toISOString().split("T")[0],
      to: filterDate.value[1].toISOString().split("T")[0],
    }
  }
  const types = [
    ...selectedEventValues.value,
    ...selectedCarLinkEventValues.value,
    ...selectedSearchRequestEventValues.value,
    ...selectedListingSourceEventValues.value,
  ]
  if (types.length > 0) {
    filter.types = types
  }
  if (filterVin.value) {
    filter.listing_vin = `%${filterVin.value}%`
  }
  addOptionFilter(filter, "brand_id", filterBrand.value)
  addOptionFilter(filter, "series_id", filterSeries.value)
  addOptionFilter(filter, "client_id", filterClient.value)
  addOptionFilter(filter, "user_id", filterEmployee.value)
  addOptionFilter(filter, "initiator_user_id", filterInitiator.value)
  return filter
}

function makeSelectOptions(
  options: Array<{ id: number, name: string, image?: string }>,
  includeCurrentUser = false,
): OptionBase[] {
  const result: OptionBase[] = [{ id: 0, value: "", name: t("common.all"), disabled: false }]
  if (includeCurrentUser && userStore.currentUserId) {
    result.push({
      id: -1,
      value: userStore.currentUserId,
      name: t("listing_request.my_events"),
      disabled: false,
    })
  }
  return result.concat(options.map(option => ({
    id: option.id,
    value: option.id,
    name: option.name,
    disabled: false,
    image: option.image,
  })))
}

async function fetchFilterOptions() {
  start()
  try {
    const response = await getFiltersOptions({ is_team_table: Number(props.isTeamTable) })
    if (!response.data) {
      return
    }
    brandOptions.value = makeSelectOptions(response.data.brands ?? [])
    seriesOptions.value = makeSelectOptions(response.data.series ?? [])
    clientOptions.value = makeSelectOptions(response.data.clients ?? [])
    employeeOptions.value = makeSelectOptions(response.data.employees ?? [], !props.isTeamTable)
    initiatorOptions.value = makeSelectOptions(
      props.isTeamTable ? response.data.employees ?? [] : response.data.initiators ?? [],
    )
    carLinkActionTypes.value = response.data.car_link_action_types ?? []
    listingRequestTypes.value = response.data.listing_request_types ?? []
    searchRequestEventTypes.value = response.data.search_request_event_types ?? []
    listingSourceEventTypes.value = response.data.listing_source_event_types ?? []
  }
  finally {
    finish()
  }
}

function applyFilters() {
  emit("apply", makeFilter())
}

function resetFilters() {
  filterDate.value = null
  filterVisibility.value = "all"
  filterEventItems.value = [makeAllEventOption()]
  filterCarLinkEventItems.value = [makeAllEventOption()]
  filterSearchRequestEventItems.value = [makeAllEventOption()]
  filterListingSourceEventItems.value = [makeAllEventOption()]
  filterVin.value = ""
  filterBrand.value = ""
  filterSeries.value = ""
  filterClient.value = ""
  filterEmployee.value = ""
  filterInitiator.value = ""
  emit("apply", makeFilter())
}

onMounted(() => {
  void fetchFilterOptions()
})
</script>
