<template>
  <div>
    <div :class="$style.headerRow">
      <CommonButton
        v-if="userStore.isBuyer"
        kind="green"
        @click="$router.push('/personal/links/create')"
      >
        {{ t('car_links.list.new_link') }}
      </CommonButton>

      <div :class="$style.statusFilter">
        <Select
          v-model="selectedStatus"
          :options="statusOptions"
          :label="t('car_links.list.filter_status_label')"
          :placeholder="t('car_links.list.filter_status_all')"
          @update:model-value="onFilterChange"
        />
      </div>
    </div>

    <div v-if="!isListPending && items.length > 0">
      <DataTable :table="table">
        <template #status="{ row, value }">
          <div
            class="px-4 py-3 cursor-pointer flex items-center gap-2 flex-wrap"
            @click="goToDetail(row.original.id)"
          >
            <Label
              :text="getStatusName(value as string)"
              :kind="getStatusLabelKind(value as string) as any"
            />
            <Label
              v-if="row.original.customerInterest === CustomerInterestEnum.INTERESTED"
              :text="t('car_links.list.interest_yes')"
              kind="green"
            />
            <Label
              v-if="row.original.customerInterest === CustomerInterestEnum.NOT_INTERESTED"
              :text="t('car_links.list.interest_no')"
              kind="red"
            />
            <Label
              v-if="row.original.closureOutcome"
              :text="getOutcomeName(row.original.closureOutcome)"
              :kind="getOutcomeLabelKind(row.original.closureOutcome) as any"
            />
          </div>
        </template>

        <template #url="{ value }">
          <div class="px-4 py-3">
            <a
              :href="value as string"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center text-blue-500 hover:text-primary-500 underline"
            >
              {{ t('car_links.list.go_to_link') }}
              <ArrowUpRightIcon class="w-4 h-4 ml-1" />
            </a>
          </div>
        </template>

        <template #listing="{ row }">
          <div class="px-4 py-3">
            <NuxtLink
              v-if="getAttachedListingId(row.original)"
              :to="listingRoute(row.original)"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center text-blue-500 hover:text-primary-500 underline"
            >
              {{ t('car_links.list.go_to_link') }}
              <ArrowUpRightIcon class="w-4 h-4 ml-1" />
            </NuxtLink>
            <span v-else>—</span>
          </div>
        </template>

        <template #internalNote="{ row, value }">
          <div
            class="px-4 py-3 cursor-pointer whitespace-pre-wrap text-gray-500"
            @click="goToDetail(row.original.id)"
          >
            {{ value || '—' }}
          </div>
        </template>

        <template #createdAt="{ row, value }">
          <div
            class="px-4 py-3 cursor-pointer"
            @click="goToDetail(row.original.id)"
          >
            {{ formatDateTime(value as string, 'DD.MM.YYYY HH:mm') }}
          </div>
        </template>

        <template #updatedAt="{ row, value }">
          <div
            class="px-4 py-3 cursor-pointer"
            @click="goToDetail(row.original.id)"
          >
            {{ value ? formatDateTime(value as string, 'DD.MM.YYYY HH:mm') : '—' }}
          </div>
        </template>

        <template
          v-if="!userStore.isBuyer"
          #actions="{ row }"
        >
          <div class="flex justify-end px-4 py-3">
            <MenuElips
              :vertical="false"
              placement="bottom-end"
              kind="unset"
              :menu-action-groups="[
                [
                  {
                    label: t('car_links.list.btn_add_car'),
                    action: () => handleAddCar(),
                    disabled: !canAddCar(row.original),
                  },
                ],
              ]"
            />
          </div>
        </template>
      </DataTable>
    </div>

    <CommonDataState
      :loading="isListPending"
      :has-data="items.length > 0"
      :loading-text="t('common.loading')"
      :empty-text="t('car_links.list.empty_state')"
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
import { ref, computed, onMounted, h } from "vue"
import { useDebounceFn, useThrottleFn } from "@vueuse/core"
import { useRouter } from "vue-router"
import { useI18n } from "vue-i18n"
import { ArrowUpRightIcon } from "@heroicons/vue/24/outline"
import { NuxtLink } from "#components"
import CommonButton from "@/components/common/Button.vue"
import CommonDataState from "@/components/common/DataState.vue"
import MenuElips from "@/components/common/MenuElips.vue"
import Select from "@/components/form/Select.vue"
import Label from "@/components/common/Label.vue"
import DataTable from "@/components/table/DataTable.vue"
import Pagination from "@/components/common/Pagination.vue"
import useTanstackTable from "@/composables/useTanstackTable"
import type { ExternalColumn } from "@/types/common/tanstackTable"
import { useUserStore } from "@/stores/user"
import { useUnreadCountStore } from "@/stores/unreadCount"
import { useCarLink } from "@/composables/useCarLink"
import { useDate } from "@/composables/useDate"
import type { CarLinkData } from "@/types/common/carLink"
import {
  ActionTypeEnum,
  CarLinkStatusEnum,
  CustomerInterestEnum,
  CarLinkClosureOutcomeEnum,
  type CarLinkStatus,
} from "@/constants/carLink"
import {
  RoleAdmin,
  RoleDirector,
  RoleEmployee,
  RoleSellerClient,
  RoleSellerSearch,
} from "~/constants/roles"

