<template>
  <div>
    <div :class="$style.addNewWrap">
      <NuxtLink
        :to="{ name: 'admin-clients-companies-id', params: { id: 0 } }"
        :class="$style.addNewLink"
      >
        <CommonButton kind="white">{{ t('actions.add_new_company') }}</CommonButton>
      </NuxtLink>
      <NuxtLink
        :to="{ name: 'admin-clients-users-id', params: { id: 0 } }"
        :class="$style.addNewLink"
      >
        <CommonButton kind="white">{{ t('actions.add_new_employee') }}</CommonButton>
      </NuxtLink>
      <NuxtLink
        :to="{ name: 'admin-clients-users' }"
        :class="$style.addNewLink"
      >
        <CommonButton kind="white">
          <ArrowPathIcon class="w-5 h-5 inline-block mr-1" />
          {{ t('actions.to_users') }}
        </CommonButton>
      </NuxtLink>
    </div>
    <div :class="$style.filtersRow">
      <div :class="$style.filterInputWrap">
        <input
          v-model="filters.name"
          :class="$style.filterInput"
          type="text"
          :placeholder="t('columns.clients.name_or_fio')"
        >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          :class="$style.searchIcon"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z"
          />
        </svg>
      </div>
      <div :class="$style.filterSelectGroup">
        <Select
          v-model="filters.status"
          :options="statusOptions"
          :label="t('columns.users.status')"
          :class="$style.filterListBox"
        />
      </div>
      <div :class="$style.filterSelectGroup">
        <Select
          v-model="filters.role"
          :options="roleOptions"
          :label="t('columns.users.role')"
          :class="$style.filterListBox"
        />
      </div>
      <div :class="$style.applyFilterWrap">
        <CommonButton
          kind="primary"
          @click="applyFilters"
        >
          {{ t('actions.apply_to_companies') }}
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
        <div :class="$style.nameCell">
          <button
            v-if="row.getCanExpand()"
            :class="$style.expandButton"
            :aria-label="row.getIsExpanded() ? t('actions.collapse') : t('actions.expand')"
            @click="row.toggleExpanded()"
          >
            <ChevronUpIcon
              v-if="row.getIsExpanded()"
              :class="$style.expandIcon"
            />
            <ChevronDownIcon
              v-else
              :class="$style.expandIcon"
            />
          </button>
          <NuxtLink
            :class="[row.depth > 0 ? $style.subRowName : '', $style.userName]"
            style="cursor:pointer"
            @click.prevent="handleViewData(row.original)"
          >
            {{ value }}
          </NuxtLink>
        </div>
      </template>
      <template #status="{ row, value }">
        <div :class="$style.statusCell">
          {{ t('statuses.client.' + value) }}
          <div
            v-if="row.original.status === StatusPending && row.original.role === RoleCompany"
            :class="$style.statusButtons"
          >
            <CommonButton
              kind="unset"
              size="sm"
              :class="$style.statusBtn"
              @click="handleAcceptRegistration(row.original)"
            >
              {{ t('common.accept') }}
            </CommonButton>
            <CommonButton
              kind="unset"
              size="sm"
              :class="$style.statusBtn"
              @click="handleRejectRegistration(row.original)"
            >
              {{ t('common.reject') }}
            </CommonButton>
          </div>
        </div>
      </template>
    </DataTable>
    <div
      v-if="!usersData.length"
      :class="$style.nf"
    >
      <p>{{ t('user.list.not_found') }}</p>
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
  </div>
</template>

<script setup lang="ts">
import { ref, h, onMounted, computed } from "vue"
import { useI18n } from "vue-i18n"
import type { CellContext } from "@tanstack/vue-table"
import { ChevronDownIcon, ChevronUpIcon, ArrowPathIcon } from "@heroicons/vue/24/solid"
import { useRouter } from "vue-router"
import DataTable from "@/components/table/DataTable.vue"
import useTanstackTable from "@/composables/useTanstackTable"
import MenuElips from "@/components/common/MenuElips.vue"
import Pagination from "@/components/common/Pagination.vue"
import Select from "@/components/form/Select.vue"
import type { ExternalColumn } from "@/types/common/tanstackTable"
import type { Client, User } from "~/types/common/entities"
import { RoleAdmin, RoleCompany, RoleDirector, RoleEmployee, RoleSellerClient, RoleSellerContent, RoleSellerSearch, RoleLogistic } from "@/constants/roles"
import { StatusActive, StatusPending, StatusBlocked, StatusRejected } from "@/constants/statuses"
import { useApiClient } from "@/composables/api/useApiClient"
import { useApiUser } from "@/composables/api/useApiUser"
import useClient from "@/composables/useClient"
import useUser from "@/composables/useUser"

