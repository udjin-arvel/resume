<template>
  <div>
    <div :class="$style.tabsBlock">
      <TabGroup
        v-model="selectedTab"
        as="div"
        @change="handleTabChange"
      >
        <TabList :class="$style.tabList">
          <Tab :class="$style.tab">
            {{ t("logistic.order_list.tabs.in_delivery") }}
          </Tab>
          <Tab :class="$style.tab">
            {{ t("logistic.order_list.tabs.archive") }}
          </Tab>
        </TabList>
      </TabGroup>
    </div>
    <div class="mb-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
      <SearchableSelect
        v-if="!isBuyer"
        :key="`internal-${resetKey}`"
        v-model="filters.internalNumber"
        :options="internalNumberOptions"
        :label="t('logistic.order_list.filters.car_number_label')"
        :placeholder="t('logistic.order_list.filters.car_number_placeholder')"
        :default-to-first-option="false"
      />

      <SearchableSelect
        :key="`vin-${resetKey}`"
        v-model="filters.vin"
        :options="vinOptions"
        :label="t('logistic.order_list.filters.vin_label')"
        :placeholder="t('logistic.order_list.filters.vin_placeholder')"
        :default-to-first-option="false"
      />

      <SearchableSelect
        :key="`status-${resetKey}`"
        :model-value="filters.statusItems"
        :options="statusSelectOptionsWithAll"
        :label="t('logistic.order_list.filters.status_label')"
        :multiple="true"
        :return-value-only="false"
        :searchable="false"
        :clearable="true"
        :disabled="isArchive"
        @update:model-value="onStatusChange"
      />

      <div class="self-end">
        <DateField
          v-model="filters.statusDate"
          :label="t('logistic.order_list.filters.status_date_label')"
          :range="true"
        />
      </div>
    </div>

    <div class="mb-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
      <SearchableSelect
        :key="`brand-${resetKey}`"
        v-model="filters.brand"
        :options="brandOptions"
        :label="t('logistic.order_list.filters.brand_label')"
        :placeholder="t('logistic.order_list.filters.brand_placeholder')"
        :default-to-first-option="false"
      />
      <SearchableSelect
        :key="`model-${resetKey}`"
        v-model="filters.model"
        :options="modelOptions"
        :label="t('logistic.order_list.filters.model_label')"
        :placeholder="t('logistic.order_list.filters.model_placeholder')"
        :default-to-first-option="false"
        :disabled="!filters.brand"
      />
      <SearchableSelect
        :key="`client-${resetKey}`"
        v-model="filters.client"
        :options="clientOptions"
        :label="isBuyer
          ? t('logistic.order_list.filters.client_label_buyer')
          : t('logistic.order_list.filters.client_label_seller')"
        :placeholder="t('logistic.order_list.filters.client_placeholder')"
        :default-to-first-option="false"
      />
      <SearchableSelect
        v-if="isDirector"
        :key="`buyer-${resetKey}`"
        v-model="filters.buyer"
        :options="buyerManagerOptions"
        :label="t('logistic.order_list.filters.buyer_label')"
        :placeholder="t('logistic.order_list.filters.buyer_placeholder')"
        :default-to-first-option="false"
      />
      <Select
        v-model="filters.seaport"
        :options="seaportOptions"
        :label="t('logistic.order_list.filters.seaport_label')"
        :disabled="isArchive"
      />
      <SearchableSelect
        v-if="!isBuyer"
        :key="`logist-${resetKey}`"
        v-model="filters.logist"
        :options="logistFilterOptions"
        :label="t('logistic.order_list.filters.logist_label')"
        :placeholder="t('logistic.order_list.filters.logist_placeholder')"
        :default-to-first-option="false"
      />
    </div>

    <div class="mb-4 flex gap-2 items-center">
      <CommonButton
        kind="primary"
        @click="applyFilters"
      >
        {{ t("logistic.order_list.filters.apply") }}
      </CommonButton>
      <CommonButton
        v-if="isFilterApplied"
        kind="white"
        @click="resetFilters"
      >
        {{ t("logistic.order_list.filters.reset") }}
      </CommonButton>
    </div>
    <div v-if="!isLoading && data.length > 0">
      <DataTable
        :table="table"
        :row-class-fn="rowClassFn"
      >
        <template #car="{ value, row }">
          <NuxtLink
            :to="{ name: 'personal-logistic-tracking-id', params: { id: row.original.id } }"
            class="text-black hover:text-blue-600 underline"
          >
            {{ String(value) }}
          </NuxtLink>
        </template>

        <template #statusDate="slot">
          {{ slot.value ? formatDateTime(slot.value as Row['statusDate'], "DD.MM.YYYY HH:mm") : "" }}
        </template>

        <template #status="{ value, row }">
          <Label
            :text="t(`order_status.default.${value}`)"
            :kind="statusToLabelKind(String(value))"
            size="md"
            class="!text-base"
            :badge="getUnreadForOrder(row.original.id) || undefined"
          />
        </template>

        <template #actions="{ row }">
          <div class="px-4 py-3 flex items-center justify-center gap-2">
            <TeleportMenuElips
              v-if="!isBuyer"
              :menu-action-groups="menuGroupsFor(row.original)"
              kind="unset"
            />
            <template v-else-if="hasBuyerAction(row.original.status)">
              <TagIcon
                class="w-5 h-5 text-gray-500"
                aria-hidden="true"
              />
              <CommonButton
                kind="primaryOutline"
                @click="handleAddStatus(row.original.id, row.original.status)"
              >
                {{ t(buyerActionLabelKey(row.original.status)) }}
              </CommonButton>
            </template>
          </div>
        </template>

        <template #chat="{ row }">
          <div class="px-4 py-3 text-center">
            <ToChat
              type="listing"
              :listing-id="row.original.listingId || undefined"
              :buyer-id="row.original.buyerId || undefined"
              :disabled="!row.original.listingId || !row.original.buyerId"
            >
              <template #default="{ chatLoading, clickDisabled, goToChat }">
                <button
                  type="button"
                  class="inline-flex items-center justify-center text-black hover:text-blue-600 disabled:opacity-50"
                  :aria-label="t('logistic.order_list.actions.open_chat_aria')"
                  :aria-busy="chatLoading || undefined"
                  :disabled="clickDisabled || !row.original.listingId || !row.original.buyerId"
                  @click="goToChat"
                >
                  <ChatBubbleLeftEllipsisIcon class="w-5 h-5" />
                </button>
              </template>
            </ToChat>
          </div>
        </template>
      </DataTable>
    </div>
    <CommonDataState
      :loading="isLoading"
      :has-data="data.length > 0"
      :loading-text="t('common.loading')"
      :empty-text="t('common.no_results')"
      :class="$style.dataState"
    />
    <Pagination
      v-if="total > limit"
      :current-page="page"
      :total="total"
      :limit="limit"
      :limits="pageSizes"
      @change-page="onPaginationChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue"
