<template>
  <div :class="$style.page">
    <div :class="$style.heroCard">
      <div :class="$style.heroRow">
        <div :class="$style.heroInfo">
          <h1 :class="$style.title">
            {{ balance.clientName.value || t('common.loading') }}
          </h1>
          <div :class="$style.metaGrid">
            <div :class="$style.metaItem">
              <span :class="$style.metaLabel">
                {{ accountType === 'deposit' ? t('balance.list.column_deposit') : t('balance.list.column_balance') }}
              </span>
              <span :class="$style.metaValue">
                {{ formatBalance(accountType === 'deposit' ? balance.clientDeposit.value : balance.clientBalance.value) }}
              </span>
            </div>
          </div>
        </div>
        <CommonButton
          v-if="!hideEdit"
          kind="white"
          :class="$style.actionBtn"
          @click="onEditClick"
        >
          {{ accountType === 'deposit' ? t('balance.history.change_deposit') : t('balance.history.change_balance') }}
        </CommonButton>
      </div>
    </div>

    <div :class="$style.filtersCard">
      <div :class="$style.filtersGrid">
        <Select
          v-model="filters.operationType"
          :options="operationTypeOptions"
          :label="t('balance.history.filter_operation_type')"
        />
        <Select
          v-if="accountType !== 'deposit'"
          v-model="filters.reason"
          :options="reasonOptions"
          :label="t('balance.history.filter_reason')"
        />
        <Select
          v-model="filters.userId"
          :options="managerOptions"
          :label="t('balance.history.filter_manager')"
        />
        <Select
          v-if="accountType !== 'deposit'"
          v-model="filters.payer"
          :options="payerOptions"
          :label="t('balance.history.filter_payer')"
          :disabled="!isPayerFilterEnabled"
        >
          <template #label-extra>
            <TooltipIcon
              :icon="ExclamationCircleIcon"
              :tooltip-text="t('balance.history.filter_payer_tooltip')"
              kind="unset"
              :align="tooltipAlign"
              :class="$style.tooltipIcon"
              icon-class="w-6 h-6 text-gray-500"
              :tooltip-styles="{ width: '20rem', whiteSpace: 'normal' }"
            />
          </template>
        </Select>
        <Date
          v-model="filters.dateRange"
          :label="t('balance.history.filter_date')"
          :disabled-future-dates="true"
          range
        />
        <Input
          v-model="filters.comment"
          :placeholder="t('balance.history.search_comment')"
          type="text"
          :class="$style.filterInput"
        >
          <template #input-icon>
            <MagnifyingGlassIcon :class="$style.searchIcon" />
          </template>
        </Input>
        <div :class="$style.filterActions">
          <CommonButton
            kind="primary"
            :class="$style.actionBtn"
            @click="applyFilters"
          >
            {{ t('actions.apply') }}
          </CommonButton>
          <CommonButton
            v-if="isFilterApplied"
            kind="white"
            :class="$style.actionBtn"
            @click="resetFilters"
          >
            {{ t('actions.reset') }}
          </CommonButton>
        </div>
      </div>
    </div>

    <div :class="$style.tableCard">
      <DataTable :table="table">
        <template #createdAt="{ value }">
          <div class="px-4 py-3">
            {{ formatDate(value as string) }}
          </div>
        </template>
        <template #type="{ value }">
          <div class="px-4 py-3">
            <Label
              :text="t('balance.history.operation_types.' + value)"
              :kind="getOperationLabelKind(value as string)"
            />
          </div>
        </template>
        <template #reason="{ value }">
          <div class="px-4 py-3">
            {{ value ? t('balance.change.reasons.' + value, value as string) : '—' }}
          </div>
        </template>
        <template #user="{ row }">
          <div class="px-4 py-3">
            {{ row.original.user?.name || '—' }}
          </div>
        </template>
        <template #payerName="{ value }">
          <div class="px-4 py-3">
            {{ (value as string) || '—' }}
          </div>
        </template>
        <template #amount="{ row, value }">
          <div class="px-4 py-3">
            {{ formatAmountByType(value as number, row.original.type) }}
          </div>
        </template>
        <template #balanceAfter="{ value }">
          <div class="px-4 py-3 font-semibold">
            {{ formatBalance(value as number) }}
          </div>
        </template>
        <template #file="{ row }">
          <div class="px-4 py-3">
            <a
              v-if="row.original.file?.url"
              :href="row.original.file.url"
              target="_blank"
              rel="noopener noreferrer"
              class="text-blue-500 hover:text-primary-500 underline text-sm break-all"
            >
              {{ t('balance.history.view_file') }}
            </a>
            <span
              v-else
              class="text-gray-400"
            >—</span>
          </div>
        </template>
        <template #comment="{ row }">
          <div class="px-4 py-3 relative">
            <div :class="[$style.commentBox, 'max-w-[250px]']">
              <template v-if="row.original.commentRu || row.original.commentZh || row.original.comment">
                <TranslatableWrapper
                  :data="{
                    comment_ru: row.original.commentRu || row.original.comment,
                    comment_zh: row.original.commentZh,
                    original_locale: row.original.originalLocale || 'ru',
                  }"
                  :config="{
                    keys: {
                      ru: 'comment_ru',
                      zh: 'comment_zh',
                      original: 'original_locale',
                    },
                  }"
                  class="pr-8"
                  control-class="absolute top-0 right-0 z-10"
                >
                  <template #default="{ displayedText }">
                    <span v-if="!expandedComments[row.original.id]">
                      {{ truncateComment(displayedText) }}
                      <button
                        v-if="displayedText && displayedText.length > commentMaxLength"
                        type="button"
                        class="text-blue-500 hover:text-primary-500 underline text-sm ml-1 whitespace-nowrap"
                        @click="toggleComment(row.original.id)"
                      >
                        {{ t('balance.history.read_more') }}
                      </button>
                    </span>
                    <span v-else>
                      <span class="whitespace-pre-wrap">{{ displayedText }}</span>
                      <button
                        type="button"
                        class="text-blue-500 hover:text-primary-500 underline text-sm ml-1 whitespace-nowrap"
                        @click="toggleComment(row.original.id)"
                      >
                        {{ t('balance.history.hide') }}
                      </button>
                    </span>
                  </template>
                </TranslatableWrapper>
              </template>
              <span
                v-else
                class="text-gray-400"
              >—</span>
            </div>
          </div>
        </template>
      </DataTable>
      <CommonDataState
        :loading="isListPending"
        :has-data="balance.data.value.length > 0"
        :loading-text="t('common.loading')"
        :empty-text="t('balance.history.not_found')"
      />
      <Pagination
        v-if="balance.total.value > balance.limit.value"
        :current-page="balance.page.value"
        :total="balance.total.value"
        :limit="balance.limit.value"
        :limits="pageSizes"
        @change-page="onPaginationChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, watch } from "vue"
