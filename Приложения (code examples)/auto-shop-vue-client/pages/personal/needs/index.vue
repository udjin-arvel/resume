<template>
  <div>
    <div
      v-if="!isSeller"
      :class="$style.addNewWrap"
    >
      <NuxtLink
        :to="{ name: 'personal-needs-create' }"
        :class="$style.addNewLink"
      >
        <CommonButton kind="green">
          <PlusIcon class="w-5 h-5 inline-block mr-2" />
          {{ t("needs.add_request") }}
        </CommonButton>
      </NuxtLink>
    </div>

    <div :class="$style.filtersHeader">
      <div :class="$style.filtersActions">
        <div
          v-if="showFilterInput"
          :class="$style.saveFilterContainer"
        >
          <FormInput
            v-model="filterName"
            :placeholder="t('catalog.filter.save_name')"
            :class="$style.filterNameInput"
          />
          <CommonButton
            kind="lightgrey"
            :class="$style.saveBtn"
            :disabled="!filterName || isSaveLoading"
            @click="handleSaveFilters"
          >
            {{ t('common.save') }}
          </CommonButton>
          <CommonButton
            kind="primary"
            :class="$style.closeBtn"
            @click="closeFilterInput"
          >
            <XMarkIcon :class="$style.closeIcon" />
          </CommonButton>
        </div>
        <CommonButton
          v-else
          kind="lightgrey"
          :class="$style.saveBtn"
          @click="showFilterInput = true"
        >
          {{ t('catalog.list.save_filters') }}
        </CommonButton>
        <MenuElips
          kind="lightgrey"
          :menu-action-groups="savedFiltersMenuGroups"
        >
          <template #header>
            <div :class="$style.menuHeader">
              {{ t('catalog.list.saved_filters') }}
            </div>
          </template>
          <template #item="{ item }">
            <div
              v-if="item.template"
              :class="$style.menuItemRow"
            >
              <span :class="$style.menuItemName">{{ item.template.name }}</span>
              <span :class="$style.menuItemRight">{{ formatSavedFilterDate(item.template.timestamp) }}</span>
            </div>
            <span
              v-else
              :class="$style.menuItemName"
            >{{ item.label }}</span>
          </template>
        </MenuElips>
      </div>
    </div>

    <div :class="$style.filtersRow">
      <div :class="$style.filterItem">
        <SearchableSelect
          v-model="filters.id"
          :label="t('columns.requests.number')"
          :options="idOptions"
          :class="$style.select"
          :return-value-only="true"
          :searchable="true"
          :clearable="true"
          :placeholder="t('common.select')"
        />
      </div>

      <div
        v-if="showExecutorFilter"
        :class="$style.filterItem"
      >
        <SearchableSelect
          :model-value="filters.executorItems"
          :label="t('columns.requests.executor')"
          :options="executorOptionsWithAll"
          :class="$style.select"
          :multiple="true"
          :return-value-only="false"
          :searchable="true"
          :clearable="true"
          @update:model-value="onExecutorChange"
        />
      </div>

      <div
        v-if="isSeller"
        :class="$style.filterItem"
      >
        <SearchableSelect
          v-model="filters.buyer"
          :label="t('columns.requests.buyer')"
          :options="buyerOptions"
          :class="$style.select"
          :return-value-only="true"
        />
      </div>

      <div
        v-if="!isSeller"
        :class="$style.filterItem"
      >
        <SearchableSelect
          v-model="filters.client"
          :label="t('columns.requests.client')"
          :options="clientOptions"
          :class="$style.select"
          :return-value-only="true"
        />
      </div>
      <div
        v-if="isAdmin"
        :class="$style.filterItem"
      >
        <SearchableSelect
          v-model="filters.company"
          :label="t('columns.requests.company')"
          :options="companyOptions"
          :class="$style.select"
          :return-value-only="true"
        />
      </div>
      <div
        v-if="showCreatorFilter"
        :class="$style.filterItem"
      >
        <SearchableSelect
          v-model="filters.user"
          :label="t('columns.requests.user_name')"
          :options="userOptions"
          :class="$style.select"
          :return-value-only="true"
        />
      </div>
      <div :class="$style.filterItem">
        <Select
          v-model="filters.sort"
          :label="t('common.sort_by')"
          :options="sortOptions"
          :class="$style.select"
        />
      </div>
      <div :class="$style.filterItem">
        <label :class="$style.filterLabel">{{ t("columns.requests.created_date") }}</label>
        <VueDatePicker
          v-model="dateRange"
          range
          :input-class="$style.input"
          :format="dateFormatComputed"
          :format-locale="localeComputed"
          :class="$style.datepicker"
          :enable-time-picker="false"
          :auto-apply="true"
        />
      </div>
      <div :class="$style.filterItem">
        <SearchableSelect
          :model-value="filters.statusItems"
          :options="statusOptionsWithAll"
          :label="t('columns.requests.status')"
          :class="$style.select"
          :multiple="true"
          :return-value-only="false"
          :searchable="false"
          :clearable="true"
          @update:model-value="onStatusChange"
        />
      </div>

      <div :class="$style.filterItem">
        <SearchableSelect
          :model-value="filters.brandItems"
          :options="brandOptionsWithAll"
          :label="t('columns.requests.brand')"
          :class="$style.select"
          :multiple="true"
          :return-value-only="false"
          :searchable="true"
          :clearable="true"
          @update:model-value="onBrandChange"
        />
      </div>

      <div :class="$style.filterItem">
        <SearchableSelect
          :model-value="filters.seriesItems"
          :options="seriesOptionsWithAll"
          :label="t('columns.requests.series')"
          :class="$style.select"
          :multiple="true"
          :return-value-only="false"
          :searchable="true"
          :clearable="true"
          :disabled="!selectedBrandIds.length"
          @update:model-value="onSeriesChange"
        />
      </div>

      <div :class="$style.onlyMineRowWrap">
        <ClientOnly>
          <div
            v-if="isSeller"
            :class="$style.onlyMineRow"
          >
            <Switch
              v-model="filters.onlyMine"
              :class="$style.onlyMineSwitch"
            />
            <span :class="$style.onlyMineLabel">{{ t('columns.requests.only_mine') }}</span>
          </div>
          <div :class="$style.onlyMineRow">
            <Switch
              v-model="filters.hasUnreadChat"
              :class="$style.onlyMineSwitch"
            />
            <span :class="$style.onlyMineLabel">{{ t('columns.requests.only_unread') }}</span>
          </div>
        </ClientOnly>
      </div>
    </div>

    <div v-if="!isLoadingList && requestsData.length > 0">
      <DataTable :table="table">
        <template #request="{ row }">
          <NuxtLink
            :to="{ name: 'personal-needs-id', params: { id: row.original.id } }"
          >
            <div :class="$style.vehicleCell">
              <div :class="$style.vehicleBrand">
                {{ titleFor(row.original) }}
              </div>
              <div :class="$style.vehicleModel">
                {{ descFor(row.original) }}
              </div>
            </div>
          </NuxtLink>
        </template>

        <template
          v-if="isSeller"
          #buyer="{ row }"
        >
          <span>{{ row.original.user?.name || '-' }}</span>
        </template>

        <template
          v-if="showExecutorFilter"
          #executor="{ row }"
        >
          <span>{{ row.original.executor?.name || '-' }}</span>
        </template>

        <template
          v-if="!isSeller"
          #client="{ row }"
        >
          <span>{{ row.original.client_name || '-' }}</span>
        </template>

        <template
          v-if="isAdmin"
          #company="{ row }"
        >
          <span>{{ row.original.company_name || '-' }}</span>
        </template>

        <template
          v-if="showCreatorFilter"
          #user="{ row }"
        >
          <span>{{ row.original.user_name || '-' }}</span>
        </template>

        <template #status="{ row }">
          <div :class="$style.statusCell">
            <Label
              :text="t(`statuses.request.${row.original.status}`)"
              :kind="RequestStatusColorMap[row.original.status as string]"
            />
            <Label
              v-if="hasUnacknowledgedChanges(row.original)"
              :text="t('statuses.request.updated')"
              :kind="RequestStatusColorMap['updated']"
            />
            <Label
              v-if="row.original.find_more_requested && row.original.status !== RequestStatusOnBooking"
              :text="t('statuses.request.find_more')"
              :kind="RequestStatusColorMap['find_more']"
            />
          </div>
        </template>
        <template
          #actions="{ row }"
        >
          <div class="flex justify-end">
            <MenuElips
              :vertical="false"
              placement="bottom-end"
              kind="unset"
              :menu-action-groups="[
                [
                  {
                    label: t('common.delete'),
                    style: 'red',
                    action: () => deleteRequest(row.original.id),
                    disabled: isDeleteBlocked(row.original.status),
                  },
                ],
              ]"
            >
              <template #item="{ item }">
                <span class="block">{{ item.label }}</span>
                <span
                  v-if="row.original.status === RequestStatusOnBooking"
                  class="mt-1 block text-xs font-normal"
                >{{ t('needs.booking_action_blocked') }}</span>
              </template>
            </MenuElips>
          </div>
        </template>
      </DataTable>
    </div>

    <CommonDataState
      :loading="isLoadingList"
      :has-data="requestsData.length > 0"
      :loading-text="t('common.loading')"
      :empty-text="showFilterEmptyHint ? t('needs.list.filter_empty') : t('needs.list.not_found')"
      :class="$style.dataState"
    />
    <div
      v-if="showFilterEmptyHint"
      :class="$style.filterEmptyActions"
    >
      <CommonButton
        kind="white"
        :class="$style.resetFiltersBtn"
        @click="resetFiltersToDefault"
      >
        {{ t("needs.list.reset_filters") }}
      </CommonButton>
    </div>

    <Pagination
      v-if="pagination.total > pagination.perPage"
      :current-page="pagination.page"
      :total="pagination.total"
      :limit="pagination.perPage"
      :limits="pageSizes"
      :show-limits="false"
      :show-total="false"
      @change-page="onPaginationChange"
    />
    <NeedDeleteModal
      v-model:show="showDeleteModal"
      :submitting="deleteSubmitting"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { PlusIcon, XMarkIcon } from "@heroicons/vue/24/outline"