import { useRouter } from "vue-router"
import { storeToRefs } from "pinia"
import { useI18n } from "vue-i18n"
import { ChatBubbleLeftEllipsisIcon } from "@heroicons/vue/24/outline"
import { TagIcon } from "@heroicons/vue/24/solid"
import { TabGroup, TabList, Tab } from "@headlessui/vue"
import { useThrottleFn } from "@vueuse/core"
import type { Row as TableRow } from "@tanstack/vue-table"
import { NuxtLink } from "#components"

import DataTable from "@/components/table/DataTable.vue"
import useTanstackTable from "@/composables/useTanstackTable"
import type { ExternalColumn } from "@/types/common/tanstackTable"

import Label from "@/components/common/Label.vue"
import SearchableSelect from "@/components/form/SearchableSelect.vue"
import Select from "@/components/form/Select.vue"
import DateField from "@/components/form/Date.vue"
import CommonButton from "@/components/common/Button.vue"
import TeleportMenuElips from "@/components/common/TeleportMenuElips.vue"
import Pagination from "@/components/common/Pagination.vue"
import { useDate } from "@/composables/useDate"
import type { OrderListRequest } from "@/types/requests/logisticOrder"
import { useLogisticOrderRealtime } from "@/composables/useLogisticOrderRealtime"

import { useUserStore } from "@/stores/user"
import type { MenuActions } from "@/types/common/menuActions"

import { useOrder } from "@/composables/useOrder"
import type { LogisticOrderListItemData, LogisticOrderStatus } from "~/types/common/logisticOrder"
import { LogisticOrderStatuses } from "~/constants/orderStatuses"
import type { OptionBase } from "@/types/form/optionType"
import { RoleAdmin, RoleDirector, RoleEmployee, RoleLogistic, RoleSellerClient } from "~/constants/roles"
import usePorts from "@/composables/usePorts"
import ToChat from "@/components/chat/ToChat.vue"
import { useUnreadCountStore } from "@/stores/unreadCount"

