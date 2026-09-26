<template>
  <div>
    <div
      v-if="showRequestMoreButton"
      class="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200"
    >
      <p class="text-sm text-gray-600 mb-3 text-center">
        {{ t('needs.no_suitable_proposals') }}
      </p>
      <div class="flex justify-center">
        <Button
          kind="green"
          :disabled="isRequesting || !canRequestMore"
          @click="handleRequestMore"
        >
          <template v-if="isRequesting">
            {{ t('common.loading') }}
          </template>
          <template v-else>
            {{ t('needs.request_more_variants') }}
          </template>
        </Button>
      </div>
      <p
        v-if="isBookingPaused"
        class="mt-2 text-center text-xs text-gray-500"
      >
        {{ t('needs.booking_action_blocked') }}
      </p>
      <p
        v-if="requestMoreFailed"
        role="alert"
        class="mt-2 text-center text-sm text-red-600"
      >
        {{ t('needs.action_error') }}
      </p>
    </div>
    <div
      v-if="isBookingPaused"
      class="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900"
    >
      {{ t('needs.booking_paused_hint') }}
    </div>
    <div
      v-else-if="findMoreRequested && !isSeller"
      class="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="flex-shrink-0">
            <svg
              class="w-6 h-6 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <p class="font-medium text-blue-900">
              {{ t('needs.find_more_requested') }}
            </p>
            <p class="text-sm text-blue-700">
              {{ t('needs.find_more_requested_hint') }}
            </p>
          </div>
        </div>
      </div>
    </div>
    <div v-if="proposals.length > 0">
      <SearchRequestProposalCard
        v-for="proposal in proposals"
        :key="proposal.listing.id"
        :listing="proposal.listing"
        :listing-requests="requestsByListing.get(proposal.listing.id) ?? []"
        :search-request-id="searchRequestId"
        :buyer-id="buyerId"
        :proposal-status="proposal.status"
        :has-pending-booking="proposal.has_pending_booking"
        :source="proposal.source"
        :rejection-reason-text="proposal.rejection_reason"
        :rejection-reason-ru="proposal.rejection_reason_ru"
        :rejection-reason-zh="proposal.rejection_reason_zh"
        :rejection-reason-original-locale="proposal.rejection_reason_original_locale"
        :rejection-photos="proposal.rejection_photos || []"
        :is-seller="isSeller"
        :on-reject="refreshProposals"
      />
    </div>

    <div
      v-else
      :class="$style.emptyState"
    >
      <p>{{ t("needs.detail.no_proposals_yet") }}</p>
      <p
        v-if="!isBookingPaused"
        :class="$style.emptySubtext"
      >
        {{ t("needs.detail.proposals_will_appear_here") }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import { useI18n } from "vue-i18n"
import useSearchRequest from "@/composables/useSearchRequest"
import SearchRequestProposalCard from "@/components/needs/SearchRequestProposalCard.vue"
import Button from "@/components/common/Button.vue"
import type { Proposal } from "@/types/responses/proposal"
import type { SearchRequestListingRequest, SearchRequestStatusType } from "@/types/responses/searchRequest"
import { RequestStatusNew, RequestStatusInWork, RequestStatusOnBooking } from "@/constants/statuses"

interface Props {
  proposals: Proposal[]
  listingRequests: SearchRequestListingRequest[]
  searchRequestId: number
  requestStatus: SearchRequestStatusType
  findMoreRequested?: boolean
  isSeller?: boolean
  buyerId?: number
  refreshProposals: () => void
}

const props = defineProps<Props>()

const emit = defineEmits<{
  "update:findMoreRequested": [value: boolean]
}>()

const { t } = useI18n()
const { isRequesting, requestMoreListings } = useSearchRequest()
const requestMoreFailed = ref(false)
const isBookingPaused = computed(() => props.requestStatus === RequestStatusOnBooking)
const canRequestMore = computed(() => props.requestStatus === RequestStatusNew || props.requestStatus === RequestStatusInWork)

const requestsByListing = computed(() => {
  const grouped = new Map<number, SearchRequestListingRequest[]>()
  for (const request of props.listingRequests) {
    if (!request.listing) {
      continue
    }
    const requests = grouped.get(request.listing.id) ?? []
    requests.push(request)
    grouped.set(request.listing.id, requests)
  }
  return grouped
})

const showRequestMoreButton = computed(() => {
  if (!canRequestMore.value && !isBookingPaused.value) {
    return false
  }
  if (props.proposals.length === 0) {
    return false
  }
  if (props.findMoreRequested) {
    return false
  }
  const allRejected = props.proposals.every(p => p.status === "rejected")
  return allRejected && !props.isSeller
})

async function handleRequestMore() {
  if (!canRequestMore.value || isRequesting.value) {
    return
  }
  requestMoreFailed.value = false
  const ok = await requestMoreListings(props.searchRequestId)
  if (ok) {
    emit("update:findMoreRequested", true)
    props.refreshProposals()
  }
  else {
    requestMoreFailed.value = true
  }
}
</script>

<style module>
.emptyState {
  @apply text-center py-8;
}

.emptySubtext {
  @apply text-gray-500 text-sm;
}
</style>