import VueDatePicker from "@vuepic/vue-datepicker"
import { ru } from "date-fns/locale/ru"
import { zhCN } from "date-fns/locale/zh-CN"
import { computed, h, onMounted, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import { storeToRefs } from "pinia"
import pkg from "lodash"
import { Switch } from "@headlessui/vue"
import { NuxtLink } from "#components"
import CommonButton from "@/components/common/Button.vue"
import CommonDataState from "@/components/common/DataState.vue"
import Label from "@/components/common/Label.vue"
import Pagination from "@/components/common/Pagination.vue"
import SearchableSelect from "@/components/form/SearchableSelect.vue"
import Select from "@/components/form/Select.vue"
import DataTable from "@/components/table/DataTable.vue"
import RequestChatCell from "@/components/needs/RequestChatCell.vue"
import MenuElips from "@/components/common/MenuElips.vue"
import { formatInt, formatDateTime, cleanCountSuffix } from "@/utils/formatters"
import NeedDeleteModal from "@/components/needs/NeedDeleteModal.vue"
import { useApiSearchRequests } from "@/composables/api/useApiSearchRequests"
import useSearchRequest from "@/composables/useSearchRequest"
import { useSearchRequestsRealtime } from "@/composables/useSearchRequestsRealtime"
import useTanstackTable from "@/composables/useTanstackTable"
import type { ExternalColumn } from "@/types/common/tanstackTable"
import type { OptionBase } from "@/types/form/optionType"
import "@vuepic/vue-datepicker/dist/main.css"
import { chinese } from "~/constants/lang"
import type { SearchRequest } from "~/types/responses/searchRequest"
import { RoleEmployee, RoleDirector, RoleAdmin, RoleSellerSearch, RoleSellerClient } from "~/constants/roles"
import { useUserStore } from "@/stores/user"
import useSearchRequestFilter from "@/composables/useSearchRequestFilter"
import type { NeedsFilterState } from "@/types/needs/filter"
import {
  RequestStatusColorMap,
  RequestStatusNew,
  RequestStatusInWork,
  RequestStatusOnBooking,
  RequestStatusCompleted,
  RequestStatusCancelled,
  RequestStatusDraft,
} from "@/constants/statuses"

const { debounce } = pkg
const FILTER_FETCH_DEBOUNCE_MS = 300

interface FilterOptionsResp { clients: OptionBase[], users: OptionBase[], companies?: OptionBase[], brands: OptionBase[], sellers?: OptionBase[] }
interface SeriesResp { series: OptionBase[] }
interface BuyersResp {
  data: OptionBase[]
}

definePageMeta({
  auth: true,
  roles: [RoleEmployee, RoleDirector, RoleAdmin, RoleSellerSearch, RoleSellerClient],
  layout: "personal",
})

const { t, locale } = useI18n()
const { start, finish } = useLoadingIndicator()
const { index, getFilterOptions, getSeriesByBrand, getBuyers, destroy } = useApiSearchRequests()

const userStore = useUserStore()
const { isSellerClient, isSellerSearch, isDirector, isAdmin } = storeToRefs(userStore)

const isSeller = computed(() => isSellerClient.value || isSellerSearch.value)
const showCreatorFilter = computed(() => isDirector.value || isAdmin.value)
const showExecutorFilter = computed(() => isSeller.value || isAdmin.value)

const idOptions = ref<OptionBase[]>([])
const clientOptions = ref<OptionBase[]>([])
const companyOptions = ref<OptionBase[]>([])
const userOptions = ref<OptionBase[]>([])
const buyerOptions = ref<OptionBase[]>([])
const brandOptions = ref<OptionBase[]>([])
const seriesOptions = ref<OptionBase[]>([])
const executorOptions = ref<OptionBase[]>([])

const showDeleteModal = ref(false)
const deleteSubmitting = ref(false)
const requestToDeleteId = ref<number | null>(null)

const brandMap = ref<Record<number, string>>({})
const seriesMap = ref<Record<number, string>>({})

const requestsData = ref<SearchRequest[]>([])
const pagination = ref<any>({ page: 1, perPage: 10, total: 0 })
const isLoadingList = ref(true)

const searchRequestComposable = useSearchRequest()
const hasUnacknowledgedChanges = searchRequestComposable.hasUnacknowledgedChanges

const { locale: currentLocale } = useI18n()
const localeComputed = computed(() => (currentLocale.value === chinese ? zhCN : ru))

const dateFormatComputed = computed(() =>
  currentLocale.value === chinese ? "yyyy/MM/dd" : "dd.MM.yyyy",
)

const pageSizes = [
  { id: 1, value: 10, name: 10, disabled: false },
  { id: 2, value: 20, name: 20, disabled: false },
  { id: 3, value: 50, name: 50, disabled: false },
]

const dateRange = ref<[Date, Date] | null>(null)

const EXECUTOR_NONE = "none"

const sortOptions = computed(() => [
  { id: 1, value: "descending", name: t("common.sort.date_desc"), disabled: false },
  { id: 2, value: "ascending", name: t("common.sort.date_asc"), disabled: false },
])
const ALL_VALUE = "__all__"
const ALL_OPTION: OptionBase = { id: 0, value: ALL_VALUE, name: t("common.all"), disabled: false }
const ALL_ID_OPTION: OptionBase = { id: 0, value: "", name: t("common.all"), disabled: false }
const NO_EXECUTOR_OPTION = computed<OptionBase>(() => ({
  id: -2,
  value: EXECUTOR_NONE,
  name: t("columns.requests.no_executor"),
  disabled: false,
}))

function buildDefaultStatusItems(): OptionBase[] {
  if (isSeller.value) {
    return [
      { id: 1, value: RequestStatusNew, name: t("statuses.request.new"), disabled: false },
      { id: 2, value: RequestStatusInWork, name: t("statuses.request.in_work"), disabled: false },
      { id: 6, value: RequestStatusOnBooking, name: t("statuses.request.on_booking"), disabled: false },
    ]
  }
  return [ALL_OPTION]
}

const filters = ref({
  id: "" as string | number,
  client: "",
  company: "",
  user: "",
  buyer: "",
  statusItems: buildDefaultStatusItems() as OptionBase[],
  executorItems: [ALL_OPTION] as OptionBase[],
  onlyMine: false,
  hasUnreadChat: false,
  brandItems: [ALL_OPTION] as OptionBase[],
  seriesItems: [ALL_OPTION] as OptionBase[],
  sort: "descending",
})

const toNum = (v: unknown) => {
  const n = Number((v as any)?.value ?? v)
  return Number.isFinite(n) ? n : NaN
}

const selectedBrandIds = computed<number[]>(() =>
  (filters.value.brandItems || [])
    .filter(o => String(o.value) !== ALL_VALUE)
    .map(o => toNum(o))
    .filter(Number.isFinite) as number[],
)
const selectedSeriesIds = computed<number[]>(() =>
  (filters.value.seriesItems || [])
    .filter(o => String(o.value) !== ALL_VALUE)
    .map(o => toNum(o))
    .filter(Number.isFinite) as number[],
)
const selectedStatusValues = computed<string[]>(() =>
  (filters.value.statusItems || [])
    .filter(o => String(o.value) !== ALL_VALUE)
    .map(o => String(o.value)),
)

const selectedExecutorValues = computed<Array<number | string>>(() => {
  const values: Array<number | string> = []
  for (const o of filters.value.executorItems || []) {
    const v = o?.value
    if (v === ALL_VALUE || String(v) === ALL_VALUE) {
      continue
    }
    if (v === EXECUTOR_NONE || String(v) === EXECUTOR_NONE) {
      values.push(EXECUTOR_NONE)
      continue
    }
    const n = Number(v)
    if (Number.isFinite(n) && n > 0) {
      values.push(n)
    }
  }
  return values
})

const executorOptionsWithAll = computed<OptionBase[]>(() => [
  ALL_OPTION,
  NO_EXECUTOR_OPTION.value,
  ...(executorOptions.value || []),
])

const brandOptionsWithAll = computed<OptionBase[]>(() => {
  const rest = (brandOptions.value || []).filter(o => String(o.value) !== ALL_VALUE)
  return [ALL_OPTION, ...rest]
})
const seriesOptionsWithAll = computed<OptionBase[]>(() => {
  const rest = (seriesOptions.value || []).filter(o => String(o.value) !== ALL_VALUE)
  return [ALL_OPTION, ...rest]
})

const statusOptionsRaw = computed<OptionBase[]>(() => {
  const options: OptionBase[] = [
    { id: 1, value: RequestStatusNew, name: t("statuses.request.new"), disabled: false },
    { id: 2, value: RequestStatusInWork, name: t("statuses.request.in_work"), disabled: false },
    { id: 6, value: RequestStatusOnBooking, name: t("statuses.request.on_booking"), disabled: false },
    { id: 3, value: RequestStatusCompleted, name: t("statuses.request.completed"), disabled: false },
    { id: 4, value: RequestStatusCancelled, name: t("statuses.request.cancelled"), disabled: false },
  ]
  if (!isSeller.value) {
    options.push({
      id: 5,
      value: RequestStatusDraft,
      name: t("statuses.request.draft"),
      disabled: false,
    })
  }
  return options
})
const statusOptionsWithAll = computed<OptionBase[]>(() => [ALL_OPTION, ...statusOptionsRaw.value])

function toYmd(d: Date) {
  const dd = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
  return dd.toISOString().slice(0, 10)
}

function withAllFirstId(items: OptionBase[]) {
  const rest = items.filter(o => String(o.value) !== "")
  return [ALL_ID_OPTION, ...rest]
}

function onBrandChange(next: OptionBase[] | (number | string | OptionBase)[]) {
  const nextArray = (Array.isArray(next) ? next : [])
    .map(v => (typeof v === "object" ? v as OptionBase : { id: Number(v), value: Number(v), name: String(v), disabled: false } as OptionBase))
    .filter(o => Number.isFinite(toNum(o)) || String(o.value) === ALL_VALUE)

  const currentArray = filters.value.brandItems || []
  const nextHasAll = nextArray.some(v => String(v.value) === ALL_VALUE)
  const currentHasAll = currentArray.some(v => String(v.value) === ALL_VALUE)

  if (nextHasAll && !currentHasAll) {
    filters.value.brandItems = [ALL_OPTION]
    filters.value.seriesItems = [ALL_OPTION]
    seriesOptions.value = []
    return
  }

  if (currentHasAll && nextHasAll && nextArray.length > 1) {
    const withoutAll = nextArray.filter(o => String(o.value) !== ALL_VALUE)
    filters.value.brandItems = withoutAll
    filters.value.seriesItems = [ALL_OPTION]
    seriesOptions.value = []
    return
  }

  if (nextArray.length === 0) {
    filters.value.brandItems = [ALL_OPTION]
    filters.value.seriesItems = [ALL_OPTION]
    seriesOptions.value = []
    return
  }

  filters.value.brandItems = nextArray
  filters.value.seriesItems = [ALL_OPTION]
}

function onSeriesChange(next: OptionBase[] | (number | string | OptionBase)[]) {
  const nextArray = (Array.isArray(next) ? next : [])
    .map(v => (typeof v === "object" ? v as OptionBase : { id: Number(v), value: Number(v), name: String(v), disabled: false } as OptionBase))
    .filter(o => Number.isFinite(toNum(o)) || String(o.value) === ALL_VALUE)

  const currentArray = filters.value.seriesItems || []

  const nextHasAll = nextArray.some(v => String(v.value) === ALL_VALUE)
  const currentHasAll = currentArray.some(v => String(v.value) === ALL_VALUE)

  if (nextHasAll && !currentHasAll) {
    filters.value.seriesItems = [ALL_OPTION]
    return
  }

  if (currentHasAll && nextHasAll && nextArray.length > 1) {
    const withoutAll = nextArray.filter(o => String(o.value) !== ALL_VALUE)
    filters.value.seriesItems = withoutAll
    return
  }

  if (nextArray.length === 0) {
    filters.value.seriesItems = [ALL_OPTION]
    return
  }
  filters.value.seriesItems = nextArray
}

function onStatusChange(next: OptionBase[] | (number | string | OptionBase)[]) {
  const nextArray = (Array.isArray(next) ? next : [])
    .map(v => (typeof v === "object" ? v as OptionBase : { id: 0, value: String(v), name: String(v), disabled: false } as OptionBase))
    .filter(o => String(o.value) === ALL_VALUE || statusOptionsRaw.value.some(s => String(s.value) === String(o.value)))

  const currentArray = filters.value.statusItems || []
  const nextHasAll = nextArray.some(v => String(v.value) === ALL_VALUE)
  const currentHasAll = currentArray.some(v => String(v.value) === ALL_VALUE)

  if (nextHasAll && !currentHasAll) {
    filters.value.statusItems = [ALL_OPTION]
    return
  }

  if (currentHasAll && nextHasAll && nextArray.length > 1) {
    filters.value.statusItems = nextArray.filter(o => String(o.value) !== ALL_VALUE)
    return
  }

  if (nextArray.length === 0) {
    filters.value.statusItems = [ALL_OPTION]
    return
  }

  filters.value.statusItems = nextArray
}

function onExecutorChange(next: OptionBase[] | (number | string | OptionBase)[]) {
  const nextArray = (Array.isArray(next) ? next : [])
    .map((v) => {
      if (typeof v === "object" && v !== null) {
        return v as OptionBase
      }
      if (String(v) === ALL_VALUE) {
        return ALL_OPTION
      }
      if (String(v) === EXECUTOR_NONE) {
        return NO_EXECUTOR_OPTION.value
      }
      return { id: Number(v), value: Number(v), name: String(v), disabled: false } as OptionBase
    })
    .filter((o) => {
      const val = String(o.value)
      if (val === ALL_VALUE || val === EXECUTOR_NONE) {
        return true
      }
      return (executorOptions.value || []).some(s => String(s.value) === val)
    })

  const currentArray = filters.value.executorItems || []
  const nextHasAll = nextArray.some(v => String(v.value) === ALL_VALUE)
  const currentHasAll = currentArray.some(v => String(v.value) === ALL_VALUE)

  if (nextHasAll && !currentHasAll) {
    filters.value.executorItems = [ALL_OPTION]
    return
  }

  if (currentHasAll && nextHasAll && nextArray.length > 1) {
    filters.value.executorItems = nextArray.filter(o => String(o.value) !== ALL_VALUE)
    return
  }

  if (nextArray.length === 0) {
    filters.value.executorItems = [ALL_OPTION]
    return
  }

  filters.value.executorItems = nextArray
}

const route = useRoute()

const {
  filterName,
  showFilterInput,
  savedFilters,
  isLoading: isSaveLoading,
  saveFilter: saveFiltersPreset,
  loadSavedFilter,
  fetchSavedFilters,
  closeFilterInput,
} = useSearchRequestFilter()

const savedFiltersMenuGroups = computed(() => [
  savedFilters.value.map(filter => ({
    label: "",
    template: {
      id: filter.id,
      name: filter.name,
      timestamp: filter.timestamp,
    },
    action: () => loadSavedFilter(filter.id, applySavedFilters),
    disabled: false,
  })),
])

function formatSavedFilterDate(isoDate: string): string {
  if (!isoDate) {
    return ""
  }
  const date = new Date(isoDate)
  return date.toLocaleDateString(locale.value === chinese ? "zh-CN" : "ru-RU")
}

function serializeFilters(): NeedsFilterState {
  return {
    id: filters.value.id,
    client: String(filters.value.client ?? ""),
    company: String(filters.value.company ?? ""),
    user: String(filters.value.user ?? ""),
    buyer: String(filters.value.buyer ?? ""),
    executorIds: [...selectedExecutorValues.value],
    onlyMine: Boolean(filters.value.onlyMine),
    hasUnreadChat: Boolean(filters.value.hasUnreadChat),
    sort: filters.value.sort,
    statusValues: [...selectedStatusValues.value],
    brandIds: [...selectedBrandIds.value],
    seriesIds: [...selectedSeriesIds.value],
    dateFrom: dateRange.value?.[0] ? toYmd(dateRange.value[0]) : undefined,
    dateTo: dateRange.value?.[1] ? toYmd(dateRange.value[1]) : undefined,
  }
}

function resolveSavedExecutorState(saved: NeedsFilterState): { items: OptionBase[], onlyMine: boolean } {
  // Legacy single-select presets
  if (saved.executor === "my_pending") {
    return { items: [NO_EXECUTOR_OPTION.value], onlyMine: true }
  }
  if (saved.executor && saved.executor !== ALL_VALUE && saved.executor !== "") {
    const id = Number(saved.executor)
    if (Number.isFinite(id) && id > 0) {
      const matched = (executorOptions.value || []).find(o => Number(o.value) === id)
      return {
        items: matched
          ? [matched]
          : [{ id, value: id, name: String(id), disabled: false }],
        onlyMine: Boolean(saved.onlyMine),
      }
    }
  }

  const ids = Array.isArray(saved.executorIds) ? saved.executorIds : []
  const items: OptionBase[] = []
  for (const raw of ids) {
    if (raw === EXECUTOR_NONE || String(raw) === EXECUTOR_NONE) {
      items.push(NO_EXECUTOR_OPTION.value)
      continue
    }
    const id = Number(raw)
    if (!Number.isFinite(id) || id <= 0) {
      continue
    }
    const matched = (executorOptions.value || []).find(o => Number(o.value) === id)
    items.push(matched || { id, value: id, name: String(id), disabled: false })
  }

  return {
    items: items.length ? items : [ALL_OPTION],
    onlyMine: Boolean(saved.onlyMine),
  }
}

async function applySavedFilters(saved: NeedsFilterState) {
  filters.value.id = saved.id ?? ""
  filters.value.client = saved.client ?? ""
  filters.value.company = saved.company ?? ""
  filters.value.user = saved.user ?? ""
  filters.value.buyer = saved.buyer ?? ""
  filters.value.hasUnreadChat = Boolean(saved.hasUnreadChat)
  const executorState = resolveSavedExecutorState(saved)
  filters.value.executorItems = executorState.items
  filters.value.onlyMine = isSeller.value ? executorState.onlyMine : false
  filters.value.sort = saved.sort || "descending"

  if (!saved.statusValues?.length) {
    filters.value.statusItems = [ALL_OPTION]
  }
  else {
    const matched = statusOptionsRaw.value.filter(o => saved.statusValues.includes(String(o.value)))
    filters.value.statusItems = matched.length ? matched : buildDefaultStatusItems()
  }

  if (!saved.brandIds?.length) {
    filters.value.brandItems = [ALL_OPTION]
    filters.value.seriesItems = [ALL_OPTION]
    seriesOptions.value = []
  }
  else {
    const matchedBrands = (brandOptions.value || []).filter(b => saved.brandIds.includes(Number(b.value)))
    filters.value.brandItems = matchedBrands.length
      ? matchedBrands
      : saved.brandIds.map(id => ({ id, value: id, name: String(id), disabled: false }))

    if (saved.brandIds.length) {
      try {
        const base = currentFilterBase()
        const tasks = saved.brandIds.map(bid => getSeriesByBrand(bid, { filter: base }))
        const settled = await Promise.allSettled(tasks)
        const combined: OptionBase[] = []
        for (const s of settled) {
          if (s.status === "fulfilled") {
            const part = ((s.value as SeriesResp)?.series) || []
            combined.push(...part.map(o => ({ ...o, id: Number(o.id), value: Number(o.value) })))
          }
        }
        const seen = new Set<number>()
        seriesOptions.value = combined.filter((o) => {
          const v = Number(o.value)
          if (seen.has(v)) {
            return false
          }
          seen.add(v)
          return true
        })
      }
      catch {
        seriesOptions.value = []
      }
    }

    if (!saved.seriesIds?.length) {
      filters.value.seriesItems = [ALL_OPTION]
    }
    else {
      const matchedSeries = (seriesOptions.value || []).filter(s => saved.seriesIds.includes(Number(s.value)))
      filters.value.seriesItems = matchedSeries.length
        ? matchedSeries
        : saved.seriesIds.map(id => ({ id, value: id, name: String(id), disabled: false }))
    }
  }

  if (saved.dateFrom && saved.dateTo) {
    dateRange.value = [new Date(saved.dateFrom), new Date(saved.dateTo)]
  }
  else {
    dateRange.value = null
  }

  await fetchRequests(1, pagination.value.perPage)
}

function handleSaveFilters() {
  saveFiltersPreset(serializeFilters())
}

const showFilterEmptyHint = computed(() => {
  if (isLoadingList.value || requestsData.value.length > 0) {
    return false
  }
  return selectedStatusValues.value.length > 0
})

function resetFiltersToDefault() {
  filters.value.statusItems = buildDefaultStatusItems()
  filters.value.brandItems = [ALL_OPTION]
  filters.value.seriesItems = [ALL_OPTION]
  seriesOptions.value = []
  filters.value.id = ""
  filters.value.client = ""
  filters.value.company = ""
  filters.value.user = ""
  filters.value.buyer = ""
  filters.value.executorItems = [ALL_OPTION]
  filters.value.onlyMine = false
  filters.value.hasUnreadChat = false
  dateRange.value = null
  fetchRequests(1, pagination.value.perPage)
}

function applyStatusFromQuery() {
  const q = route.query
  const raw = q.statuses ?? q.status
  if (!raw) {
    return
  }

  const statusesFromQuery = (Array.isArray(raw) ? raw : [raw]).map(String).filter(Boolean)
  if (!statusesFromQuery.length) {
    return
  }

  const matched = statusOptionsRaw.value.filter(o => statusesFromQuery.includes(String(o.value)))
  if (matched.length) {
    filters.value.statusItems = matched
  }
}

const num = (v: any) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : NaN
}
function getVariantSources(row: any): any[] {
  if (Array.isArray(row?.variants) && row.variants.length) {
    return [...row.variants].sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0))
  }
  return [row]
}