definePageMeta({
  layout: "personal",
  auth: true,
  roles: [RoleDirector, RoleAdmin, RoleEmployee, RoleLogistic, RoleSellerClient],
})

const { t } = useI18n()
const router = useRouter()
const resetKey = ref(0)

const unreadStore = useUnreadCountStore()
const { counts } = storeToRefs(unreadStore)

const userStore = useUserStore()
const { isBuyer, isDirector } = storeToRefs(userStore)

const selectedTab = ref(0)
const isArchive = computed(() => selectedTab.value === 1)
const { formatDateTime } = useDate()
const { portOptions, reload: reloadPorts } = usePorts()

async function handleTabChange(index: number) {
  selectedTab.value = index
  await resetFilters()
}

const getUnreadForOrder = (orderId: number) => {
  if (isArchive.value) {
    return counts.value.logisticOrders.archive?.[orderId] || 0
  }
  return counts.value.logisticOrders.active?.[orderId] || 0
}

type Row = {
  id: number
  car: string
  client: string
  buyer?: string
  statusDate: string | null
  status: string
  internalNumber: string
  vin: string
  brand: string
  model: string
  listingId: number | null
  buyerId: number | null
}

const filters = ref({
  internalNumber: undefined as OptionBase | undefined,
  vin: undefined as OptionBase | undefined,
  statusItems: [] as OptionBase[],
  seaport: "" as string,
  statusDate: null as Date[] | null,
  brand: undefined as OptionBase | undefined,
  model: undefined as OptionBase | undefined,
  client: undefined as OptionBase | undefined,
  logist: undefined as OptionBase | undefined,
  buyer: undefined as OptionBase | undefined,
})

const {
  items: orders,
  meta,
  fetchOrders,
  page,
  limit,
  total,
  first,
  isLoading,
} = useOrder()

const pageSizes = [
  { id: 1, value: 10, name: 10, disabled: false },
  { id: 2, value: 20, name: 20, disabled: false },
  { id: 3, value: 50, name: 50, disabled: false },
]

function splitMakeModel(full: string): { brand: string, model: string } {
  const parts = full.trim().split(" ")
  const brand = parts[0] ?? ""
  const model = parts.slice(1).join(" ") || ""
  return { brand, model }
}

const data = computed<Row[]>(() =>
  orders.value.map((order: LogisticOrderListItemData) => {
    const listing = order.listing
    const name = listing?.name ?? ""
    const { brand, model } = splitMakeModel(name)
    let buyerValue = ""
    if (isDirector.value) {
      buyerValue = order.creator?.name || ""
    }

    return {
      id: order.id,
      car: name,
      client: isBuyer.value
        ? (listing?.seller?.name ?? "")
        : (order.creator?.name ?? ""),
      buyer: buyerValue,
      statusDate: order.statusChangedAt ?? null,
      status: order.status,
      internalNumber: listing?.internal_number ?? "",
      vin: listing?.vin ?? "",
      brand,
      model,
      listingId: listing?.id ?? null,
      buyerId: order.creator?.id ?? null,
    }
  }),
)

const internalNumberOptions = computed(() => {
  const filters = meta.value?.filters as any
  const numbers = filters?.internalNumbers ?? filters?.internal_numbers ?? []

  return numbers.map((item: string) => ({
    id: item,
    value: item,
    name: item,
    disabled: false,
  }))
})

const vinOptions = computed(() => {
  const filters = meta.value?.filters as any
  const vins = filters?.vins ?? []

  return vins.map((item: string | number) => ({
    id: String(item),
    value: String(item),
    name: String(item),
    disabled: false,
  }))
})

const brandOptions = computed(() => {
  const brands = meta.value?.filters?.brands ?? []
  return brands.map(item => ({
    id: item.id,
    value: item.id,
    name: item.name,
    disabled: false,
    image: item.image,
  }))
})

const modelOptions = computed(() => {
  const selectedBrandId = filters.value.brand?.value

  if (!selectedBrandId) {
    return []
  }

  const models = meta.value?.filters?.models ?? []

  return models
    .filter((item: any) => item.brandId === selectedBrandId)
    .map((item: any) => ({
      id: item.id,
      value: item.id,
      name: item.name,
      disabled: false,
    }))
})

watch(
  () => filters.value.brand,
  (newBrand, oldBrand) => {
    if (newBrand?.value !== oldBrand?.value) {
      filters.value.model = undefined
    }
  },
)

