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
        :to="{ name: 'admin-clients-companies' }"
        :class="$style.addNewLink"
      >
        <CommonButton kind="white">
          <ArrowPathIcon class="w-5 h-5 inline-block mr-1" />
          {{ t('actions.to_companies') }}
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
          {{ t('actions.apply_to_users') }}
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
          @click.prevent="handleViewData(row.original)"
        >
          {{ value }}
        </NuxtLink>
      </template>
      <template #company="{ row }">
        <span>
          <NuxtLink
            v-if="row.original.client"
            :to="{ name: 'admin-clients-companies-id', params: { id: row.original.client.id } }"
            :class="$style.companyLink"
          >
            {{ row.original.client.name }}
          </NuxtLink>
          <span v-else>-</span>
        </span>
      </template>
      <template #status="{ value }">
        <div :class="$style.statusCell">
          {{ t('statuses.client.' + value) }}
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
import { useRouter } from "vue-router"
import { ArrowPathIcon } from "@heroicons/vue/24/solid"
import DataTable from "@/components/table/DataTable.vue"
import useTanstackTable from "@/composables/useTanstackTable"
import MenuElips from "@/components/common/MenuElips.vue"
import Pagination from "@/components/common/Pagination.vue"
import Select from "@/components/form/Select.vue"
import type { ExternalColumn } from "@/types/common/tanstackTable"
import type { User } from "@/types/responses/user"
import {
  RoleAdmin,
  RoleDirector,
  RoleEmployee,
  RoleLogistic,
  RoleSellerClient,
  RoleSellerSearch, RoleSellerContent,
} from "@/constants/roles"
import { StatusBlocked } from "@/constants/statuses"
import { useApiUser } from "@/composables/api/useApiUser"
import useUser from "@/composables/useUser"
import { useChat } from "@/composables/useChat"

definePageMeta({
  layout: "personal",
  auth: true,
  roles: [RoleAdmin],
})

const { t } = useI18n()
const { start, finish } = useLoadingIndicator()
const { index, block: blockUser, unblock: unblockUser } = useApiUser()
const userActions = useUser()
const router = useRouter()
const usersData = ref<User[]>([])
const pagination = ref<any>({
  page: 1,
  perPage: 10,
  total: 0,
})
const { openAdminUserChat } = useChat()
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

async function fetchUsers(page = pagination.value.page, perPage = pagination.value.perPage) {
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
  fetchUsers(1, pagination.value.perPage)
}

function resetFilters() {
  filters.value = { name: "", status: "", role: "" }
  fetchUsers(1, pagination.value.perPage)
}

function onPaginationChange({ currentPage, limit }: { currentPage: number, limit: number }) {
  fetchUsers(currentPage, limit)
}

function handleDelete(item: User) {
  const confirmText = t("user.list.delete_confirm", { name: item.name })
  if (confirm(confirmText)) {
    userActions.destroy(item.id).then(() => fetchUsers(pagination.value.page, pagination.value.perPage))
  }
}

function handleViewData(item: User) {
  router.push({ name: "admin-clients-users-id", params: { id: item.id } })
}

async function blockUserAction(item: User) {
  start()
  try {
    await blockUser(item.id)
    await fetchUsers(pagination.value.page, pagination.value.perPage)
  }
  finally {
    finish()
  }
}

async function unblockUserAction(item: User) {
  start()
  try {
    await unblockUser(item.id)
    await fetchUsers(pagination.value.page, pagination.value.perPage)
  }
  finally {
    finish()
  }
}

async function handleBlock(item: User) {
  await blockUserAction(item)
}

async function handleUnblock(item: User) {
  await unblockUserAction(item)
}

const statusOptions = [
  { id: 0, value: "", name: t("common.all"), disabled: false },
  { id: 1, value: "active", name: t("statuses.client.active"), disabled: false },
  { id: 2, value: "blocked", name: t("statuses.client.blocked"), disabled: false },
]

const roleOptions = [
  { id: 0, value: "", name: t("common.all"), disabled: false },
  { id: 1, value: RoleDirector, name: t("roles.director"), disabled: false },
  { id: 2, value: RoleEmployee, name: t("roles.employee"), disabled: false },
  { id: 3, value: RoleAdmin, name: t("roles.admin"), disabled: false },
  { id: 4, value: RoleLogistic, name: t("roles.logistic"), disabled: false },
  { id: 5, value: RoleSellerContent, name: t("roles.seller_content"), disabled: false },
  { id: 6, value: RoleSellerSearch, name: t("roles.seller_search"), disabled: false },
  { id: 7, value: RoleSellerClient, name: t("roles.seller_client"), disabled: false },
]

const columns = ref<ExternalColumn<User>[]>([
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
    header: t("columns.users.company"),
    id: "company",
    cell: ({ row }: CellContext<User, unknown>) => row.original.client?.name || "-",
    meta: {
      headerClass: "px-4 py-3 text-left font-medium",
      cellClass: "px-4 py-3",
      style: "width: 200px",
    },
  },
  {
    header: t("columns.users.status"),
    accessorKey: "status",
    meta: {
      headerClass: "px-4 py-3 text-left font-medium",
      cellClassFn: ({ row }: CellContext<User, unknown>) =>
        `px-4 py-3 ${row.original.status === StatusBlocked ? "tableBlockedBg" : ""}`,
      style: "width: 150px",
    },
  },
  {
    header: t("columns.users.role"),
    accessorKey: "role",
    cell: ({ row }: CellContext<User, unknown>) => {
      const roleTranslations: Record<string, string> = {
        [RoleAdmin]: t("roles.admin"),
        [RoleDirector]: t("roles.director"),
        [RoleEmployee]: t("roles.employee"),
        [RoleSellerClient]: t("roles.seller_client"),
        [RoleSellerSearch]: t("roles.seller_search"),
        [RoleSellerContent]: t("roles.seller_content"),
        [RoleLogistic]: t("roles.logistic"),
      }
      return roleTranslations[row.original.role as keyof typeof roleTranslations] ?? row.original.role
    },
    meta: {
      headerClass: "px-4 py-3 text-left font-medium",
      cellClassFn: ({ row }: CellContext<User, unknown>) =>
        `px-4 py-3 ${row.original.status === StatusBlocked ? "tableBlockedBg" : ""}`,
      style: "width: 150px",
    },
  },
  {
    header: "",
    id: "actions",
    cell: ({ row }: CellContext<User, unknown>) => {
      const isBlocked = row.original.status === StatusBlocked

      const actionGroups = [
        [
          {
            label: t("actions.view_data"),
            action: () => handleViewData(row.original),
            disabled: false,
            style: "underline" as const,
          },
          {
            label: t("listing_request.chat"),
            action: () => openAdminUserChat({ userId: row.original.id }),
            disabled: false,
          },
        ],
        [
          {
            label: t("actions.block"),
            action: () => handleBlock(row.original),
            disabled: isBlocked,
          },
          {
            label: t("actions.unblock"),
            action: () => handleUnblock(row.original),
            disabled: !isBlocked,
          },
        ],
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

const { table } = useTanstackTable(usersData, columns)

onMounted(() => fetchUsers(pagination.value.page, pagination.value.perPage))
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
.statusCell {
  @apply flex flex-col gap-2;
}
.userName {
  @apply block text-blue-500 hover:text-primary-500;
}
.applyFilterWrap {
  @apply mt-6;
}
.resetFilterBtn {
  @apply ml-2;
}
.companyLink {
  @apply text-blue-500 hover:text-primary-500 underline;
}
</style>
