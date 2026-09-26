<template>
  <div>
    <div :class="$style.filtersRow">
      <div :class="$style.filterInputWrap">
        <Input
          v-model="filters.name"
          :placeholder="t('balance.list.search_user_full')"
          :label="t('balance.list.search_user')"
          type="text"
          :class="$style.filterInput"
        >
          <template #input-icon>
            <MagnifyingGlassIcon :class="$style.searchIcon" />
          </template>
        </Input>
      </div>
      <div :class="$style.filterSelectGroup">
        <Select
          v-model="filters.status"
          :options="statusOptions"
          :label="t('columns.users.status')"
          :class="$style.filterListBox"
        />
      </div>
      <div :class="$style.applyFilterWrap">
        <CommonButton
          kind="primary"
          @click="applyFilters"
        >
          {{ t('actions.apply') }}
        </CommonButton>
        <CommonButton
          v-if="isFilterApplied"
          kind="white"
          :class="$style.resetFilterBtn"
          @click="resetFilters"
        >
          {{ t('actions.reset') }}
        </CommonButton>
      </div>
    </div>
    <DataTable :table="table">
      <template #name="{ row, value }">
        <NuxtLink
          :class="$style.userName"
          style="cursor:pointer"
          @click.prevent="handleViewUser(row.original)"
        >
          {{ value }}
        </NuxtLink>
      </template>
      <template #status="{ value }">
        <div :class="$style.statusCell">
          {{ t('statuses.client.' + value) }}
        </div>
      </template>
      <template #balance="{ row, value }">
        <NuxtLink
          :to="{ name: 'admin-clients-balances-id-main', params: { id: row.original.id } }"
          :class="[$style.balanceCell, $style.clickableAmount]"
        >
          {{ formatBalance(value as number) }}
        </NuxtLink>
      </template>
      <template #deposit="{ row, value }">
        <NuxtLink
          :to="{ name: 'admin-clients-balances-id-deposits', params: { id: row.original.id } }"
          :class="[$style.balanceCell, $style.clickableAmount]"
        >
          {{ formatBalance(value as number) }}
        </NuxtLink>
      </template>
      <template #actions="{ row }">
        <div class="px-4 py-3 text-center flex justify-center">
          <MenuElips :menu-action-groups="getMenuActionGroups(row.original)" />
        </div>
      </template>
    </DataTable>
    <CommonDataState
      :loading="isListPending"
      :has-data="client.data.value.length > 0"
      :loading-text="t('common.loading')"
      :empty-text="t('balance.list.not_found')"
    />
    <Pagination
      v-if="client.total.value > client.limit.value"
      :current-page="client.page.value"
      :total="client.total.value"
      :limit="client.limit.value"
      :limits="pageSizes"
      :show-limits="false"
      :show-total="false"
      @change-page="onPaginationChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue"
import { useI18n } from "vue-i18n"
import type { CellContext } from "@tanstack/vue-table"
import { useRouter } from "vue-router"
import { MagnifyingGlassIcon } from "@heroicons/vue/24/outline"
import { NuxtLink } from "#components"
import DataTable from "@/components/table/DataTable.vue"
import useTanstackTable from "@/composables/useTanstackTable"
import Pagination from "@/components/common/Pagination.vue"
import Select from "@/components/form/Select.vue"
import type { ExternalColumn } from "@/types/common/tanstackTable"
import { StatusBlocked } from "@/constants/statuses"
import Input from "@/components/form/Input.vue"
import type { Client } from "@/types/responses/client"
import useClient from "@/composables/useClient"
import { RoleAdmin } from "~/constants/roles"
import MenuElips from "@/components/common/MenuElips.vue"
import type { MenuActions } from "@/types/common/menuActions"

definePageMeta({
  layout: "personal",
  auth: true,
  roles: [RoleAdmin],
})

const { t } = useI18n()
const router = useRouter()

const client = useClient()
const hasFetched = ref(false)
const isListPending = computed(() => !hasFetched.value || client.isLoading.value)

const pageSizes = [
  { id: 1, value: 10, name: 10, disabled: false },
  { id: 2, value: 20, name: 20, disabled: false },
  { id: 3, value: 50, name: 50, disabled: false },
]

const filters = ref({
  name: "",
  status: "",
})

const isFilterApplied = computed(() =>
  filters.value.name !== "" || filters.value.status !== "",
)

function buildFilterParams(): Record<string, any> {
  const filterParams: Record<string, any> = {}

  if (filters.value.name?.trim()) {
    filterParams.name = `%${filters.value.name.trim()}%`
  }

  if (filters.value.status) {
    filterParams.status = filters.value.status
  }
  else {
    filterParams.status = ["active", "blocked"]
  }

  return filterParams
}

async function fetchBalanceData() {
  const filterParams = buildFilterParams()

  try {
    await client.fetchClients({
      filters: { filter: filterParams },
    })
  }
  finally {
    hasFetched.value = true
  }
}

function applyFilters() {
  client.first()
  fetchBalanceData()
}

function resetFilters() {
  filters.value = { name: "", status: "" }
  client.first()
  fetchBalanceData()
}

function onPaginationChange({ currentPage, limit }: { currentPage: number, limit: number }) {
  client.page.value = currentPage
  client.limit.value = limit
  fetchBalanceData()
}

