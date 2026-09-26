<template>
  <div>
    <div :class="$style.header">
      <h1 :class="$style.title">
        {{ t('reviews.title') }}
      </h1>
    </div>

    <div :class="$style.filters">
      <div :class="$style.filterRow">
        <div :class="$style.filterItem">
          <label :class="$style.filterLabel">{{ t('reviews.filters.date') }}</label>
          <VueDatePicker
            v-model="dateRange"
            range
            :input-class="$style.input"
            format="dd.MM.yyyy"
            :format-locale="localeComputed"
            :class="$style.datepicker"
            :enable-time-picker="false"
            :auto-apply="true"
            @update:model-value="onDateChange"
          />
        </div>

        <div :class="$style.filterItem">
          <Select
            v-model="filters.status"
            :label="t('reviews.filters.status')"
            :options="statusOptions"
            :placeholder="t('common.all')"
            @update:model-value="applyFilters"
          />
        </div>

        <div :class="$style.filterItem">
          <SearchableSelect
            v-model="filters.vin"
            :label="t('reviews.filters.vin')"
            :options="vinOptionsComputed"
            :placeholder="t('common.all')"
            :multiple="true"
            :return-value-only="false"
            :searchable="true"
            :clearable="true"
            @update:model-value="onVinChange"
          />
        </div>

        <div :class="$style.filterItem">
          <SearchableSelect
            v-model="filters.brand_id"
            :label="t('reviews.filters.brand')"
            :options="brandOptionsComputed"
            :placeholder="t('common.all')"
            :multiple="true"
            :return-value-only="false"
            :searchable="true"
            :clearable="true"
            @update:model-value="onBrandChange"
          />
        </div>

        <div :class="$style.filterItem">
          <SearchableSelect
            v-model="filters.client_id"
            :label="t('reviews.filters.client')"
            :options="clientOptionsComputed"
            :placeholder="t('common.all')"
            :multiple="true"
            :return-value-only="false"
            :searchable="true"
            :clearable="true"
            @update:model-value="onClientChange"
          />
        </div>
      </div>
    </div>

    <DataTable :table="table">
      <template #car="{ row }">
        <NuxtLink
          v-if="row.original.car"
          :to="{ name: 'personal-reviews-id', params: { id: row.original.id } }"
          :class="$style.carLink"
          @click.stop
        >
          {{ row.original.car.name }}
        </NuxtLink>
        <br>
        <span
          v-if="row.original.car?.vin"
          :class="$style.vin"
        >
          VIN: {{ row.original.car.vin }}
        </span>
      </template>

      <template #rating="{ value }">
        <span
          v-if="value === 'good'"
          :class="[$style.ratingIcon, $style.ratingGood]"
        >
          <HandThumbUpIcon class="w-5 h-5" />
        </span>
        <span
          v-else
          :class="[$style.ratingIcon, $style.ratingBad]"
        >
          <HandThumbDownIcon class="w-5 h-5" />
        </span>
      </template>

      <template #status="{ row, value }">
        <Label
          v-if="value === 'accepted'"
          kind="gray"
          :text="t('reviews.status.accepted')"
        />
        <Label
          v-else-if="value === 'rejected'"
          kind="red"
          :text="t('reviews.status.rejected')"
        />
        <NuxtLink
          v-else-if="value === 'pending'"
          :to="{ name: 'personal-reviews-id', params: { id: row.original.id } }"
          :class="$style.carLink"
          @click.stop
        >
          {{ t('reviews.actions.check') }}
        </NuxtLink>
      </template>

      <template #actions="{ row }">
        <div class="flex justify-end items-center gap-4">
          <MenuElips
            :menu-action-groups="getMenuActions(row.original)"
          />
        </div>
      </template>
    </DataTable>

    <div
      v-if="!isLoading && reviews.length === 0"
      :class="$style.emptyState"
    >
      {{ t('reviews.no_results') }}
    </div>

    <Pagination
      v-if="pagination.last_page > 1"
      :current-page="pagination.current_page"
      :total="pagination.total"
      :limit="pagination.limit"
      @change-page="onPageChange"
    />

    <ModalConfirm
      :is-open="isDeleteModalOpen"
      :title="t('reviews.modal.delete_title')"
      :description="t('reviews.modal.delete_confirm')"
      confirm-kind="primary"
      :confirm-text="t('common.delete')"
      @close="isDeleteModalOpen = false"
      @confirm="confirmDelete"
    />

    <ModalConfirm
      :is-open="isAcceptModalOpen"
      :title="t('reviews.modal.accept_title')"
      :description="t('reviews.modal.accept_confirm')"
      confirm-kind="green"
      :confirm-text="t('reviews.actions.accept')"
      @close="isAcceptModalOpen = false"
      @confirm="confirmAccept"
    />

    <ModalConfirm
      :is-open="isRejectModalOpen"
      :title="t('reviews.modal.reject_title')"
      :description="t('reviews.modal.reject_confirm')"
      confirm-kind="primary"
      :confirm-text="t('reviews.actions.reject')"
      @close="isRejectModalOpen = false"
      @confirm="confirmReject"
    />
  </div>