definePageMeta({
  layout: "personal",
  auth: true,
  roles: [RoleAdmin],
})

const { t } = useI18n()
const { start, finish } = useLoadingIndicator()
const { index, accept, reject, block: blockClient, unblock: unblockClient, pending } = useApiClient()
const { block: blockUser, unblock: unblockUser } = useApiUser()
const clientActions = useClient()
const userActions = useUser()
const router = useRouter()
const usersData = ref<(Client | User)[]>([])
const pagination = ref<any>({
  page: 1,
  perPage: 10,
  total: 0,
})
const pageSizes = [
  { id: 1, value: 10, name: 10, disabled: false },
  { id: 2, value: 20, name: 20, disabled: false },
  { id: 3, value: 50, name: 50, disabled: false },
]

const filters = ref({
  name: "",
  status: "",
  role: "",
})

const isFilterApplied = computed(() =>
  filters.value.name !== ""
  || filters.value.status !== ""
  || filters.value.role !== "",
)

async function fetchClients(page = pagination.value.page, perPage = pagination.value.perPage) {
  start()
  try {
    const offset = (page - 1) * perPage
    const limit = perPage
    const filter: Record<string, any> = {}
    if (filters.value.name) {
      filter.name = `%${filters.value.name}%`
    }
    if (filters.value.status) {
      filter.status = filters.value.status
    }
    if (filters.value.role) {
      filter.role = filters.value.role
    }
    const params: Record<string, any> = { offset, limit }
    if (Object.keys(filter).length > 0) {
      params.filter = filter
    }
    const response = await index(params)
    if (response.data) {
      usersData.value = response.data
    }
    let total = response.meta?.total ?? 0
    if (total === 0 && usersData.value.length > 0) {
      total = usersData.value.length
    }
    pagination.value = {
      page,
      perPage,
      total,
    }
  }
  finally {
    finish()
  }
}

function applyFilters() {
  fetchClients(1, pagination.value.perPage)
}

function resetFilters() {
  filters.value = { name: "", status: "", role: "" }
  fetchClients(1, pagination.value.perPage)
}

function onPaginationChange({ currentPage, limit }: { currentPage: number, limit: number }) {
  fetchClients(currentPage, limit)
}

function handleDelete(item: Client | User) {
  const isSeller = "type" in item
  const confirmText = t("user.list.delete_confirm", { name: item.name })
  if (confirm(confirmText)) {
    if (isSeller) {
      clientActions.destroy(item.id).then(() => fetchClients(pagination.value.page, pagination.value.perPage))
    }
    else {
      userActions.destroy(item.id).then(() => fetchClients(pagination.value.page, pagination.value.perPage))
    }
  }
}

function handleViewData(item: Client | User) {
  if ("type" in item) {
    router.push({ name: "admin-clients-companies-id", params: { id: item.id } })
  }
  else {
    router.push({ name: "admin-clients-users-id", params: { id: item.id } })
  }
}

function handleChangeBalance(item: Client) {
  router.push({ name: "admin-clients-balances-id-main-change", params: { id: item.id } })
}

async function blockUserAction(item: User) {
  start()
  try {
    await blockUser(item.id)
    await fetchClients(pagination.value.page, pagination.value.perPage)
  }
  finally {
    finish()
  }
}

async function unblockUserAction(item: User) {
  start()
  try {
    await unblockUser(item.id)
    await fetchClients(pagination.value.page, pagination.value.perPage)
  }
  finally {
    finish()
  }
}

async function blockClientAction(item: Client) {
  await blockClient(item.id)
  await fetchClients(pagination.value.page, pagination.value.perPage)
}

async function unblockClientAction(item: Client) {
  await unblockClient(item.id)
  await fetchClients(pagination.value.page, pagination.value.perPage)
}

async function handleBlock(item: Client | User) {
  if ("type" in item) {
    await blockClientAction(item)
  }
  else {
    await blockUserAction(item)
  }
}

async function handleUnblock(item: Client | User) {
  if ("type" in item) {
    await unblockClientAction(item)
  }
  else {
    await unblockUserAction(item)
  }
}

async function handleAcceptRegistration(item: Client | User) {
  if (!("type" in item)) {
    return
  }
  start()
  try {
    await accept(item.id)
    await fetchClients(pagination.value.page, pagination.value.perPage)
  }
  finally {
    finish()
  }
}

