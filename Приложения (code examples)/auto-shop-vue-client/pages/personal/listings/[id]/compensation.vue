<template>
  <div>
    <Header />
    <NuxtLink
      :to="{ name: `personal-listings-id`, params: { id: listingId } }"
      class="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium mt-4"
    >
      {{ t('listing_request.go_to_compensation') }}
      <ArrowLongRightIcon class="w-5 h-5 ml-1" />
    </NuxtLink>
    <DataTable
      :table="table"
      class="mt-6"
    >
      <template #status="{ row }">
        <div class="flex flex-col items-start gap-1">
          <Label
            v-if="row.original.status === RequestStatusNew"
            :text="t('listing_request.status_new')"
            kind="green"
          />
          <Label
            v-else-if="row.original.status === RequestStatusClosed"
            :text="t('listing_request.status_closed')"
            kind="gray"
          />
          <Label
            v-else-if="row.original.status === RequestStatusAgain"
            :text="t('listing_request.status_again')"
            kind="yellow"
          />
          <Label
            v-else-if="row.original.status === RequestStatusDeclined"
            :text="t('listing_request.status_declined')"
            kind="red"
          />
          <span
            v-if="row.original.status === RequestStatusDeclined && cancellationReasonLabel(row.original.cancellation_reason)"
            class="text-xs text-gray-500"
          >
            {{ cancellationReasonLabel(row.original.cancellation_reason) }}
          </span>
        </div>
      </template>
      <template #client="{ row }">
        <div>
          <div>{{ row.original.client_fio }}</div>
          <div class="text-gray-400 text-sm">
            {{ row.original.client_name }}
          </div>
        </div>
      </template>
      <template #action="{ row }">
        <div class="flex gap-2 justify-start">
          <template v-if="row.original.status === RequestStatusNew || row.original.status === RequestStatusAgain">
            <Button
              kind="successOutline"
              :disabled="isLoading"
              @click="handleClose(row.original.id)"
            >
              {{ t('listing_request.action_done') }}
            </Button>
            <Button
              kind="white"
              :disabled="isLoading"
              @click="handleDecline(row.original.id)"
            >
              {{ t('listing_request.action_decline') }}
            </Button>
          </template>
          <template v-else-if="row.original.status === RequestStatusClosed || row.original.status === RequestStatusDeclined">
            <Button
              kind="white"
              :disabled="isLoading"
              @click="handleReopen(row.original.id)"
            >
              {{ t('listing_request.action_reopen') }}
            </Button>
          </template>
        </div>
      </template>
      <template #chat="{ row }">
        <span class="flex justify-end">
          <ToChat
            type="listing"
            :listing-id="listingId"
            :seller-id="row.original.listing_user_id"
            :buyer-id="row.original.user_id"
          >
            <template #default="{ chatLoading, clickDisabled, goToChat }">
              <button
                type="button"
                class="text-blue-600 hover:text-blue-800 transition-colors px-2 inline-flex items-center"
                :disabled="clickDisabled"
                :aria-busy="chatLoading || undefined"
                @click="goToChat"
              >
                <span v-if="!chatLoading">
                  {{ t('listing_request.chat') }}
                </span>
                <span v-else>{{ t('common.loading') }}</span>
              </button>
            </template>
          </ToChat>
        </span>
      </template>
    </DataTable>
    <Pagination
      v-if="pagination.total > pagination.perPage"
      :current-page="pagination.page"
      :total="pagination.total"
      :limit="pagination.perPage"
      :show-limits="false"
      :show-total="false"
      class="mt-2"
      @change-page="onPaginationChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ArrowLongRightIcon } from "@heroicons/vue/24/outline"