</template>

<script setup lang="ts">
import { HandThumbDownIcon, HandThumbUpIcon } from "@heroicons/vue/24/outline"
import {
  createColumnHelper,
  getCoreRowModel,
  useVueTable,
} from "@tanstack/vue-table"
import VueDatePicker from "@vuepic/vue-datepicker"
import { ru } from "date-fns/locale/ru"
import { zhCN } from "date-fns/locale/zh-CN"
import { computed, onMounted, ref, reactive } from "vue"
import { useI18n } from "vue-i18n"
import { useRouter } from "vue-router"
import Label from "@/components/common/Label.vue"
import Pagination from "@/components/common/Pagination.vue"
import Select from "@/components/form/Select.vue"
import SearchableSelect from "@/components/form/SearchableSelect.vue"
import MenuElips from "@/components/common/MenuElips.vue"
import ModalConfirm from "@/components/reviews/ModalConfirm.vue"
import DataTable from "@/components/table/DataTable.vue"
import { useReviews } from "@/composables/useReviews"
import type { MenuActions } from "@/types/common/menuActions"
import type { OptionBase } from "@/types/form/optionType"
import type { ReviewResponse } from "@/types/responses/reviews"
import { chinese } from "~/constants/lang"
import { RoleAdmin } from "~/constants/roles"
import type { PaginationData } from "@/types/common/pagination"

definePageMeta({
  auth: true,
  roles: [RoleAdmin],
  layout: "personal",
  hideTitle: true,
})

const { t, locale: currentLocale } = useI18n()
const router = useRouter()
const {
  isLoading,
  reviews,
  pagination,
  fetchReviews,
  updateReviewStatus,
  deleteReview,
  fetchFilters,
  filterOptions,
} = useReviews()

const localeComputed = computed(() => (currentLocale.value === chinese ? zhCN : ru))
const dateRange = ref<[Date, Date] | null>(null)

const filters = reactive({
  date_from: undefined as string | undefined,
  date_to: undefined as string | undefined,
  status: "",
  vin: [] as OptionBase[],
  brand_id: [] as OptionBase[],
  client_id: [] as OptionBase[],
})

const isDeleteModalOpen = ref(false)
const isAcceptModalOpen = ref(false)
const isRejectModalOpen = ref(false)
const selectedReviewId = ref<number | null>(null)

const statusOptions = [
  { id: 0, value: "", name: t("common.all"), disabled: false },
  { id: 1, value: "accepted", name: t("reviews.status.accepted"), disabled: false },
  { id: 2, value: "rejected", name: t("reviews.status.rejected"), disabled: false },
  { id: 3, value: "pending", name: t("reviews.status.pending"), disabled: false },
]

const allOption: OptionBase = { id: 0, value: "", name: t("common.all"), disabled: false }

const vinOptionsComputed = computed<OptionBase[]>(() => [allOption, ...filterOptions.value.vins])
const brandOptionsComputed = computed<OptionBase[]>(() => [allOption, ...filterOptions.value.brands])
const clientOptionsComputed = computed<OptionBase[]>(() => [allOption, ...filterOptions.value.clients])

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}.${date.getFullYear()} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
}

const columnHelper = createColumnHelper<ReviewResponse>()

const columns = [
  columnHelper.accessor("createdAt", {
    id: "date",
    header: t("reviews.table.date"),
    cell: info => formatDate(info.getValue()),
    meta: { headerClass: "px-4 py-3 text-left font-medium w-32", cellClass: "px-4 py-4" },
  }),
  columnHelper.accessor("car", {
    id: "car",
    header: t("reviews.table.car"),
    meta: { headerClass: "px-4 py-3 text-left font-medium", cellClass: "px-4 py-4" },
  }),
  columnHelper.accessor(row => row.buyer?.name, {
    id: "buyer",
    header: t("reviews.table.buyer"),
    meta: { headerClass: "px-4 py-3 text-left font-medium w-64", cellClass: "px-4 py-4" },
  }),
  columnHelper.accessor(row => row.seller?.name, {
    id: "seller",
    header: t("reviews.table.seller"),
    meta: { headerClass: "px-4 py-3 text-left font-medium w-64", cellClass: "px-4 py-4" },
  }),
  columnHelper.accessor("rating", {
    id: "rating",
    header: t("reviews.table.rating"),
    meta: { headerClass: "px-4 py-3 text-center font-medium w-28", cellClass: "px-4 py-4 text-center" },
  }),
  columnHelper.accessor("status", {
    id: "status",
    header: t("reviews.table.status"),
    meta: { headerClass: "px-4 py-3 text-left font-medium w-32", cellClass: "px-4 py-4" },
  }),
  columnHelper.display({
    id: "actions",
    header: "",
    meta: { headerClass: "px-4 py-3 w-32 font-medium", cellClass: "px-4 py-4 text-right" },
  }),
]

const table = useVueTable({
  get data() {
    return reviews.value
  },
  columns,
  getCoreRowModel: getCoreRowModel(),
})