import { useI18n } from "vue-i18n"
import { MagnifyingGlassIcon, ExclamationCircleIcon } from "@heroicons/vue/24/outline"
import DataTable from "@/components/table/DataTable.vue"
import useTanstackTable from "@/composables/useTanstackTable"
import Pagination from "@/components/common/Pagination.vue"
import Label from "@/components/common/Label.vue"
import Select from "@/components/form/Select.vue"
import Date from "@/components/form/Date.vue"
import type { ExternalColumn } from "@/types/common/tanstackTable"
import Input from "@/components/form/Input.vue"
import type { ClientBalance } from "@/types/common/client"
import { useClientBalance } from "@/composables/useClientBalance"
import { BalanceReasonOrder, balanceReasonLabelKey, isBalancePurchaseReason } from "~/constants/balance"
import { useRouter } from "#vue-router"
import TranslatableWrapper from "@/components/common/TranslatableWrapper.vue"
import TooltipIcon from "@/components/common/LabelTooltip.vue"
import type { OptionBase } from "@/types/form/optionType"

const props = withDefaults(defineProps<{
  clientId: number
  accountType: string
  hideEdit?: boolean
}>(), {
  hideEdit: false,
})

const { t } = useI18n()
const { formatDateTime } = useDate()
const router = useRouter()

const TOOLTIP_ALIGN_END_BREAKPOINT = 1280
const windowWidth = ref(import.meta.client ? window.innerWidth : TOOLTIP_ALIGN_END_BREAKPOINT)

const syncWindowWidth = () => {
  windowWidth.value = window.innerWidth
}

const tooltipAlign = computed((): "center" | "end" =>
  windowWidth.value < TOOLTIP_ALIGN_END_BREAKPOINT ? "end" : "center",
)

const balance = useClientBalance(props.clientId)
const hasFetched = ref(false)
const isListPending = computed(() => !hasFetched.value || balance.isLoading.value)

const commentMaxLength = 50
const expandedComments = ref<Record<number, boolean>>({})

const filters = ref({
  operationType: "" as string | number,
  reason: "" as string | number,
  userId: "" as string | number,
  payer: "" as string | number,
  dateRange: null as [Date, Date] | null,
  comment: "",
})

const appliedFilters = ref<Record<string, any>>({
  account_type: props.accountType,
})