import { computed, onMounted } from "vue"
import { useI18n } from "vue-i18n"
import { RoleAdmin, RoleSellerClient } from "@/constants/roles"
import Header from "~/components/listing/Header.vue"
import DataTable from "@/components/table/DataTable.vue"
import useTanstackTable from "@/composables/useTanstackTable"
import type { ExternalColumn } from "@/types/common/tanstackTable"
import Label from "@/components/common/Label.vue"
import Button from "@/components/common/Button.vue"
import { useListingRequest } from "@/composables/useListingRequest"
import {
  RequestStatusNew,
  RequestStatusClosed,
  RequestStatusAgain,
  RequestTypeCompensation,
  RequestStatusDeclined,
  CancellationReasonListingSold,
  CancellationReasonListingWithdrawn,
} from "@/constants/listingRequests"
import type { ListingRequest } from "@/types/responses/listingRequest"
import Pagination from "~/components/common/Pagination.vue"
import ToChat from "@/components/chat/ToChat.vue"

definePageMeta({
  auth: true,
  roles: [RoleAdmin, RoleSellerClient],
  hideTitle: true,
  layout: "catalog",
})

const { t } = useI18n()
const route = useRoute()

const listingId = Number(route.params.id)
const {
  close,
  decline,
  reopen,
  fetchListingRequests,
  data: diagnosticData,
  pagination,
  isLoading,
} = useListingRequest(null)

const columns = computed<ExternalColumn<ListingRequest>[]>(() => [
  {
    header: t("listing_request.request_date"),
    accessorKey: "created_at",
    cell: ({ row }) =>
      new Date(row.original.created_at).toLocaleString("ru-RU", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).replace(/,/, ""),
    meta: {
      headerClass: "px-4 py-3 text-left font-medium",
      cellClassFn: () => "px-4 py-3",
      style: "width: 120px; min-width: 120px; max-width: 120px;",
    },
  },
  {
    header: "",
    id: "status",
    meta: {
      headerClass: "px-4 py-3 text-left font-medium",
      cellClassFn: () => "px-4 py-3",
      style: "width: 130px; min-width: 130px; max-width: 130px;",
    },
  },
  {
    header: t("listing_request.client"),
    id: "client",
    meta: {
      headerClass: "px-4 py-3 text-left font-medium",
      cellClassFn: () => "px-4 py-3",
      style: "width: 150px; min-width: 150px; max-width: 150px;",
    },
  },
  {
    header: "",
    id: "action",
    cell: () => "",
    meta: {
      headerClass: "px-0 py-3",
      cellClassFn: () => "px-0 py-3 flex justify-start",
      style: "width: 220px; min-width: 220px; max-width: 220px;",
    },
  },
  {
    header: "",
    id: "chat",
    cell: () => "",
    meta: {
      headerClass: "px-0 py-3",
      cellClassFn: () => "px-0 py-3",
      style: "width: 60px; min-width: 60px; max-width: 60px;",
    },
  },
])

const { table } = useTanstackTable(diagnosticData, columns)

function cancellationReasonLabel(reason: string | null | undefined): string | null {
  if (reason === CancellationReasonListingSold) {
    return t("listing_request.cancellation_listing_sold")
  }
  if (reason === CancellationReasonListingWithdrawn) {
    return t("listing_request.cancellation_listing_withdrawn")
  }

  return null
}

function onPaginationChange({ currentPage, limit }: { currentPage: number, limit: number }) {
  fetchListingRequests(listingId, currentPage, limit, RequestTypeCompensation)
}

async function handleClose(requestId: number) {
  await close(listingId, requestId)
  await fetchListingRequests(listingId, pagination.value.page, pagination.value.perPage, RequestTypeCompensation)
}

async function handleDecline(requestId: number) {
  await decline(listingId, requestId)
  await fetchListingRequests(listingId, pagination.value.page, pagination.value.perPage, RequestTypeCompensation)
}

async function handleReopen(requestId: number) {
  await reopen(listingId, requestId)
  await fetchListingRequests(listingId, pagination.value.page, pagination.value.perPage, RequestTypeCompensation)
}

onMounted(() => {
  fetchListingRequests(listingId, undefined, undefined, RequestTypeCompensation)
})
</script>