const clientOptions = computed(() => {
  const filtersMeta = meta.value?.filters
  if (!filtersMeta) {
    return []
  }

  const source = isBuyer.value ? filtersMeta.sellers : filtersMeta.buyers

  return source.map(item => ({
    id: item.id,
    value: item.id,
    name: item.name,
    disabled: false,
  }))
})

const buyerManagerOptions = computed(() => {
  const buyers = meta.value?.filters?.buyers ?? []
  return buyers.map(item => ({
    id: item.id,
    value: item.id,
    name: item.name,
    disabled: false,
  }))
})

const logistFilterOptions = computed(() => {
  const logists = meta.value?.filters?.logists ?? []
  const options = logists.map((item: any) => ({
    id: item.id,
    value: item.id,
    name: item.name,
    disabled: false,
  }))

  return [
    {
      id: "all",
      value: "all",
      name: t("common.all"),
      disabled: false,
    },
    {
      id: "unassigned",
      value: "unassigned",
      name: t("logistic.order_list.filters.without_logist"),
      disabled: false,
    },
    ...options,
  ]
})

const allowedStatuses = Object.values(LogisticOrderStatuses)

const ALL_STATUS_VALUE = "__all__"
const makeAllStatusOption = (): OptionBase => ({
  id: 0,
  value: ALL_STATUS_VALUE,
  name: t("common.all"),
  disabled: false,
})

filters.value.statusItems = [makeAllStatusOption()]

const statusOptionsRaw = computed(() =>
  allowedStatuses.map((value, index) => ({
    id: index + 1,
    value,
    name: t(`order_status.default.${value}`),
    disabled: false,
  })),
)

const statusSelectOptionsWithAll = computed(() => [
  makeAllStatusOption(),
  ...statusOptionsRaw.value,
])

const selectedStatusValues = computed(() =>
  (filters.value.statusItems || [])
    .filter(o => String(o.value) !== ALL_STATUS_VALUE)
    .map(o => String(o.value)),
)

function onStatusChange(next: OptionBase[] | (number | string | OptionBase)[]) {
  const nextArray = (Array.isArray(next) ? next : [])
    .map(v => (typeof v === "object" ? v as OptionBase : statusOptionsRaw.value.find(o => String(o.value) === String(v)) || { id: 0, value: String(v), name: String(v), disabled: false }))
    .filter(o => String(o.value) === ALL_STATUS_VALUE || statusOptionsRaw.value.some(s => String(s.value) === String(o.value)))

  const currentArray = filters.value.statusItems || []
  const nextHasAll = nextArray.some(v => String(v.value) === ALL_STATUS_VALUE)
  const currentHasAll = currentArray.some(v => String(v.value) === ALL_STATUS_VALUE)

  if (nextHasAll && !currentHasAll) {
    filters.value.statusItems = [makeAllStatusOption()]
    return
  }

  if (currentHasAll && nextHasAll && nextArray.length > 1) {
    filters.value.statusItems = nextArray.filter(o => String(o.value) !== ALL_STATUS_VALUE)
    return
  }

  if (nextArray.length === 0) {
    filters.value.statusItems = [makeAllStatusOption()]
    return
  }

  filters.value.statusItems = nextArray
}

const seaportOptions = computed<OptionBase[]>(() => [
  { id: 0, value: "", name: t("common.all"), disabled: false },
  ...portOptions.value,
])

const isFilterApplied = computed(() => {
  const f = filters.value

  const hasDateRange
      = Array.isArray(f.statusDate)
        && !!(f.statusDate[0] || f.statusDate[1])

  return Boolean(
    f.internalNumber
    || f.vin
    || selectedStatusValues.value.length > 0
    || f.seaport
    || hasDateRange
    || f.brand
    || f.model
    || f.client
    || f.buyer
    || f.logist,
  )
})

