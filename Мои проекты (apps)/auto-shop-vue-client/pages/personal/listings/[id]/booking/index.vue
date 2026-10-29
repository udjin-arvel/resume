<template>
  <div :class="$style.page">
    <Header />

    <div :class="$style.toolbar">
      <SearchableSelect
        v-model="selectedClient"
        :options="clientOptions"
        :label="t('listing_request.client')"
        :class="$style.clientFilter"
        :return-value-only="true"
      />
    </div>

    <DataTable
      :table="table"
      :class="$style.table"
    >
      <template #status="{ row }">
        <div class="flex flex-col items-start gap-1">
          <Label
            v-if="row.original.status === RequestStatusNew"
            :text="t('listing_request.status_new')"
            kind="green"
          />
          <Label
            v-else-if="row.original.status === RequestStatusConfirmed"
            :text="t('listing_request.status_confirmed')"
            kind="gray"
          />
          <Label
            v-else-if="row.original.status === RequestStatusDeclined"
            :text="t('listing_request.status_declined')"
            kind="red"
          />
          <span
            v-if="row.original.status === RequestStatusDeclined && cancellationReasonLabel(row.original.cancellationReason)"
            class="text-xs text-gray-500"
          >
            {{ cancellationReasonLabel(row.original.cancellationReason) }}
          </span>
        </div>
      </template>

      <template #client="{ row }">
        <div :class="$style.clientCell">
          <div :class="$style.clientName">
            {{ row.original.client }}
          </div>
          <div :class="$style.clientCompany">
            {{ row.original.company }}
          </div>
        </div>
      </template>

      <template #paidServices="{ row }">
        <div :class="$style.paidServices">
          <Label
            v-if="row.original.hasPaidDiagnostic"
            :text="t('listing_request.paid_diagnostic')"
            kind="blue"
          />
          <Label
            v-if="row.original.hasPaidCompensation"
            :text="t('listing_request.paid_compensation')"
            kind="blue"
          />
        </div>
      </template>

      <template #action="{ row }">
        <div :class="$style.actions">
          <template v-if="row.original.status === RequestStatusNew">
            <Button
              v-if="row.original.isWithdrawn"
              kind="lightgrey"
              size="sm"
              :disabled="true"
              :tooltip="t('listing_request.withdrawn_cannot_confirm')"
            >
              {{ t('listing_request.action_confirm') }}
            </Button>
            <Button
              v-else-if="hasConfirmedBooking"
              kind="lightgrey"
              size="sm"
              :disabled="true"
              :tooltip="t('listing_request.already_confirmed_cannot_confirm')"
            >
              {{ t('listing_request.action_confirm') }}
            </Button>
            <NuxtLink
              v-else-if="row.original.listingVin"
              :to="{
                name: 'personal-listings-id-booking-requestId-confirm',
                params: { id: listingId, requestId: row.original.id },
              }"
            >
              <Button
                kind="lightgrey"
                size="sm"
              >
                {{ t('listing_request.action_confirm') }}
              </Button>
            </NuxtLink>
            <Button
              v-else
              kind="lightgrey"
              size="sm"
              :disabled="true"
              :tooltip="t('listing_request.vin_is_absence')"
            >
              {{ t('listing_request.action_confirm') }}
            </Button>
            <Button
              kind="white"
              size="sm"
              :disabled="isProcessing"
              @click="handleDecline(row.original.id)"
            >
              {{ t('listing_request.action_decline') }}
            </Button>
          </template>
        </div>
      </template>

      <template #chat="{ row }">
        <div :class="$style.chatCell">
          <ToChat
            type="listing"
            :listing-id="listingId"
            :buyer-id="row.original.userId"
          >
            <template #default="{ goToChat, chatLoading }">
              <button
                type="button"
                :class="$style.chatButton"
                :disabled="chatLoading"
                :aria-busy="chatLoading || undefined"
                @click="goToChat"
              >
                <span>{{ chatLoading ? t('common.loading') : t('listing_request.chat') }}</span>
                <ArrowUpRightIcon
                  v-if="!chatLoading"
                  :class="$style.chatIcon"
                />
              </button>
            </template>
          </ToChat>
        </div>
      </template>
    </DataTable>
  </div>
</template>

<script setup lang="ts">
import { ArrowUpRightIcon } from "@heroicons/vue/24/outline"
import { ref, computed, onMounted } from "vue"
import { useI18n } from "vue-i18n"
import { useRoute } from "vue-router"
import { RoleAdmin, RoleSellerClient } from "@/constants/roles"
import Header from "~/components/listing/Header.vue"
import DataTable from "@/components/table/DataTable.vue"
import useTanstackTable from "@/composables/useTanstackTable"
import type { ExternalColumn } from "@/types/common/tanstackTable"
import Label from "@/components/common/Label.vue"
import Button from "@/components/common/Button.vue"
import SearchableSelect from "@/components/form/SearchableSelect.vue"
import { RequestStatusNew, RequestStatusConfirmed, RequestStatusDeclined, CancellationReasonListingSold, CancellationReasonListingWithdrawn, CancellationReasonBookingExpired } from "@/constants/listingRequests"
import { SaleStatusWithdrawn } from "@/constants/catalog"
import { useBookingRequests } from "@/composables/useBookingRequests"
import { useDate } from "@/composables/useDate"
import type { OptionBase } from "@/types/form/optionType"
import ToChat from "@/components/chat/ToChat.vue"

