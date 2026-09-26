<template>
  <div :class="$style.wrapper">
    <div :class="$style.summary">
      <div
        v-for="group in groups"
        :key="group.type"
        :class="$style.summaryItem"
      >
        <span>{{ group.label }}</span>
        <strong :class="$style.value">{{ group.count }}</strong>
        <button
          :id="`${detailsId}-${group.type}-toggle`"
          type="button"
          :class="$style.toggle"
          :aria-expanded="expandedType === group.type"
          :aria-controls="detailsId"
          :aria-label="`${group.label}: ${t(expandedType === group.type ? 'actions.hide' : 'actions.show')}`"
          @click="toggle(group.type)"
        >
          {{ t(expandedType === group.type ? 'actions.hide' : 'actions.show') }}
        </button>
      </div>
      <div :class="$style.summaryItem">
        <span>{{ t('needs.detail.checks.spent') }}</span>
        <strong :class="$style.value">{{ formatPriceWithOptionalDecimals(totalSpent) }} ¥</strong>
      </div>
    </div>

    <div
      v-if="expandedType"
      :id="detailsId"
      role="region"
      :aria-labelledby="`${detailsId}-${expandedType}-toggle`"
      :class="$style.details"
    >
      <table :class="$style.table">
        <thead>
          <tr>
            <th scope="col">
              {{ t('listing_request.request_date') }}
            </th>
            <th scope="col">
              {{ t('needs.detail.checks.car') }}
            </th>
            <th scope="col">
              {{ t('needs.detail.checks.status') }}
            </th>
            <th
              scope="col"
              :class="$style.amount"
            >
              {{ t('needs.detail.checks.amount') }}
            </th>
            <th
              v-if="canManageChecks"
              scope="col"
            >
              {{ t('needs.check_transfer.actions') }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="request in visibleRequests"
            :key="request.id"
          >
            <td :class="$style.date">
              {{ formatDateTime(request.created_at, locale) || '—' }}
            </td>
            <td :class="$style.car">
              <NuxtLink
                v-if="request.listing"
                :to="isSeller ? `/personal/listings/${request.listing.id}` : `/catalog/${request.listing.id}`"
                :class="$style.carLink"
              >
                {{ request.listing.name }}
              </NuxtLink>
              <span v-else>{{ t('needs.detail.checks.car_unavailable') }}</span>
            </td>
            <td>
              <Label
                :text="statusLabel(request.status)"
                :kind="statusColors[request.status] ?? 'gray'"
                size="sm"
              />
            </td>
            <td :class="$style.amount">
              {{ formatPriceWithOptionalDecimals(getListingRequestCost(request.type)) }} ¥
            </td>
            <td v-if="canManageChecks">
              <template v-if="request.transfer_blocked_reason !== 'not_owner'">
                <button
                  type="button"
                  :disabled="!request.can_transfer || transferring"
                  :aria-describedby="!request.can_transfer ? `${detailsId}-${request.id}-transfer-reason` : undefined"
                  :class="$style.transfer"
                  @click="emit('transfer', request)"
                >
                  {{ t('needs.check_transfer.action') }}
                </button>
                <p
                  v-if="!request.can_transfer"
                  :id="`${detailsId}-${request.id}-transfer-reason`"
                  class="mt-1 max-w-48 text-xs text-gray-500"
                >
                  {{ transferBlockedReason(request) }}
                </p>
              </template>
            </td>
          </tr>
          <tr v-if="visibleRequests.length === 0">
            <td
              :colspan="canManageChecks ? 5 : 4"
              :class="$style.empty"
            >
              {{ t('needs.detail.checks.empty') }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, useId } from "vue"
import { useI18n } from "vue-i18n"
import Label from "@/components/common/Label.vue"
import { useMoney } from "@/composables/useMoney"
import {
  RequestStatusNew,
  RequestStatusClosed,
  RequestStatusAgain,
  RequestTypeDiagnostic,
  RequestTypeCompensation,
} from "@/constants/listingRequests"
import type { SearchRequestListingRequest } from "@/types/responses/searchRequest"
import { formatDateTime } from "@/utils/formatters"
import { getListingRequestCost } from "@/utils/listingRequestCost"

const props = defineProps<{
  requests: SearchRequestListingRequest[]
  isSeller: boolean
  canManageChecks?: boolean
  transferring?: boolean
}>()

const emit = defineEmits<{
  transfer: [request: SearchRequestListingRequest]
}>()

const { t, te, locale } = useI18n()
const { formatPriceWithOptionalDecimals } = useMoney()
const detailsId = useId()
const expandedType = ref<SearchRequestListingRequest["type"] | null>(null)
const statusColors: Record<string, "green" | "gray" | "yellow"> = {
  [RequestStatusNew]: "green",
  [RequestStatusClosed]: "gray",
  [RequestStatusAgain]: "yellow",
}
const groups = computed(() => [
  {
    type: RequestTypeDiagnostic,
    label: t("needs.detail.checks.diagnostics"),
    count: props.requests.filter(request => request.type === RequestTypeDiagnostic).length,
  },
  {
    type: RequestTypeCompensation,
    label: t("needs.detail.checks.compensation"),
    count: props.requests.filter(request => request.type === RequestTypeCompensation).length,
  },
] as const)
const visibleRequests = computed(() => props.requests.filter(request => request.type === expandedType.value))
const totalSpent = computed(() => props.requests.reduce((total, request) => total + getListingRequestCost(request.type), 0))

function toggle(type: SearchRequestListingRequest["type"]) {
  expandedType.value = expandedType.value === type ? null : type
}

function statusLabel(status: string) {
  const key = `listing_request.status_${status}`
  return te(key) ? t(key) : status
}

function transferBlockedReason(request: SearchRequestListingRequest) {
  const reason = request.transfer_blocked_reason
  if (reason === "source_not_active" || reason === "source_invoiced") {
    return t(`needs.check_transfer.${reason}`)
  }
  return t("needs.check_transfer.unavailable")
}
</script>

<style module>
.wrapper {
  @apply mb-6 w-fit max-w-full overflow-hidden rounded-xl border border-gray-200 bg-white text-sm;
}

.summary {
  @apply flex flex-wrap items-center gap-x-4 gap-y-3 bg-gray-50 px-4 py-3;
}

.summaryItem {
  @apply flex flex-wrap items-center gap-2 text-gray-500;
}

.summaryItem:not(:last-child) {
  @apply sm:border-r sm:border-gray-200 sm:pr-4;
}

.value {
  @apply whitespace-nowrap font-semibold text-gray-900;
}

.toggle {
  @apply rounded text-xs text-blue-600 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600;
}

.details {
  @apply overflow-x-auto border-t border-gray-200;
}

.table {
  @apply w-full border-collapse text-left;
}

.table th {
  @apply bg-gray-100 px-4 py-2 font-normal text-gray-500;
}

.table td {
  @apply border-b border-gray-100 px-4 py-3 align-top;
}

.table tbody tr:last-child td {
  @apply border-b-0;
}

.date {
  @apply whitespace-nowrap text-gray-500;
}

.car {
  overflow-wrap: anywhere;
}

.carLink {
  @apply text-blue-600 hover:underline;
}

.transfer {
  @apply whitespace-nowrap rounded text-sm text-blue-600 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:text-gray-400 disabled:no-underline;
}

.table .amount {
  @apply whitespace-nowrap text-right;
}

.empty {
  @apply text-center text-gray-500;
}
</style>