function handleViewUser(item: Client) {
  router.push({ name: "admin-clients-companies-id", params: { id: item.id } })
}

function formatBalance(value: string | number): string {
  if (value === undefined || value === null) {
    return "0,00"
  }
  const numValue = typeof value === "string" ? parseFloat(value) : value
  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numValue)
}

function getMenuActionGroups(item: Client): MenuActions[][] {
  const balanceActions: MenuActions[] = []
  const depositActions: MenuActions[] = []

  if (item.status !== StatusBlocked) {
    balanceActions.push({
      label: t("balance.list.edit_balance"),
      action: () => router.push({ name: "admin-clients-balances-id-main-change", params: { id: item.id } }),
    })
  }

  balanceActions.push({
    label: t("balance.list.balance_history"),
    action: () => router.push({ name: "admin-clients-balances-id-main", params: { id: item.id } }),
  })

  if (item.status !== StatusBlocked) {
    depositActions.push({
      label: t("balance.list.edit_deposit"),
      action: () => router.push({ name: "admin-clients-balances-id-deposits-change", params: { id: item.id } }),
    })
  }

  depositActions.push({
    label: t("balance.list.deposit_history"),
    action: () => router.push({ name: "admin-clients-balances-id-deposits", params: { id: item.id } }),
  })

  return [balanceActions, depositActions]
}

const statusOptions = [
  { id: 0, value: "", name: t("common.all"), disabled: false },
  { id: 1, value: "active", name: t("statuses.client.active"), disabled: false },
  { id: 2, value: "blocked", name: t("statuses.client.blocked"), disabled: false },
]

const columns = ref<ExternalColumn<Client>[]>([
  {
    header: t("balance.list.column_company"),
    accessorKey: "name",
    meta: {
      headerClass: "px-4 py-3 text-left font-medium",
      cellClassFn: ({ row }: CellContext<Client, unknown>) =>
        `px-4 py-3 ${row.original.status === StatusBlocked ? "tableBlockedBg" : ""}`,
      style: "width: 300px",
    },
  },
  {
    header: t("balance.list.column_status"),
    accessorKey: "status",
    meta: {
      headerClass: "px-4 py-3 text-left font-medium",
      cellClassFn: ({ row }: CellContext<Client, unknown>) =>
        `px-4 py-3 ${row.original.status === StatusBlocked ? "tableBlockedBg" : ""}`,
      style: "width: 150px",
    },
  },
  {
    header: t("balance.list.column_balance"),
    accessorKey: "balance",
    meta: {
      headerClass: "px-4 py-3 text-left font-medium",
      cellClassFn: ({ row }: CellContext<Client, unknown>) =>
        `px-4 py-3 text-left ${row.original.status === StatusBlocked ? "tableBlockedBg" : ""}`,
      style: "width: 150px",
    },
  },
  {
    header: t("balance.list.column_deposit"),
    accessorKey: "deposit",
    meta: {
      headerClass: "px-4 py-3 text-left font-medium",
      cellClassFn: ({ row }: CellContext<Client, unknown>) =>
        `px-4 py-3 text-left ${row.original.status === StatusBlocked ? "tableBlockedBg" : ""}`,
      style: "width: 150px",
    },
  },
  {
    header: "",
    id: "actions",
    meta: {
      headerClass: "px-4 py-3 text-center",
      cellClassFn: ({ row }: CellContext<Client, unknown>) =>
        `px-4 py-3 text-center ${row.original.status === StatusBlocked ? "tableBlockedBg" : ""}`,
      style: "width: 80px",
    },
  },
])

const { table } = useTanstackTable(client.data, columns)

onMounted(() => fetchBalanceData())
</script>

<style module>
.filtersRow {
  @apply flex gap-2 mb-4 items-end;
}

@media (max-width: 1000px) {
  .filtersRow {
    @apply flex-wrap gap-2 items-end mb-3;
  }

  .filterSelectGroup {
    @apply flex-1;
    min-width: calc(50% - 4px);
  }

  .filterListBox {
    @apply w-full;
  }

  .filterInputWrap {
    @apply flex-1;
    min-width: calc(50% - 4px);
  }

  .applyFilterWrap {
    @apply mt-0 w-full flex flex-col gap-2;
    flex-basis: 100%;
    margin-left: 0;
  }
}

@media (max-width: 768px) {
  .filterInputWrap {
    @apply w-full;
    flex-basis: 100%;
  }
}

@media (min-width: 1001px) {
  .resetFilterBtn {
    @apply ml-2;
  }
}

.filterInputWrap {
  @apply relative flex flex-col w-64;
}

.searchIcon {
  @apply absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-black pointer-events-none;
}

.filterSelectGroup {
  @apply flex flex-col;
}

.filterListBox {
  @apply w-full;
}

.statusCell {
  @apply flex flex-col gap-2;
}

.userName {
  @apply block text-blue-500 hover:text-primary-500;
}

.applyFilterWrap {
  @apply mt-0;
}

.balanceCell {
  @apply font-semibold;
}

.clickableAmount {
  @apply text-blue-500 hover:text-primary-500 cursor-pointer transition-colors;
}
</style>