function extractBrandId(row: any): number | null {
  for (const source of getVariantSources(row)) {
    const car = Array.isArray(source?.cars) && source.cars.length ? source.cars[0] : {}
    const id = num(source?.brand?.id ?? source?.brand_id ?? car?.brand_id ?? row?.brand_id)
    if (Number.isFinite(id)) {
      return id
    }
  }
  return null
}
function extractSeriesId(row: any): number | null {
  for (const source of getVariantSources(row)) {
    const car = Array.isArray(source?.cars) && source.cars.length ? source.cars[0] : {}
    const id = num(source?.series?.id ?? source?.series_id ?? car?.series_id ?? row?.series_id)
    if (Number.isFinite(id)) {
      return id
    }
  }
  return null
}

function yearRange(row: any): string {
  const from = row?.year_from, to = row?.year_to
  if (from && to) {
    return `${from}–${to}`
  }
  if (from) {
    return `${from}`
  }
  if (to) {
    return `${to}`
  }
  return ""
}
function titleFor(row: any): string {
  const sources = getVariantSources(row)
  if (sources.length > 1) {
    return sources.map((source, index) => {
      const car = Array.isArray(source?.cars) && source.cars.length ? source.cars[0] : {}
      const bid = num(source?.brand?.id ?? source?.brand_id ?? car?.brand_id)
      const sid = num(source?.series?.id ?? source?.series_id ?? car?.series_id)
      const rawB = Number.isFinite(bid) ? brandMap.value[bid] : (source?.brand?.name || source?.brand || "")
      const rawS = Number.isFinite(sid) ? seriesMap.value[sid] : (source?.series?.name || source?.series || "")
      const b = cleanCountSuffix(String(rawB || ""))
      const s = cleanCountSuffix(String(rawS || ""))
      const yrs = yearRange(source)
      const label = [b, s, yrs].filter(Boolean).join(" ")
      return `P${source.priority ?? index + 1}: ${label}`
    }).join(" · ")
  }

  const bid = extractBrandId(row)
  const sid = extractSeriesId(row)
  const rawB = bid != null ? brandMap.value[bid] : (row?.brand || "")
  const rawS = sid != null ? seriesMap.value[sid] : (row?.series || "")
  const b = cleanCountSuffix(String(rawB || ""))
  const s = cleanCountSuffix(String(rawS || ""))
  const yrs = yearRange(sources[0] || row)
  return [b, s, yrs].filter(Boolean).join(" ")
}
function descFor(row: any): string {
  const sources = getVariantSources(row)
  if (sources.length > 1) {
    return t("needs.form.variants_title") + `: ${sources.length}`
  }
  const source = sources[0] || row
  const powerTypeCode = String(source?.engine_type || "").trim()
  const gearboxCode = String(source?.transmission || "").trim()
  const driveCode = String(source?.drive || "").trim()
  const powerType = powerTypeCode ? (t(`cars.power_type.${powerTypeCode}`) || powerTypeCode) : ""
  const engine = source?.engine ?? ""
  const hp = source?.horse_power
  const hpStr = (hp !== "" && hp != null) ? `${hp} л.с.` : ""
  const gearbox = gearboxCode ? (t(`cars.gearbox.${gearboxCode}`).toLowerCase() || gearboxCode) : ""
  const drive = driveCode ? (t(`cars.drive_type.${driveCode}`).toLowerCase() || driveCode) : ""
  return [powerType, engine, hpStr, gearbox, drive].filter(Boolean).join(", ")
}