definePageMeta({
  auth: true,
  layout: "personal",
  roles: [RoleDirector, RoleAdmin, RoleEmployee, RoleSellerSearch, RoleSellerClient],
})

const { t } = useI18n()
const router = useRouter()
const userStore = useUserStore()
const unreadStore = useUnreadCountStore()
const { items, isLoading, page, limit, total, fetchCarLinks, first } = useCarLink()
const { formatDateTime } = useDate()

const hasFetched = ref(false)
const isListPending = computed(() => !hasFetched.value || isLoading.value)

const selectedStatus = ref<string>("")

const statusOptions = computed(() => [
  { id: 0, value: "", name: t("car_links.list.filter_status_all"), disabled: false },
  { id: 1, value: CarLinkStatusEnum.OPEN, name: t("car_links.list.status_open"), disabled: false },
  { id: 2, value: CarLinkStatusEnum.IN_PROGRESS, name: t("car_links.list.status_in_progress"), disabled: false },
  { id: 7, value: CarLinkStatusEnum.ANSWERED, name: t("car_links.list.status_answered"), disabled: false },
  { id: 3, value: CarLinkStatusEnum.CLOSED, name: t("car_links.list.status_closed"), disabled: false },
  { id: 4, value: CarLinkStatusEnum.CANCELLED, name: t("car_links.list.status_cancelled"), disabled: false },
  { id: 5, value: CustomerInterestEnum.INTERESTED, name: t("car_links.list.interest_yes"), disabled: false },
  { id: 6, value: CustomerInterestEnum.NOT_INTERESTED, name: t("car_links.list.interest_no"), disabled: false },
])

const pageSizes = [
  { id: 1, value: 10, name: 10, disabled: false },
  { id: 2, value: 20, name: 20, disabled: false },
  { id: 3, value: 50, name: 50, disabled: false },
]

const columns = computed<ExternalColumn<CarLinkData>[]>(() => {
  const unreadCell = ({ row }: any) =>
    row.original.isUnread ? "tableBlueUnreadBg" : ""

  const baseCols: ExternalColumn<CarLinkData>[] = [
    {
      header: t("car_links.list.column_number"),
      accessorKey: "id",
      cell: ({ row }) =>
        h(
          NuxtLink,
          {
            to: { name: "personal-links-id", params: { id: row.original.id } },
            class: "text-blue-600 hover:underline",
          },
          () => String(row.original.id).padStart(4, "0"),
        ),
      meta: {
        headerClass: "px-4 py-3 text-left font-medium",
        cellClass: "px-4 py-3",
        cellClassFn: unreadCell,
        style: "width: 100px",
      },
    },
    {
      header: t("car_links.list.column_status"),
      accessorKey: "status",
      meta: {
        headerClass: "px-4 py-3 text-left font-medium",
        cellClassFn: unreadCell,
      },
    },
    {
      header: t("car_links.list.column_url"),
      accessorKey: "url",
      meta: {
        headerClass: "px-4 py-3 text-left font-medium",
        cellClassFn: unreadCell,
      },
    },
    {
      header: t("car_links.list.column_listing"),
      id: "listing",
      meta: {
        headerClass: "px-4 py-3 text-left font-medium",
        cellClassFn: unreadCell,
      },
    },
  ]

  if (!userStore.isBuyer) {
    baseCols.push({
      header: t("car_links.list.column_internal_note"),
      accessorKey: "internalNote",
      meta: {
        headerClass: "px-4 py-3 text-left font-medium",
        cellClassFn: unreadCell,
        style: "width: 240px",
      },
    })
  }

  baseCols.push({
    header: t("car_links.list.column_created_at"),
    accessorKey: "createdAt",
    meta: {
      headerClass: "px-4 py-3 text-left font-medium",
      cellClassFn: unreadCell,
      style: "width: 180px",
    },
  })

  baseCols.push({
    header: t("car_links.list.column_updated_at"),
    accessorKey: "updatedAt",
    meta: {
      headerClass: "px-4 py-3 text-left font-medium",
      cellClassFn: unreadCell,
      style: "width: 180px",
    },
  })

  if (!userStore.isBuyer) {
    baseCols.push({
      id: "actions",
      header: "",
      meta: {
        headerClass: "px-4 py-3",
        cellClassFn: unreadCell,
        style: "width: 50px",
      },
    })
  }

  return baseCols
})