const isPayerFilterEnabled = computed(() =>
  props.accountType !== "deposit" && isBalancePurchaseReason(String(filters.value.reason)),
)

const isFilterApplied = computed(() =>
  filters.value.operationType !== ""
  || filters.value.reason !== ""
  || filters.value.userId !== ""
  || filters.value.payer !== ""
  || filters.value.dateRange !== null
  || filters.value.comment !== "",
)

const pageSizes = [
  { id: 1, value: 10, name: 10, disabled: false },
  { id: 2, value: 20, name: 20, disabled: false },
  { id: 3, value: 50, name: 50, disabled: false },
]

function buildFilterParams(): Record<string, any> {
  const filterParams: Record<string, any> = {
    account_type: props.accountType,
  }

  if (filters.value.operationType) {
    filterParams.type = filters.value.operationType
  }

  if (filters.value.reason && props.accountType !== "deposit") {
    filterParams.reason = filters.value.reason
  }

  if (filters.value.userId !== "") {
    filterParams.userId = Number(filters.value.userId)
  }

  if (filters.value.payer && isPayerFilterEnabled.value) {
    filterParams.payer = filters.value.payer
  }

  if (filters.value.dateRange && Array.isArray(filters.value.dateRange)) {
    if (filters.value.dateRange[0]) {
      filterParams.createdAtFrom = formatDateTime(filters.value.dateRange[0], "YYYY-MM-DD") || undefined
    }
    if (filters.value.dateRange[1]) {
      filterParams.createdAtTo = formatDateTime(filters.value.dateRange[1], "YYYY-MM-DD") || undefined
    }
  }

  if (filters.value.comment?.trim()) {
    filterParams.comment = filters.value.comment.trim()
  }

  return filterParams
}

async function fetchHistoryData() {
  try {
    await balance.fetchHistory({ filters: appliedFilters.value })
  }
  finally {
    hasFetched.value = true
  }
}

function onPaginationChange({ currentPage, limit }: { currentPage: number, limit: number }) {
  balance.page.value = currentPage
  balance.limit.value = limit
  fetchHistoryData()
}

function formatDate(dateString: string): string {
  return formatDateTime(dateString, "DD.MM.YYYY") || ""
}