function currentFilterBase() {
  const filter: any = {}
  const idTrim = String(filters.value.id ?? "").trim()
  if (idTrim && !Number.isNaN(Number(idTrim))) {
    filter.id = Number(idTrim)
  }

  if (isSeller.value) {
    if (filters.value.buyer) {
      filter.buyer_id = Number(filters.value.buyer)
    }
  }
  else if (!isSeller.value && filters.value.client) {
    filter.client_name = filters.value.client
  }

  if (showExecutorFilter.value) {
    const executorIds = selectedExecutorValues.value
    if (executorIds.length) {
      filter.executor_ids = executorIds
    }
    if (isSeller.value && filters.value.onlyMine) {
      filter.executor_scope = "mine"
    }
  }

  if (isAdmin.value && filters.value.company) {
    filter.client_id = Number(filters.value.company)
  }

  if (isDirector.value && filters.value.user) {
    filter.user_name = filters.value.user
  }

  if (isAdmin.value && filters.value.user) {
    filter.user_id = Number(filters.value.user)
  }

  const statuses = selectedStatusValues.value
  if (statuses.length > 0) {
    filter.statuses = statuses
  }

  if (dateRange.value?.[0]) {
    filter.date_from = toYmd(dateRange.value[0])
  }
  if (dateRange.value?.[1]) {
    filter.date_to = toYmd(dateRange.value[1])
  }
  return filter
}