const { table } = useTanstackTable(items, columns)

async function loadData() {
  const filterParams: any = {}

  if (selectedStatus.value) {
    if (
      selectedStatus.value === CustomerInterestEnum.INTERESTED
      || selectedStatus.value === CustomerInterestEnum.NOT_INTERESTED
    ) {
      filterParams.filter = { customer_interest: selectedStatus.value }
    }
    else {
      filterParams.filter = { status: selectedStatus.value as CarLinkStatus }
    }
  }

  try {
    await fetchCarLinks(filterParams)
  }
  finally {
    hasFetched.value = true
  }
}

const throttledReloadData = useThrottleFn(() => {
  loadData()
}, 10000)

watch(() => unreadStore.counts.carLinks, (newVal, oldVal) => {
  if (newVal !== oldVal) {
    throttledReloadData()
  }
})

const onFilterChange = useDebounceFn(() => {
  first()
  loadData()
}, 600)

function onPaginationChange({ currentPage, limit: newLimit }: { currentPage: number, limit: number }) {
  page.value = currentPage
  limit.value = newLimit
  loadData()
}

function getStatusName(status: string): string {
  const option = statusOptions.value.find(o => o.value === status)
  return option ? option.name : status
}

function getStatusLabelKind(status: string): string {
  const map: Record<string, string> = {
    [CarLinkStatusEnum.OPEN]: "gray",
    [CarLinkStatusEnum.IN_PROGRESS]: "darkBlue",
    [CarLinkStatusEnum.ANSWERED]: "violet",
    [CarLinkStatusEnum.CLOSED]: "darkgray",
    [CarLinkStatusEnum.CANCELLED]: "red",
  }
  return map[status] || "gray"
}

function getOutcomeName(outcome: string): string {
  const map: Record<string, string> = {
    [CarLinkClosureOutcomeEnum.CAR_OFFERED]: t("car_links.list.outcome_car_offered"),
    [CarLinkClosureOutcomeEnum.CLIENT_DECLINED]: t("car_links.list.outcome_client_declined"),
    [CarLinkClosureOutcomeEnum.REFUSED_NO_LISTING]: t("car_links.list.outcome_refused_no_listing"),
  }
  return map[outcome] || outcome
}

function getOutcomeLabelKind(outcome: string): string {
  const map: Record<string, string> = {
    [CarLinkClosureOutcomeEnum.CAR_OFFERED]: "green",
    [CarLinkClosureOutcomeEnum.CLIENT_DECLINED]: "red",
    [CarLinkClosureOutcomeEnum.REFUSED_NO_LISTING]: "gray",
  }
  return map[outcome] || "gray"
}

function handleAddCar() {
  router.push({ name: "personal-listings-id", params: { id: 0 } })
}

function canAddCar(item: CarLinkData): boolean {
  return item.customerInterest === CustomerInterestEnum.INTERESTED
    && item.status !== CarLinkStatusEnum.CLOSED
    && item.status !== CarLinkStatusEnum.CANCELLED
}

function getAttachedListingId(item: CarLinkData): number | null {
  return item.actions?.find(a => a.type === ActionTypeEnum.CAR_ADDED)?.listingId ?? null
}

function listingRoute(item: CarLinkData) {
  const listingId = getAttachedListingId(item)
  if (!listingId) {
    return { name: "personal-links-id", params: { id: item.id } }
  }

  if (userStore.isBuyer) {
    return { name: "catalog-id", params: { id: listingId } }
  }

  return { name: "personal-listings-id", params: { id: listingId } }
}

function goToDetail(id: number) {
  router.push({ name: "personal-links-id", params: { id } })
}

onMounted(() => {
  loadData()
})
</script>

<style module>
.headerRow {
  @apply flex items-end gap-6 mb-6;
}

.statusFilter {
  @apply w-64;
}

.dataState {
  @apply mt-6;
}

@media (max-width: 768px) {
  .headerRow {
    @apply flex-col items-start gap-4;
  }
  .statusFilter {
    @apply w-full;
  }
}
</style>