const onDateChange = (dates: [Date, Date] | null) => {
  if (dates && dates.length === 2) {
    filters.date_from = dates[0].toISOString().split("T")[0]
    filters.date_to = dates[1].toISOString().split("T")[0]
  }
  else {
    filters.date_from = undefined
    filters.date_to = undefined
  }
  applyFilters()
}

const normalizeMultiSelect = (next: OptionBase[] | (number | string | OptionBase)[], allValue = ""): OptionBase[] => {
  const hasAll = Array.isArray(next) && next.some(v => String((v as any)?.value ?? v) === allValue)
  if (hasAll) {
    return []
  }

  return (Array.isArray(next) ? next : [])
    .map(v => (typeof v === "object" && v !== null && "value" in v
      ? v as OptionBase
      : { id: 0, value: v, name: String(v), disabled: false } as OptionBase
    ))
}
const onVinChange = (val: any) => {
  filters.vin = normalizeMultiSelect(val)
  applyFilters()
}

const onBrandChange = (val: any) => {
  filters.brand_id = normalizeMultiSelect(val)
  applyFilters()
}

const onClientChange = (val: any) => {
  filters.client_id = normalizeMultiSelect(val)
  applyFilters()
}
const applyFilters = () => {
  const cleanFilters: Record<string, any> = {}

  if (filters.date_from) {
    cleanFilters.date_from = filters.date_from
  }
  if (filters.date_to) {
    cleanFilters.date_to = filters.date_to
  }
  if (filters.status) {
    cleanFilters.status = filters.status
  }
  if (filters.vin.length) {
    cleanFilters.vin = filters.vin.map(v => v.value)
  }
  if (filters.brand_id.length) {
    cleanFilters.brand_id = filters.brand_id.map(v => v.value)
  }
  if (filters.client_id.length) {
    cleanFilters.client_id = filters.client_id.map(v => v.value)
  }

  fetchReviews({ filters: cleanFilters, page: 1 })
}

const onPageChange = (data: PaginationData) => {
  const page = data.currentPage
  const limit = data.limit

  const cleanFilters: Record<string, any> = {}
  for (const [key, value] of Object.entries(filters)) {
    if (value !== "" && value !== undefined && value !== null) {
      cleanFilters[key] = value
    }
  }

  fetchReviews({
    filters: cleanFilters,
    page,
    limit,
  })
}

const goToReview = (id: number) => {
  router.push(`/personal/reviews/${id}`)
}

const getMenuActions = (review: ReviewResponse): MenuActions[][] => {
  const actions: MenuActions[][] = []

  actions.push([{
    label: t("reviews.actions.view"),
    action: () => goToReview(review.id),
  }])

  const statusActions: MenuActions[] = []
  if (review.status !== "accepted") {
    statusActions.push({
      label: t("reviews.actions.accept"),
      action: () => openAcceptModal(review.id),
    })
  }
  if (review.status !== "rejected") {
    statusActions.push({
      label: t("reviews.actions.reject"),
      action: () => openRejectModal(review.id),
    })
  }
  if (statusActions.length > 0) {
    actions.push(statusActions)
  }

  actions.push([{
    label: t("reviews.actions.delete"),
    action: () => openDeleteModal(review.id),
    style: "red",
  }])

  return actions
}

const openAcceptModal = (id: number) => {
  selectedReviewId.value = id
  isAcceptModalOpen.value = true
}
const openRejectModal = (id: number) => {
  selectedReviewId.value = id
  isRejectModalOpen.value = true
}
const openDeleteModal = (id: number) => {
  selectedReviewId.value = id
  isDeleteModalOpen.value = true
}

const confirmAccept = async () => {
  if (selectedReviewId.value) {
    await updateReviewStatus(selectedReviewId.value, "accepted")
    isAcceptModalOpen.value = false
    applyFilters()
  }
}
const confirmReject = async () => {
  if (selectedReviewId.value) {
    await updateReviewStatus(selectedReviewId.value, "rejected")
    isRejectModalOpen.value = false
    applyFilters()
  }
}
const confirmDelete = async () => {
  if (selectedReviewId.value) {
    await deleteReview(selectedReviewId.value)
    isDeleteModalOpen.value = false
    applyFilters()
  }
}

onMounted(async () => {
  await fetchReviews()
  await fetchFilters()
})
</script>

<style module>
.header { @apply mb-6; }
.title { @apply text-3xl font-bold; }
.filters { @apply mb-6 bg-white rounded-lg; }
.filterRow { @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4; }
.filterItem { @apply flex flex-col; }
.filterLabel { @apply text-sm font-medium text-gray-700 mb-1; }
.carLink { @apply text-blue-600 hover:underline cursor-pointer; }
.vin { @apply text-sm text-gray-500; }
.ratingIcon { @apply inline-flex items-center justify-center; }
.ratingGood { @apply text-gray-600; }
.ratingBad { @apply text-red-600; }
.emptyState { @apply p-8 text-center text-gray-500; }
.input { @apply block w-full px-3 py-2 rounded-md border border-gray-300 placeholder-gray-400 focus:outline-none focus:ring-black focus:border-black sm:text-sm disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500; }
.datepicker { @apply w-full; }
</style>