async function buildSeriesLookupForDataset() {
  const brandsInData = new Set<number>()
  for (const r of requestsData.value) {
    const id = extractBrandId(r)
    if (id != null) {
      brandsInData.add(id)
    }
  }
  const tasks: Promise<any>[] = []
  for (const id of brandsInData) {
    tasks.push(getSeriesByBrand(id).then((res: any) => {
      (res?.series || []).forEach((s: any) => {
        const key = Number(s.value ?? s.id)
        if (Number.isFinite(key)) {
          seriesMap.value[key] = cleanCountSuffix(String(s.name ?? s.label ?? ""))
        }
      })
    }))
  }
  await Promise.allSettled(tasks)
}

async function fetchRequests(page = pagination.value.page, perPage = pagination.value.perPage) {
  isLoadingList.value = true
  start()
  try {
    const offset = (page - 1) * perPage, limit = perPage
    const filter: Record<string, any> = currentFilterBase()
    const b = selectedBrandIds.value, s = selectedSeriesIds.value
    if (Array.isArray(b) && b.length > 1) {
      filter.brand_ids = b
    }
    else if (Array.isArray(b) && b.length === 1) {
      filter.brand_id = b[0]
    }
    if (Array.isArray(s) && s.length > 1) {
      filter.series_ids = s
    }
    else if (Array.isArray(s) && s.length === 1) {
      filter.series_id = s[0]
    }
    if (filters.value.hasUnreadChat) {
      filter.has_unread_chat = 1
    }
    const params: Record<string, any> = { offset, limit }
    if (filters.value.sort) {
      params.sortKey = "created_at"
      params.sortDirection = filters.value.sort
    }
    if (Object.keys(filter).length) {
      params.filter = filter
    }
    const response = await index(params)
    if (response?.data) {
      requestsData.value = response.data
    }
    else {
      requestsData.value = []
    }
    await buildSeriesLookupForDataset()
    const total = response?.meta?.total ?? 0
    pagination.value = { page, perPage, total }
  }
  finally {
    isLoadingList.value = false
    finish()
  }
}