async function handleRejectRegistration(item: Client | User) {
  if (!("type" in item)) {
    return
  }
  start()
  try {
    await reject(item.id)
    await fetchClients(pagination.value.page, pagination.value.perPage)
  }
  finally {
    finish()
  }
}

async function handleReturnForReview(item: Client | User) {
  if (!("type" in item)) {
    return
  }
  start()
  try {
    await pending(item.id)
    await fetchClients(pagination.value.page, pagination.value.perPage)
  }
  finally {
    finish()
  }
}

function handleAddEmployeeToCompany(item: Client) {
  router.push({
    name: "admin-clients-users-id",
    params: { id: 0 },
    query: { client_id: item.id },
  })
}

const statusOptions = [
  { id: 0, value: "", name: t("common.all"), disabled: false },
  { id: 1, value: "active", name: t("statuses.client.active"), disabled: false },
  { id: 2, value: "pending", name: t("statuses.client.pending"), disabled: false },
  { id: 3, value: "blocked", name: t("statuses.client.blocked"), disabled: false },
  { id: 4, value: "rejected", name: t("statuses.client.rejected"), disabled: false },
]

const roleOptions = [
  { id: 0, value: "", name: t("common.all"), disabled: false },
  { id: 1, value: "company", name: t("roles.company"), disabled: false },
  { id: 3, value: "director", name: t("roles.entrepreneur"), disabled: false },
]

const columns = ref<ExternalColumn<Client | User>[]>([
  {
    header: t("columns.users.self"),
    accessorKey: "name",
    meta: {
      headerClass: "px-4 py-3 text-left font-medium",
      cellClass: "px-4 py-3",
      style: "width: 300px",
    },
  },
  {
    header: t("columns.users.status"),
    accessorKey: "status",
    meta: {
      headerClass: "px-4 py-3 text-left font-medium",
      cellClassFn: ({ row }: CellContext<Client | User, unknown>) =>
        `px-4 py-3 ${row.original.status === StatusPending ? "tablePendingBg" : ""} ${
          row.original.status === StatusBlocked ? "tableBlockedBg" : ""
        }`,
      style: "width: 150px",
    },
  },
  {
    header: t("columns.users.role"),
    accessorKey: "role",
    cell: ({ row }: CellContext<Client | User, unknown>) => {
      const roleTranslations = {
        [RoleCompany]: t("roles.company"),
        [RoleAdmin]: t("roles.admin"),
        [RoleDirector]: t("roles.director"),
        [RoleEmployee]: t("roles.employee"),
        [RoleSellerClient]: t("roles.seller_client"),
        [RoleSellerSearch]: t("roles.seller_search"),
        [RoleSellerContent]: t("roles.seller_content"),
        [RoleLogistic]: t("roles.logistic"),
      }
      return roleTranslations[row.original.role] || row.original.role
    },
    meta: {
      headerClass: "px-4 py-3 text-left font-medium",
      cellClassFn: ({ row }: CellContext<Client | User, unknown>) =>
        `px-4 py-3 ${row.original.status === StatusPending ? "tablePendingBg" : ""} ${
          row.original.status === StatusBlocked ? "tableBlockedBg" : ""
        }`,
      style: "width: 150px",
    },
  },
  {
    header: t("columns.users.balance"),
    accessorKey: "balance",
    cell: ({ row }: CellContext<Client | User, unknown>) => {
      return "type" in row.original ? (row.original as Client).balance : "-"
    },
    meta: {
      headerClass: "px-4 py-3 text-left font-medium",
      cellClassFn: ({ row }: CellContext<Client | User, unknown>) =>
        `px-4 py-3 ${row.original.status === StatusPending ? "tablePendingBg" : ""} ${
          row.original.status === StatusBlocked ? "tableBlockedBg" : ""
        }`,
      style: "width: 140px",
    },
  },
  {
    header: t("columns.users.deposit"),
    accessorKey: "deposit",
    cell: ({ row }: CellContext<Client | User, unknown>) => {
      if ("type" in row.original) {
        const deposit = (row.original as Client).deposit
        return deposit != null ? Math.round(Number(deposit)) : 0
      }
      return "-"
    },
    meta: {
      headerClass: "px-4 py-3 text-left font-medium",
      cellClassFn: ({ row }: CellContext<Client | User, unknown>) =>
        `px-4 py-3 ${row.original.status === StatusPending ? "tablePendingBg" : ""} ${
          row.original.status === StatusBlocked ? "tableBlockedBg" : ""
        }`,
      style: "width: 140px",
    },
  },
  {
    header: "",
    id: "actions",
    cell: ({ row }: CellContext<Client | User, unknown>) => {
      const isSeller = "type" in row.original
      const isActive = row.original.status === StatusActive
      const isPending = row.original.status === StatusPending
      const isBlocked = row.original.status === StatusBlocked
      const isRejected = row.original.status === StatusRejected

      const actionGroups = [
        [
          {
            label: t("actions.view_data"),
            action: () => handleViewData(row.original),
            disabled: false,
            style: "underline" as const,
          },
          ...(isSeller
            ? [
                {
                  label: t("actions.change_balance"),
                  action: () => handleChangeBalance(row.original as Client),
                  disabled: !isActive,
                  style: "underline" as const,
                },
              ]
            : []),
        ],
        [
          isSeller
            ? {
                label: t("actions.block"),
                action: () => handleBlock(row.original),
                disabled: isBlocked,
              }
            : {
                label: t("actions.block"),
                action: () => handleBlock(row.original),
                disabled: isBlocked,
              },
          isSeller
            ? {
                label: t("actions.unblock"),
                action: () => handleUnblock(row.original),
                disabled: !isBlocked,
              }
            : {
                label: t("actions.unblock"),
                action: () => handleUnblock(row.original),
                disabled: !isBlocked,
              },
        ],
        ...(isSeller
          ? [
              [
                {
                  label: t("actions.accept_registration"),
                  action: () => handleAcceptRegistration(row.original),
                  disabled: !isPending,
                },
                {
                  label: t("actions.reject_registration"),
                  action: () => handleRejectRegistration(row.original),
                  disabled: !isPending,
                },
                {
                  label: t("actions.return_for_review"),
                  action: () => handleReturnForReview(row.original),
                  disabled: !(isActive || isRejected),
                },
              ],
            ]
          : []),
        ...(isSeller
          ? [
              [
                {
                  label: t("actions.add_employee_to_company"),
                  action: () => handleAddEmployeeToCompany(row.original as Client),
                  disabled: isBlocked || isRejected,
                },
              ],
            ]
          : []),
        [
          {
            label: t("actions.delete"),
            action: () => handleDelete(row.original),
            disabled: false,
            style: "red" as const,
          },
        ],
      ]

      return h(MenuElips, { menuActionGroups: actionGroups })
    },
    meta: {
      headerClass: "px-0 py-3 text-right",
      cellClass: "px-0 py-3 text-right",
      style: "width:1%;min-width:0;max-width:40px;overflow:visible;",
    },
  },
])