definePageMeta({
  auth: true,
  roles: [RoleAdmin, RoleSellerClient],
  hideTitle: true,
  layout: "catalog",
})

const { t } = useI18n()
const route = useRoute()
const { formatDateTime } = useDate()
const { rawBookingData, allClientOptions, clientPaidServicesInfo, isProcessing,
  loadRequests, loadClients, declineRequest } = useBookingRequests()

const listingId = computed(() => Number(route.params.id))

const selectedClient = ref<number | undefined>(undefined)

interface BookingRow {
  id: number
  requestDate: string
  status: string
  cancellationReason: string | null
  client: string
  company: string
  clientId: number
  userId: number
  hasPaidDiagnostic: boolean
  hasPaidCompensation: boolean
  listingVin?: string | null
  isWithdrawn: boolean
}

const bookingData = computed<BookingRow[]>(() => {
  let filtered = rawBookingData.value

  if (selectedClient.value) {
    filtered = filtered.filter(item => item.client_id === selectedClient.value)
  }

  return filtered.map((item) => {
    const paidServices = clientPaidServicesInfo.value.get(item.user_id)

    return {
      id: item.id,
      requestDate: formatDateTime(item.created_at, "DD.MM.YYYY, HH:mm") ?? "—",
      status: item.status,
      cancellationReason: item.cancellation_reason ?? null,
      client: item.client_fio || item.client_name || "—",
      company: item.client_name || "—",
      clientId: item.client_id,
      userId: item.user_id,
      hasPaidDiagnostic: paidServices?.diagnostic ?? false,
      hasPaidCompensation: paidServices?.compensation ?? false,
      listingVin: item.listing_vin,
      isWithdrawn: item.listing_sale_status === SaleStatusWithdrawn,
    }
  })
})

const hasConfirmedBooking = computed(() =>
  rawBookingData.value.some(item => item.status === RequestStatusConfirmed),
)

const clientOptions = computed<OptionBase[]>(() => {
  const allOption: OptionBase = {
    id: 0,
    value: "",
    name: t("listing_request.all_clients"),
    disabled: false,
  }

  return [allOption, ...allClientOptions.value]
})

const columns = ref<ExternalColumn<BookingRow>[]>([
  {
    header: t("listing_request.request_date"),
    accessorKey: "requestDate",
    meta: {
      headerClass: "px-4 py-3 text-left font-medium",
      cellClassFn: () => "px-4 py-3 align-middle",
      style: "width: 160px; min-width: 160px;",
    },
  },
  {
    header: "",
    id: "status",
    meta: {
      headerClass: "px-4 py-3 text-left font-medium",
      cellClassFn: () => "px-4 py-3 align-middle",
      style: "width: 140px; min-width: 140px;",
    },
  },
  {
    header: t("listing_request.client"),
    id: "client",
    meta: {
      headerClass: "px-4 py-3 text-left font-medium",
      cellClassFn: () => "px-4 py-3 align-middle",
      style: "width: 200px; min-width: 180px;",
    },
  },
  {
    header: "",
    id: "paidServices",
    cell: () => "",
    meta: {
      headerClass: "px-4 py-3",
      cellClassFn: () => "px-4 py-3 align-middle",
      style: "width: 180px; min-width: 160px;",
    },
  },
  {
    header: "",
    id: "action",
    cell: () => "",
    meta: {
      headerClass: "px-4 py-3",
      cellClassFn: () => "px-4 py-3 align-middle",
      style: "width: 260px; min-width: 240px;",
    },
  },
  {
    header: "",
    id: "chat",
    cell: () => "",
    meta: {
      headerClass: "px-4 py-3",
      cellClassFn: () => "px-4 py-3 align-middle",
      style: "width: 100px; min-width: 100px; max-width: 120px;",
    },
  },
])

const { table } = useTanstackTable(bookingData, columns)

function cancellationReasonLabel(reason: string | null | undefined): string | null {
  if (reason === CancellationReasonListingSold) {
    return t("listing_request.cancellation_listing_sold")
  }
  if (reason === CancellationReasonListingWithdrawn) {
    return t("listing_request.cancellation_listing_withdrawn")
  }
  if (reason === CancellationReasonBookingExpired) {
    return t("listing_request.cancellation_booking_expired")
  }

  return null
}

async function handleDecline(requestId: number) {
  await declineRequest(listingId.value, requestId)
}

onMounted(async () => {
  await Promise.all([loadRequests(listingId.value), loadClients(listingId.value)])
})
</script>

<style module>
.page {
  @apply w-full min-w-0 pb-6;
}

.toolbar {
  @apply mt-4 mb-2;
}

.clientFilter {
  @apply w-full max-w-xs;
}

.table {
  @apply mt-4;
}

.clientCell {
  @apply min-w-0;
}

.clientName {
  @apply text-sm text-gray-900 truncate;
}

.clientCompany {
  @apply text-xs text-gray-400 truncate;
}

.paidServices {
  @apply flex flex-col items-start gap-1.5;
}

.actions {
  @apply flex flex-wrap items-center gap-2;
}

.chatCell {
  @apply flex items-center justify-start;
}

.chatButton {
  @apply inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed;
}

.chatIcon {
  @apply w-4 h-4 shrink-0;
}
</style>