const debouncedFetchRequests = debounce((page = pagination.value.page, perPage = pagination.value.perPage) => {
  fetchRequests(page, perPage)
}, FILTER_FETCH_DEBOUNCE_MS)

watch(() => filters.value.sort, async () => {
  await fetchRequests(1, pagination.value.perPage)
})

function syncBrandItemsAfterOptionsRefresh() {
  const available = new Set((brandOptions.value || []).map(o => String(o.value)))
  const current = filters.value.brandItems || []
  const hasAll = current.some(o => String(o.value) === ALL_VALUE)

  if (hasAll) {
    return
  }

  const next = current.filter(o => available.has(String(o.value)))
  const unchanged = next.length === current.length
    && next.every((o, i) => String(o.value) === String(current[i]?.value))

  if (unchanged) {
    return
  }

  if (!next.length) {
    filters.value.brandItems = [ALL_OPTION]
    filters.value.seriesItems = [ALL_OPTION]
    seriesOptions.value = []
  }
  else {
    filters.value.brandItems = next
    filters.value.seriesItems = [ALL_OPTION]
    seriesOptions.value = []
  }
}

async function refreshFilterOptions() {
  try {
    const resp = await getFilterOptions({ filter: currentFilterBase() }) as FilterOptionsResp

    if (!isSeller.value) {
      clientOptions.value = [{
        id: 0, value: "", name: t("common.all"), disabled: false,
      }, ...((resp?.clients) || [])]
    }

    if (isAdmin.value) {
      companyOptions.value = [{
        id: 0, value: "", name: t("common.all"), disabled: false,
      }, ...((resp?.companies) || [])]
    }

    if (showCreatorFilter.value) {
      userOptions.value = [{
        id: 0, value: "", name: t("common.all"), disabled: false,
      }, ...((resp?.users) || [])]
    }

    if (showExecutorFilter.value) {
      executorOptions.value = ((resp?.sellers) || []).map(o => ({
        ...o,
        id: Number(o.id),
        value: Number(o.value),
      }))
    }

    brandOptions.value = ((resp?.brands) || []).map(o => ({
      ...o, id: Number(o.id), value: Number(o.value),
    }))
    syncBrandItemsAfterOptionsRefresh()
  }
  catch { /* no-op */ }
}