const { table } = useTanstackTable(usersData, columns, {
  getSubRows: (row: Client | User) => {
    if ("type" in row && (row as Client).children.length > 0) {
      return (row as Client).children
    }
    return undefined
  },
  enableExpanding: true,
})

onMounted(() => fetchClients(pagination.value.page, pagination.value.perPage))
</script>

<style module>
.filtersRow {
  @apply flex gap-2 mb-4 items-center;
}
@media (max-width: 1000px) {
  .filtersRow {
    @apply flex-col gap-4 items-stretch;
  }
  .applyFilterWrap {
    @apply mt-0 w-full flex flex-col gap-2;
  }
  .resetFilterBtn {
    @apply ml-0;
  }
  .filterInputWrap {
    @apply w-full;
    width: 100% !important;
  }
  .filterInput {
    @apply w-full;
  }
}
.filterInputWrap {
  @apply relative flex items-center mt-6 w-64;
}
.filterInput {
  @apply px-4 py-2 rounded-full border border-gray-300 pr-10 w-full;
}
.searchIcon {
  @apply absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-black pointer-events-none;
}
.filterSelectGroup {
  @apply flex flex-col;
}
.filterListBox {
  @apply w-48;
}
.addNewWrap {
  @apply my-4 flex gap-4;
}
.addNewLink {
  @apply text-sm font-medium text-primary-600 hover:text-primary-500;
}
.nf {
  @apply relative px-4 py-5 sm:px-6 text-center text-gray-500 italic;
}
.nameCell {
  @apply flex items-center;
}
.statusCell {
  @apply flex flex-col gap-2;
}
.statusButtons {
  @apply flex gap-2 mt-2;
}
.expandButton {
  @apply mr-2 cursor-pointer;
}
.expandIcon {
  @apply size-5 text-gray-500;
}
.userName {
  @apply block text-blue-500 hover:text-primary-500;
}
.subRowName {
  @apply pl-12;
}
.statusBtn {
  @apply text-blue-500 hover:text-primary-500 p-0 mt-[-.5rem];
}
.applyFilterWrap {
  @apply mt-6;
}
.resetFilterBtn {
  @apply ml-2;
}
</style>