function formatDateForApi(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function buildFilterParams(): Partial<OrderListRequest> {
  const f = filters.value
  const params: Record<string, unknown> = {}

  if (f.internalNumber?.value) {
    params.internalNumber = f.internalNumber.value
  }

  if (f.vin?.value) {
    params.vin = f.vin.value
  }

  const statuses = selectedStatusValues.value
  if (statuses.length === 1) {
    params.status = statuses[0] as LogisticOrderStatus
  }
  else if (statuses.length > 1) {
    params.status = statuses as LogisticOrderStatus[]
  }

  if (f.seaport) {
    params.seaport = f.seaport
  }

  if (Array.isArray(f.statusDate)) {
    const [from, to] = f.statusDate
    if (from) {
      params.statusDateFrom = formatDateForApi(from)
    }
    if (to) {
      params.statusDateTo = formatDateForApi(to)
    }
  }

  if (f.brand?.value) {
    params.brandId = f.brand.value
  }

  if (f.model?.value) {
    params.modelId = f.model.value
  }

  if (f.client?.value) {
    params.clientId = f.client.value
  }

  if (f.buyer?.value) {
    params.buyerId = f.buyer.value
  }

  if (f.logist) {
    if (f.logist.value === "unassigned") {
      params.logistId = null
    }
    else {
      params.logistId = f.logist.value
    }
  }

  if (selectedTab.value === 1) {
    params.archive = 1
  }

  return params
}

const columns = computed<ExternalColumn<Row>[]>(() => [
  {
    header: t("logistic.order_list.table.car_header"),
    accessorKey: "car",
    meta: {
      headerClass: "px-4 py-3 text-left font-medium",
      cellClassFn: () => "px-4 py-3",
      style: "width: 200px; min-width: 200px; max-width: 200px;",
    },
  },
  {
    header: "VIN",
    accessorKey: "vin",
    meta: {
      headerClass: "px-4 py-3 text-left font-medium",
      cellClassFn: () => "px-4 py-3 text-sm font-mono text-gray-700",
      style: "width: 180px; min-width: 180px; max-width: 180px;",
    },
  },
  {
    header: isBuyer.value
      ? t("logistic.order_list.table.client_header_buyer")
      : t("logistic.order_list.table.client_header_seller"),
    accessorKey: "client",
    meta: {
      headerClass: "px-4 py-3 text-left font-medium",
      cellClassFn: () => "px-4 py-3",
      style: "width: 150px; min-width: 150px; max-width: 150px;",
    },
  },
  ...(isDirector.value
    ? [{
        header: t("logistic.order_list.table.buyer_header"),
        accessorKey: "buyer",
        meta: {
          headerClass: "px-4 py-3 text-left font-medium",
          cellClassFn: () => "px-4 py-3",
          style: "width: 150px; min-width: 150px; max-width: 150px;",
        },
      }]
    : [

      ]),
  {
    header: t("logistic.order_list.table.status_date_header"),
    accessorKey: "statusDate",
    meta: {
      headerClass: "px-4 py-3 text-left font-medium",
      cellClassFn: () => "px-4 py-3",
      style: "width: 160px; min-width: 160px; max-width: 160px;",
    },
  },
  {
    header: t("logistic.order_list.table.status_header"),
    accessorKey: "status",
    meta: {
      headerClass: "px-4 py-3 text-left font-medium",
      cellClassFn: () => "px-4 py-3",
      style: "width: 220px; min-width: 220px; max-width: 220px;",
    },
  },
  {
    header: "",
    id: "actions",
    meta: {
      headerClass: "px-4 py-3 text-center",
      cellClassFn: () => "px-4 py-3 text-center",
      style: isBuyer.value
        ? "width: 220px; min-width: 220px; max-width: 220px;"
        : "width: 30px; min-width: 30px; max-width: 30px;",
    },
  },
  {
    header: t("logistic.order_list.table.chat_header"),
    id: "chat",
    meta: {
      headerClass: "px-4 py-3 text-center",
      cellClassFn: () => "px-4 py-3 text-center",
      style: "width: 50px; min-width: 50px; max-width: 50px;",
    },
  },
])

const { table } = useTanstackTable<Row>(data, columns)

const buyerStatuses: LogisticOrderStatus[] = [
  LogisticOrderStatuses.AwaitingBuyerData,
  LogisticOrderStatuses.AddedBuyerData,
  LogisticOrderStatuses.InvoiceIssued,
  LogisticOrderStatuses.PreparedForRuDispatch,
]

function statusToLabelKind(status: string): "violet" | "gray" {
  const s = status as LogisticOrderStatus
  if (isBuyer.value && buyerStatuses.includes(s)) {
    return "violet"
  }
  return "gray"
}

function rowClassFn(row: TableRow<Row>): string {
  return row.original.status === LogisticOrderStatuses.Incident
    ? "!bg-red-50 hover:!bg-red-100"
    : ""
}

const buyerActionNextStatus: Partial<Record<LogisticOrderStatus, LogisticOrderStatus>> = {
  [LogisticOrderStatuses.AwaitingBuyerData]: LogisticOrderStatuses.AddedBuyerData,
  [LogisticOrderStatuses.AddedBuyerData]: LogisticOrderStatuses.InvoiceIssued,
  [LogisticOrderStatuses.InvoiceIssued]: LogisticOrderStatuses.PaymentDocsUploaded,
  [LogisticOrderStatuses.PreparedForRuDispatch]: LogisticOrderStatuses.AttachDispatchData,
}

function hasBuyerAction(status: string): boolean {
  const s = status as LogisticOrderStatus
  return Boolean(buyerActionNextStatus[s])
}

function buyerActionLabelKey(status: string): string {
  const s = status as LogisticOrderStatus
  const next = buyerActionNextStatus[s]
  if (!next) {
    return ""
  }
  return `order_status.actions.${next}`
}

async function applyFilters() {
  first()
  await fetchOrders(buildFilterParams())
}

async function resetFilters() {
  filters.value = {
    internalNumber: undefined,
    vin: undefined,
    statusItems: [makeAllStatusOption()],
    seaport: "",
    statusDate: null,
    brand: undefined,
    model: undefined,
    client: undefined,
    buyer: undefined,
    logist: undefined,
  }
  resetKey.value++
  first()
  await fetchOrders(buildFilterParams())
}

async function onPaginationChange({ currentPage, limit: newLimit }: { currentPage: number, limit: number }) {
  page.value = currentPage
  limit.value = newLimit
  await fetchOrders(buildFilterParams())
}

function menuGroupsFor(row: Row): MenuActions[][] {
  const actions: MenuActions[] = []
  const { listingId } = row

  if (listingId) {
    actions.push({
      label: t("logistic.order_list.actions.open_in_catalog"),
      action: () => handleOpenInCatalog(listingId),
    })
  }

  if (!buyerStatuses.includes(row.status as LogisticOrderStatus)) {
    actions.push({
      label: t("logistic.order_list.actions.add_status"),
      action: () => handleAddStatus(row.id),
    })
  }

  return [actions]
}

function handleOpenInCatalog(listingId: number) {
  router.push({
    name: "personal-listings-id",
    params: { id: listingId },
  })
}

function handleAddStatus(id: number, status?: string) {
  if (!isBuyer.value || !status) {
    router.push({
      name: "personal-logistic-tracking-id-status-status",
      params: { id, status: 0 },
    })
    return
  }

  const current = status as LogisticOrderStatus
  const next = buyerActionNextStatus[current]

  if (!next) {
    router.push({
      name: "personal-logistic-tracking-id",
      params: { id },
    })
    return
  }

  if (next === LogisticOrderStatuses.AddedBuyerData) {
    router.push({ path: `/personal/logistic/${id}/buyer` })
    return
  }

  if (next === LogisticOrderStatuses.InvoiceIssued) {
    router.push({ path: `/personal/logistic/${id}/invoice` })
    return
  }

  if (next === LogisticOrderStatuses.PaymentDocsUploaded) {
    router.push({ path: `/personal/logistic/${id}/payment` })
    return
  }

  if (next === LogisticOrderStatuses.AttachDispatchData) {
    router.push({
      name: "personal-logistic-tracking-id-status-status",
      params: { id, status: 0 },
    })
    return
  }

  router.push({
    name: "personal-logistic-tracking-id",
    params: { id },
  })
}

const throttledFetchOrders = useThrottleFn(() => {
  fetchOrders(buildFilterParams())
}, 7000)

useLogisticOrderRealtime(() => {
  throttledFetchOrders()
})

onMounted(() => {
  reloadPorts()
  fetchOrders(buildFilterParams())
})
</script>

<style module>
.dataState {
  @apply mt-6;
}

.tabsBlock {
  @apply mb-6;
}

.tabList {
  @apply inline-flex gap-1 border-b border-gray-200;
}

.tab {
  @apply relative inline-flex items-center justify-center px-6 py-2 text-sm font-medium text-gray-600 transition-colors duration-150 cursor-pointer whitespace-nowrap focus:outline-none;
}

.tab[data-headlessui-state~='selected'] {
  @apply text-black font-semibold bg-transparent;
}

.tab[data-headlessui-state~='selected']::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 50%;
  height: 2px;
  width: 100%;
  background-color: black;
  transform: translateX(-50%);
}

.tab[data-headlessui-state~='unselected'] {
  @apply text-gray-500 hover:text-black;
}
</style>