const debouncedRefreshFilterOptions = debounce(refreshFilterOptions, FILTER_FETCH_DEBOUNCE_MS)

watch([() => filters.value.id, () => filters.value.client, () => filters.value.company, () => filters.value.user, () => filters.value.buyer, () => selectedExecutorValues.value, () => filters.value.onlyMine, () => filters.value.hasUnreadChat, () => selectedStatusValues.value, () => dateRange.value], () => {
  debouncedRefreshFilterOptions()
  debouncedFetchRequests(1, pagination.value.perPage)
})

watch(() => filters.value.company, (newVal, oldVal) => {
  if (newVal !== oldVal) {
    filters.value.user = ""
  }
})

const debouncedOnBrandFilterChange = debounce(async (ids: number[]) => {
  filters.value.seriesItems = []
  if (!ids.length) {
    seriesOptions.value = []
    debouncedFetchRequests(1, pagination.value.perPage)
    return
  }
  try {
    const base = currentFilterBase()
    const tasks = ids.map(bid => getSeriesByBrand(bid, { filter: base }))
    const settled = await Promise.allSettled(tasks)
    const combined: OptionBase[] = []
    for (const s of settled) {
      if (s.status === "fulfilled") {
        const part = ((s.value as SeriesResp)?.series) || []
        combined.push(...part.map(o => ({ ...o, id: Number(o.id), value: Number(o.value) })))
      }
    }
    const seen = new Set<number>()
    const uniq: OptionBase[] = []
    for (const o of combined) {
      const v = Number(o.value)
      if (!seen.has(v)) {
        seen.add(v)
        uniq.push(o)
      }
    }
    seriesOptions.value = uniq
  }
  finally {
    debouncedFetchRequests(1, pagination.value.perPage)
  }
}, FILTER_FETCH_DEBOUNCE_MS)

watch(() => selectedBrandIds.value, (ids) => {
  debouncedOnBrandFilterChange(ids)
}, { deep: true })

watch(() => selectedSeriesIds.value, () => {
  debouncedFetchRequests(1, pagination.value.perPage)
}, { deep: true })

function isDeleteBlocked(status: string): boolean {
  return [RequestStatusNew, RequestStatusInWork, RequestStatusOnBooking].includes(status)
}

function deleteRequest(id: number) {
  const request = requestsData.value.find(item => item.id === id)
  if (request && isDeleteBlocked(request.status)) {
    return
  }
  requestToDeleteId.value = id
  showDeleteModal.value = true
}

async function confirmDelete() {
  if (!requestToDeleteId.value) {
    return
  }
  const request = requestsData.value.find(item => item.id === requestToDeleteId.value)
  if (request && isDeleteBlocked(request.status)) {
    showDeleteModal.value = false
    requestToDeleteId.value = null
    return
  }

  deleteSubmitting.value = true
  try {
    await destroy(requestToDeleteId.value)
    showDeleteModal.value = false
    await fetchRequests(pagination.value.page, pagination.value.perPage)
  }
  catch (error: any) {
    console.error("Failed to delete request:", error)
  }
  finally {
    deleteSubmitting.value = false
    requestToDeleteId.value = null
  }
}

useSearchRequestsRealtime(() => {
  fetchRequests(pagination.value.page, pagination.value.perPage)
})

function onPaginationChange({ currentPage, limit }: { currentPage: number, limit: number }) {
  fetchRequests(currentPage, limit)
}

const columns = computed<ExternalColumn<SearchRequest>[]>(() => {
  const baseColumns: ExternalColumn<SearchRequest>[] = [
    {
      header: t("columns.requests.number"),
      accessorKey: "id",
      cell: ({ row }) =>
        h(
          NuxtLink,
          { to: { name: "personal-needs-id", params: { id: row.original.id } }, class: "text-blue-600 hover:underline" },
          () => String(row.original.id).padStart(4, "0"),
        ),
      meta: { headerClass: "px-4 py-3 text-left font-medium", cellClass: "px-4 py-3", style: "width: 80px" },
    },
    { header: t("columns.requests.status"), accessorKey: "status", meta: { headerClass: "px-4 py-3 text-left font-medium", cellClass: "px-4 py-3", style: "120px" } },
    {
      header: t("columns.requests.chat"),
      id: "chat",
      cell: ({ row }) => h(RequestChatCell, {
        requestId: row.original.id,
        chatId: row.original.chat_id ?? null,
        fallback: row.original.chat_unread ?? 0,
        canOpen: row.original.status !== RequestStatusDraft,
      }),
      meta: { headerClass: "px-4 py-3 text-left font-medium", cellClass: "px-4 py-3", style: "80px" },
    },
    {
      header: t("columns.requests.found"),
      accessorKey: "proposals_count",
      cell: ({ row }) => row.original.proposals_count || 0,
      meta: { headerClass: "px-4 py-3 text-left font-medium", cellClass: "px-4 py-3", style: "80px" },
    },
    {
      header: t("columns.requests.diagnostics"),
      accessorKey: "diagnostic_requests_count",
      cell: ({ row }) => row.original.diagnostic_requests_count ?? 0,
      meta: {
        headerClass: "px-4 py-3 text-left font-medium whitespace-nowrap",
        cellClass: "px-4 py-3",
        style: "width: 120px",
      },
    },
    {
      header: t("columns.requests.compensation"),
      accessorKey: "compensation_requests_count",
      cell: ({ row }) => row.original.compensation_requests_count ?? 0,
      meta: {
        headerClass: "px-4 py-3 text-left font-medium whitespace-nowrap",
        cellClass: "px-4 py-3",
        style: "width: 100px",
      },
    },
    { header: t("columns.requests.request"), id: "request", meta: { headerClass: "px-4 py-3 text-left font-medium", cellClass: "px-4 py-3", style: "420px" } },
  ]

  if (isSeller.value) {
    baseColumns.push(
      {
        header: t("columns.requests.buyer"),
        id: "buyer",
        meta: { headerClass: "px-4 py-3 text-left font-medium", cellClass: "px-4 py-3", style: "200px" },
      },
      {
        header: t("columns.requests.executor"),
        id: "executor",
        meta: { headerClass: "px-4 py-3 text-left font-medium", cellClass: "px-4 py-3", style: "200px" },
      },
    )
  }
  else {
    baseColumns.push(
      { header: t("columns.requests.price_to"), accessorKey: "price_to", cell: ({ row }) => formatInt(row.original.price_to, locale.value), meta: { headerClass: "px-4 py-3 text-left font-medium whitespace-pre-line", cellClass: "px-4 py-3", style: "80px" } },
      { header: t("columns.requests.mileage_to"), accessorKey: "mileage_to", cell: ({ row }) => formatInt(row.original.mileage_to), meta: { headerClass: "px-4 py-3 text-left font-medium whitespace-pre-line", cellClass: "px-4 py-3", style: "80px" } },
      { header: t("columns.requests.client"), id: "client", meta: { headerClass: "px-4 py-3 text-left font-medium", cellClass: "px-4 py-3", style: "250px" } },
    )
  }

  if (isAdmin.value) {
    baseColumns.push(
      {
        header: t("columns.requests.executor"),
        id: "executor",
        meta: { headerClass: "px-4 py-3 text-left font-medium", cellClass: "px-4 py-3", style: "200px" },
      },
      {
        header: t("columns.requests.company"),
        id: "company",
        meta: { headerClass: "px-4 py-3 text-left font-medium", cellClass: "px-4 py-3", style: "200px" },
      },
      {
        header: t("columns.requests.user_name"),
        id: "user",
        meta: { headerClass: "px-4 py-3 text-left font-medium", cellClass: "px-4 py-3", style: "200px" },
      },
    )
  }
  else if (isDirector.value) {
    baseColumns.push(
      {
        header: t("columns.requests.user_name"),
        id: "user",
        meta: { headerClass: "px-4 py-3 text-left font-medium", cellClass: "px-4 py-3", style: "200px" },
      },
    )
  }

  baseColumns.push({
    header: t("columns.requests.created_date"),
    accessorKey: "created_date",
    cell: ({ row }) => formatDateTime(row.original.created_at, locale.value),
    meta: { headerClass: "px-4 py-3 text-left font-medium", cellClass: "px-4 py-3", style: "120px" },
  })

  baseColumns.push({
    header: "",
    id: "actions",
    meta: { headerClass: "px-4 py-3", cellClass: "px-4 py-3 text-right", style: "width: 50px" },
  })

  return baseColumns
})