function formatBalance(value: number): string {
  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function onEditClick() {
  const routeName = props.accountType === "deposit"
    ? "admin-clients-balances-id-deposits-change"
    : "admin-clients-balances-id-main-change"

  router.push({
    name: routeName,
    params: { id: props.clientId },
  })
}

function formatAmountByType(value: number, type: string): string {
  const absValue = Math.abs(value)
  const formatted = new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(absValue)

  if (type === "increase") {
    return `+${formatted}`
  }
  if (type === "decrease") {
    return `-${formatted}`
  }
  return formatted
}

function truncateComment(comment: string): string {
  if (comment.length <= commentMaxLength) {
    return comment
  }
  return comment.substring(0, commentMaxLength) + "..."
}

function toggleComment(id: number) {
  expandedComments.value[id] = !expandedComments.value[id]
}

function getOperationLabelKind(type: string): "green" | "red" | "gray" {
  if (type === "increase") {
    return "green"
  }
  if (type === "decrease") {
    return "red"
  }
  return "gray"
}

function applyFilters() {
  appliedFilters.value = buildFilterParams()
  balance.first()
  fetchHistoryData()
}

function emptyFilters() {
  return {
    operationType: "" as string | number,
    reason: "" as string | number,
    userId: "" as string | number,
    payer: "" as string | number,
    dateRange: null as [Date, Date] | null,
    comment: "",
  }
}

function resetFilters() {
  filters.value = emptyFilters()
  appliedFilters.value = { account_type: props.accountType }
  balance.first()
  fetchHistoryData()
}

const operationTypeOptions = [
  { id: 0, value: "", name: t("common.all"), disabled: false },
  { id: 1, value: "increase", name: t("balance.history.operation_types.increase"), disabled: false },
  { id: 2, value: "decrease", name: t("balance.history.operation_types.decrease"), disabled: false },
  { id: 3, value: "change", name: t("balance.history.operation_types.change"), disabled: false },
]

const reasonOptions = BalanceReasonOrder.map((reason, index) => ({
  id: index,
  value: reason,
  name: t(balanceReasonLabelKey(reason)),
  disabled: false,
}))

const managerOptions = computed<OptionBase[]>(() => [
  { id: 0, value: "", name: t("common.all"), disabled: false },
  ...balance.managers.value.map(manager => ({
    id: manager.id,
    value: manager.id,
    name: manager.name,
    disabled: false,
  })),
])

const payerOptions = computed<OptionBase[]>(() => [
  { id: 0, value: "", name: t("common.all"), disabled: false },
  ...balance.payers.value.map((payer, index) => ({
    id: index + 1,
    value: payer,
    name: payer,
    disabled: false,
  })),
])

const columns = computed<ExternalColumn<ClientBalance>[]>(() => {
  const cols: ExternalColumn<ClientBalance>[] = [
    {
      header: t("balance.history.column_date"),
      accessorKey: "createdAt",
      meta: {
        headerClass: "px-4 py-3 text-left font-medium",
        cellClass: "",
        style: "width: 150px",
      },
    },
    {
      header: t("balance.history.column_operation_type"),
      accessorKey: "type",
      meta: {
        headerClass: "px-4 py-3 text-left font-medium",
        cellClass: "",
        style: "width: 150px",
      },
    },
  ]

  if (props.accountType !== "deposit") {
    cols.push({
      header: t("balance.history.column_reason"),
      accessorKey: "reason",
      meta: {
        headerClass: "px-4 py-3 text-left font-medium",
        cellClass: "",
        style: "width: 180px",
      },
    })
  }

  cols.push({
    header: t("balance.history.column_manager"),
    id: "user",
    accessorKey: "user",
    meta: {
      headerClass: "px-4 py-3 text-left font-medium",
      cellClass: "",
      style: "width: 160px",
    },
  })

  if (props.accountType !== "deposit") {
    cols.push({
      header: t("balance.history.column_payer"),
      accessorKey: "payerName",
      meta: {
        headerClass: "px-4 py-3 text-left font-medium",
        cellClass: "",
        style: "width: 180px",
      },
    })
  }

  cols.push(
    {
      header: t("balance.history.column_amount"),
      accessorKey: "amount",
      meta: {
        headerClass: "px-4 py-3 text-left font-medium",
        cellClass: "",
        style: "width: 150px",
      },
    },
    {
      header: props.accountType === "deposit"
        ? t("balance.list.column_deposit")
        : t("balance.history.column_balance"),
      accessorKey: "balanceAfter",
      meta: {
        headerClass: "px-4 py-3 text-left font-medium",
        cellClass: "",
        style: "width: 150px",
      },
    },
    {
      header: t("balance.history.column_file"),
      id: "file",
      meta: {
        headerClass: "px-4 py-3 text-left",
        cellClass: "",
        style: "width: 120px",
      },
    },
    {
      header: t("balance.history.column_comment"),
      id: "comment",
      meta: {
        headerClass: "px-4 py-3 text-left",
        cellClass: "max-w-[250px]",
        style: "width: 250px; max-width: 250px",
      },
    },
  )

  return cols
})

const { table } = useTanstackTable(balance.data, columns)

watch(() => filters.value.reason, (reason) => {
  if (!isBalancePurchaseReason(String(reason))) {
    filters.value.payer = ""
  }
})

watch(() => props.accountType, () => {
  resetFilters()
})

onMounted(() => {
  syncWindowWidth()
  window.addEventListener("resize", syncWindowWidth)
  fetchHistoryData()
})

onBeforeUnmount(() => {
  window.removeEventListener("resize", syncWindowWidth)
})
</script>

<style module>
.page {
  @apply flex flex-col gap-4;
}
.heroCard,
.filtersCard,
.tableCard {
  @apply rounded-[9px] border border-gray-200 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)];
}
.heroRow {
  @apply flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between;
}
.heroInfo {
  @apply min-w-0;
}
.title {
  @apply truncate text-2xl font-bold leading-tight tracking-tight text-gray-900 md:text-[28px];
}
.metaGrid {
  @apply mt-3 grid gap-x-8 gap-y-3 sm:grid-cols-2;
}
.metaItem {
  @apply flex min-w-0 flex-col gap-0.5;
}
.metaLabel {
  @apply text-[11px] uppercase tracking-wide text-gray-500;
}
.metaValue {
  @apply truncate text-sm font-medium text-gray-900;
}
.actionBtn {
  @apply h-10 shrink-0 rounded-[9px];
}
.filtersGrid {
  @apply grid grid-cols-1 items-end gap-4 md:grid-cols-2 xl:grid-cols-3;
}
.filterActions {
  @apply flex flex-wrap items-center gap-2;
}
.filterInput {
  @apply w-full;
}
.filterInput :global(input) {
  @apply pr-10;
}
.searchIcon {
  @apply absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-black pointer-events-none;
}
.commentBox {
  overflow-wrap: anywhere;
  word-break: break-word;
  hyphens: auto;
}
.tooltipIcon {
  @apply w-5 h-5 text-gray-400;
}
</style>