const { table } = useTanstackTable(requestsData, columns)

onMounted(async () => {
  try {
    applyStatusFromQuery()

    if (isSeller.value) {
      const buyersResp = await getBuyers() as BuyersResp
      buyerOptions.value = [
        { id: 0, value: "", name: t("common.all"), disabled: false },
        ...(buyersResp.data || []),
      ]
    }

    const filterOptions = await getFilterOptions() as FilterOptionsResp

    if (!isSeller.value) {
      clientOptions.value = [{ id: 0, value: "", name: t("common.all"), disabled: false }, ...(filterOptions.clients || [])]
    }

    if (isAdmin.value) {
      companyOptions.value = [{ id: 0, value: "", name: t("common.all"), disabled: false }, ...(filterOptions.companies || [])]
    }

    if (showCreatorFilter.value) {
      userOptions.value = [{ id: 0, value: "", name: t("common.all"), disabled: false }, ...(filterOptions.users || [])]
    }

    if (showExecutorFilter.value) {
      executorOptions.value = (filterOptions.sellers || []).map(o => ({
        ...o,
        id: Number(o.id),
        value: Number(o.value),
      }))
    }

    brandOptions.value = (filterOptions.brands || []).map(o => ({ ...o, id: Number(o.id), value: Number(o.value) }))
    ; (brandOptions.value || []).forEach((b: any) => {
      const key = Number(b.value ?? b.id)
      if (Number.isFinite(key)) {
        brandMap.value[key] = cleanCountSuffix(String(b.name ?? b.label ?? ""))
      }
    })

    const allRequestsRes = await index({ limit: -1 })
    const allIdItems = (allRequestsRes?.data || []).map(r => ({
      id: r.id, value: r.id, name: String(r.id).padStart(4, "0"), disabled: false,
    }))
    idOptions.value = withAllFirstId(allIdItems)
  }
  catch (error) {
    console.error("Error loading filter options:", error)
  }
  await fetchRequests(pagination.value.page, pagination.value.perPage)
  await fetchSavedFilters()
})
</script>

<style module>
.addNewWrap {
  @apply my-4 flex items-center;
}

.dataState {
  @apply mt-6;
}

.filterEmptyActions {
  @apply mt-3 flex justify-start;
}

.vehicleCell {
  @apply flex flex-col gap-1;
}

.vehicleBrand {
  @apply font-medium text-gray-900;
}

.vehicleModel {
  @apply text-sm text-gray-600;
}

.filtersRow {
  @apply grid grid-cols-1 gap-4 items-end mb-6;
}

@screen lg {
  .filtersRow {
    grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  }
}

.filterItem {
  @apply w-full;
}

.filterLabel {
  @apply block mb-1 text-sm text-gray-700 font-medium;
}

.input {
  @apply block w-full px-3 py-2 rounded-md border border-gray-300 placeholder-gray-400 focus:outline-none focus:ring-black focus:border-black sm:text-sm disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500;
}

.datepicker {
  @apply w-full;
}

.select {
  @apply w-full;
}

.onlyMineRowWrap {
  @apply col-span-full flex flex-wrap items-center gap-x-6 gap-y-2 pt-1;
}

.onlyMineRow {
  @apply flex items-center gap-3 px-1;
}

.onlyMineLabel {
  @apply text-sm font-medium text-gray-900 whitespace-nowrap;
}

.onlyMineSwitch {
  @apply relative inline-flex h-6 w-11 items-center rounded-full bg-white border border-gray-400 transition-colors flex-shrink-0;
}

.onlyMineSwitch[aria-checked="true"] {
  @apply bg-blue-600 border-blue-600;
}

.onlyMineSwitch::after {
  @apply absolute h-4 w-4 rounded-full bg-gray-400 transition-transform;
  content: '';
  transform: translateX(2px);
}

.onlyMineSwitch[aria-checked="true"]::after {
  @apply bg-white translate-x-6;
}

.filtersHeader {
  @apply flex justify-end mb-4;
}

.filtersActions {
  @apply flex flex-row gap-2 items-center justify-end;
}

.saveFilterContainer {
  @apply flex items-center gap-2;
}

.filterNameInput {
  @apply border border-gray-300 rounded p-2 min-w-[200px];
}

.saveBtn {
  @apply whitespace-nowrap;
}

.closeBtn {
  @apply p-2 h-10 w-10 flex items-center justify-center;
}

.closeIcon {
  @apply w-4 h-4;
}

.menuHeader {
  @apply px-3 py-2 text-sm text-gray-500 font-normal;
}

.menuItemRow {
  @apply flex flex-row items-center justify-between w-full cursor-pointer;
}

.menuItemName {
  @apply text-sm text-black mr-2;
}

.menuItemRight {
  @apply text-xs text-gray-500 whitespace-nowrap;
}

.resetFiltersBtn {
  @apply mt-3;
}

.statusCell {
  @apply flex flex-col items-start gap-1;

  span {
    @apply text-nowrap;
  }
}
</style>
