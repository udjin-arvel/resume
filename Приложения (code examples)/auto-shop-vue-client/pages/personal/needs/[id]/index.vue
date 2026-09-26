<template>
  <div>
    <div :class="$style.topBlock">
      <div>
        <h1 :class="$style.title">
          {{
            t("needs.detail.title", {
              number: String(numericId).padStart(4, "0"),
            })
          }}
        </h1>
        <div :class="$style.statusRow">
          <div class="flex items-center gap-2">
            <Label
              :text="t(`statuses.request.${reqStatus}`)"
              :kind="RequestStatusColorMap[reqStatus]"
            />
            <Label
              v-if="isSeller && hasUnacknowledgedChanges"
              :text="t('statuses.request.updated')"
              :kind="RequestStatusColorMap['updated']"
            />
          </div>
          <div
            v-if="isSeller"
            class="flex items-center gap-2"
          >
            <span
              v-if="req?.executor"
              class="text-sm text-gray-600"
            >
              {{ t('needs.executor_label') }}
            </span>

            <ExecutorSelector
              :search-request-id="numericId"
              :request-status="req?.status"
              :current-executor="req?.executor"
              @update="fetchSearchRequest"
            />
          </div>
        </div>
      </div>

      <div :class="$style.actions">
        <ToChat
          v-if="canOpenChat"
          type="search_request"
          :search-request-id="numericId"
        >
          <template #default="{ chatLoading, clickDisabled, goToChat }">
            <CommonButton
              kind="white"
              :class="$style.button"
              :disabled="clickDisabled"
              :aria-busy="chatLoading || undefined"
              @click="goToChat"
            >
              <ChatBubbleLeftEllipsisIcon class="w-5 h-5 mr-2" />
              {{ t("needs.detail.open_chat") }}
              <Badge
                :value="chatUnread"
                class="ml-2"
              />
            </CommonButton>
          </template>
        </ToChat>

        <CommonButton
          v-if="isSeller && hasUnacknowledgedChanges"
          kind="green"
          :class="$style.button"
          :disabled="submittingAck"
          @click="handleAcknowledge"
        >
          <CheckCircleIcon class="w-5 h-5 mr-2" />
          {{ t("needs.detail.acknowledge_changes") }}
        </CommonButton>

        <div
          v-if="!isLocked && !isSeller"
          :class="$style.buttonWrapper"
        >
          <CommonButton
            kind="white"
            :class="$style.button"
            :disabled="hasPendingChanges"
            @click="handleEdit"
          >
            <PencilSquareIcon class="w-5 h-5 mr-2" />
            {{ t("needs.detail.edit_request") }}
          </CommonButton>
          <div
            v-if="hasPendingChanges"
            :class="$style.tooltip"
          >
            {{ t('needs.form.edit_pending_changes_tooltip') }}
          </div>
        </div>

        <CommonButton
          v-if="!isSeller"
          kind="white"
          :class="$style.button"
          :disabled="duplicating"
          @click="handleDuplicate"
        >
          {{ t("needs.form.duplicate_request") }}
        </CommonButton>

        <div
          v-if="isBookingPaused"
          :class="$style.buttonWrapper"
        >
          <CommonButton
            kind="black"
            :class="$style.button"
            disabled
            aria-describedby="booking-close-reason"
          >
            {{ t('needs.detail.close_request') }}
            <ChevronDownIcon :class="$style.arrowIcon" />
          </CommonButton>
          <p
            id="booking-close-reason"
            class="mt-1 max-w-48 text-xs text-gray-500"
          >
            {{ t('needs.booking_action_blocked') }}
          </p>
        </div>
        <Popover
          v-else-if="!isLocked"
          :class="$style.relativeBlock"
        >
          <PopoverButton as="template">
            <CommonButton
              kind="black"
              :class="$style.button"
            >
              {{ t("needs.detail.close_request") }}
              <ChevronDownIcon :class="$style.arrowIcon" />
            </CommonButton>
          </PopoverButton>
          <transition
            enter-active-class="transition ease-out duration-200"
            enter-from-class="opacity-0 translate-y-1"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition ease-in duration-150"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 translate-y-1"
          >
            <PopoverPanel :class="$style.chatMenuPanel">
              <div>
                <button
                  type="button"
                  :class="$style.menuItem"
                  @click="openComplete"
                >
                  {{ t('actions.completed') }}
                </button>
              </div>
              <div>
                <button
                  type="button"
                  :class="[$style.menuItem, $style.menuItemDanger]"
                  @click="openCancel"
                >
                  {{ t('actions.cancel_ellipsis') }}
                </button>
              </div>
            </PopoverPanel>
          </transition>
        </Popover>
        <NeedStatusModal
          v-model:show="showCompleteModal"
          mode="complete"
          :submitting="submitting"
          @submit="submitComplete"
        />
        <NeedStatusModal
          v-model:show="showCancelModal"
          mode="cancel"
          :submitting="submitting"
          @submit="submitCancel"
        />
      </div>
    </div>

    <template v-if="req">
      <div
        v-if="transferRefreshFailed"
        role="status"
        class="mb-4 flex flex-wrap items-center gap-3 rounded-lg bg-yellow-50 p-4 text-sm text-gray-700"
      >
        <p>{{ t('needs.check_transfer.refresh_error') }}</p>
        <CommonButton
          kind="white"
          size="sm"
          :disabled="isTransferRefreshing"
          @click="refreshAfterCheckTransfer"
        >
          {{ t('needs.check_transfer.refresh') }}
        </CommonButton>
      </div>
      <NeedChecksSummary
        :key="numericId"
        :requests="req.listing_requests"
        :is-seller="isSeller"
        :can-manage-checks="canManageChecks"
        :transferring="isTransferring || isTransferRefreshing"
        @transfer="openCheckTransfer"
      />
      <div
        v-if="req.status === 'cancelled'"
        :class="$style.reasonBlock"
      >
        <h3>{{ t("needs.detail.reason") }}</h3>
        <TranslatableWrapper
          v-if="req.cancellation_reason"
          :data="req"
          :config="{
            keys: {
              ru: 'cancellation_reason_ru',
              zh: 'cancellation_reason_zh',
              original: 'cancellation_reason_original_locale',
            },
          }"
          control-class="absolute top-0 right-0 z-10"
          class="relative pr-8"
        >
          <template #default="{ displayedText }">
            <p class="whitespace-pre-wrap break-words">
              {{ displayedText }}
            </p>
          </template>
        </TranslatableWrapper>
        <p
          v-else
          class="text-gray-500 italic"
        >
          {{ t("needs.detail.default_cancellation_reason") }}
        </p>
      </div>

      <div :class="$style.layout">
        <div :class="$style.leftColumn">
          <div :class="$style.basicSpecs">
            <div :class="$style.specRowNoBorder">
              <span :class="$style.specLabel">{{ t("needs.detail.created") }}</span>
              <span :class="$style.specValue">{{ formatDateTime(req.created_at || "", locale) }}</span>
            </div>
            <div
              v-if="req.changes?.length"
              :class="$style.specRowNoBorder"
            >
              <span :class="$style.specLabel">{{ t("needs.detail.history") }}</span>
              <span :class="$style.specValue">
                <template v-if="changeDates.length === 1">
                  {{ changeDates[0] }}
                </template>
                <ul
                  v-else
                  class="list-disc text-left space-y-2"
                >
                  <li
                    v-for="d in changeDates"
                    :key="d"
                  >{{ d }}</li>
                </ul>
              </span>
            </div>

            <div
              v-if="req.client_name"
              :class="$style.specRowNoBorder"
            >
              <span :class="$style.specLabel">{{ t("needs.detail.client_name") }}</span>
              <span :class="$style.specValue">
                <span
                  v-if="hasChangedField('client_name')"
                  :class="$style.changedValueInline"
                >
                  <span
                    v-if="getOldValue('client_name')"
                    :class="$style.oldValue"
                  >
                    {{ getOldValue('client_name') }}
                  </span>
                  <span :class="$style.newValue">
                    {{ req.client_name }}
                  </span>
                </span>
                <template v-else>
                  {{ req.client_name }}
                </template>
              </span>
            </div>
          </div>

          <div :class="$style.variantsSection">
            <NeedVariantDetailBlock
              v-for="variant in displayVariants"
              :key="variant.id || variant.priority"
              :variant="variant"
              :show-priority="displayVariants.length > 1"
            />
          </div>

          <div
            v-if="hasAnyTrims"
            :class="$style.compareRow"
          >
            <button
              type="button"
              :class="$style.compareButton"
              @click="router.push(`/personal/needs/${numericId}/trims`)"
            >
              {{ t('needs.detail.compare_trims') }}
              <ChevronRightIcon :class="$style.compareIcon" />
            </button>
          </div>
        </div>

        <div :class="$style.rightColumn">
          <div
            v-if="primaryImage"
            :class="$style.imageContainer"
          >
            <img
              :src="primaryImage"
              alt="Car image"
              :class="$style.carImage"
            >
            <div :class="[$style.imageOverlay, $style.imageBadge]">
              <LabelTooltip
                :icon="InfoLetterIcon"
                kind="gray"
                tooltip-text="needs.detail.car_example"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="mt-8">
        <div class="flex items-center gap-3 mb-4">
          <h2 :class="$style.proposalsTitle">
            {{ t("needs.detail.car_proposals") }}
          </h2>
          <Label
            v-if="isSeller"
            kind="yellow"
            :icon-left="ExclamationCircleIcon"
            icon-bold
          >
            <span>
              <strong>{{ t('needs.proposal_hint_strong') }}</strong>
              {{ t('needs.proposal_hint_text') }}
            </span>
          </Label>
        </div>
        <div
          v-if="isSeller"
          class="flex gap-2 mb-4"
        >
          <div :class="$style.buttonWrapper">
            <CommonButton
              kind="green"
              :disabled="isAddCarLocked"
              @click="!isAddCarLocked && router.push(addCarRoute)"
            >
              <PlusIcon class="w-5 h-5 mr-2" />
              {{ t('needs.add_car') }}
            </CommonButton>
            <div
              v-if="isAddCarLocked"
              :class="$style.tooltip"
            >
              {{ addCarLockedTooltip }}
            </div>
          </div>

          <div :class="$style.buttonWrapper">
            <!-- Locked: static button, no Popover — otherwise HeadlessUI still opens and hits API -->
            <template v-if="isAddCarLocked">
              <CommonButton
                kind="lightgrey"
                disabled
              >
                {{ t('needs.select_from_catalog') }}
                <ChevronDownIcon class="w-5 h-5 ml-2" />
              </CommonButton>
              <div :class="$style.tooltip">
                {{ addCarLockedTooltip }}
              </div>
            </template>
            <Popover
              v-else
              v-slot="{ close }"
              class="relative"
            >
              <PopoverButton as="template">
                <CommonButton kind="lightgrey">
                  {{ t('needs.select_from_catalog') }}
                  <ChevronDownIcon class="w-5 h-5 ml-2" />
                </CommonButton>
              </PopoverButton>
              <transition
                enter-active-class="transition duration-200 ease-out"
                enter-from-class="opacity-0 translate-y-1"
                enter-to-class="opacity-100 translate-y-0"
                leave-active-class="transition duration-150 ease-in"
                leave-from-class="opacity-100 translate-y-0"
                leave-to-class="opacity-0 translate-y-1"
              >
                <PopoverPanel :class="$style.popoverPanel">
                  <AddListingsDropdown
                    :request-id="numericId"
                    @saved="() => { handleListingsAdded(); close() }"
                    @preview="openPreviewModal"
                  />
                </PopoverPanel>
              </transition>
            </Popover>
          </div>
        </div>

        <section :class="[$style.proposals, proposals.length > 0 ? 'bg-white' : 'bg-[#f5f5f5]']">
          <div :class="$style.proposalsContent">
            <ProposalsList
              :proposals="proposals"
              :request-status="req.status"
              :listing-requests="req.listing_requests"
              :search-request-id="numericId"
              :find-more-requested="request?.find_more_requested || false"
              :buyer-id="request?.user_id"
              :is-seller="isSeller"
              :refresh-proposals="fetchProposals"
              @update:find-more-requested="handleFindMoreUpdate"
            />
          </div>
        </section>
      </div>
    </template>

    <CommonDataState
      :loading="isRequestPending"
      :has-data="!!req"
      :loading-text="t('needs.detail.loading')"
      :empty-text="t('needs.list.not_found')"
    />

    <ListingPreviewModal
      v-model:is-open="showPreviewModal"
      :listing="previewListing"
      :request-id="numericId"
      @saved="() => { handleListingsAdded(); showPreviewModal = false; }"
    />
    <NeedCheckTransferModal
      v-if="transferRequest"
      v-model:show="showCheckTransfer"
      :source-request-id="numericId"
      :request="transferRequest"
      :submitting="isTransferring"
      :alert="transferAlert"
      @confirm="submitCheckTransfer"
    />
  </div>
</template>

<script setup lang="ts">
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/vue"
import { PencilSquareIcon, CheckCircleIcon, ExclamationCircleIcon, ChatBubbleLeftEllipsisIcon } from "@heroicons/vue/24/outline"
import { ChevronDownIcon, PlusIcon, ChevronRightIcon } from "@heroicons/vue/24/solid"
import { computed, onMounted, ref } from "vue"
import { useI18n } from "vue-i18n"
import { useRoute, useRouter } from "vue-router"
import { storeToRefs } from "pinia"
import type { FetchError } from "ofetch"
import { formatDateTime } from "@/utils/formatters"
import { RequestStatusColorMap, RequestStatusDraft, RequestStatusOnBooking } from "@/constants/statuses"
import useSearchRequest from "@/composables/useSearchRequest"
import { useApiSearchRequests } from "@/composables/api/useApiSearchRequests"
import { useSearchRequestsRealtime } from "@/composables/useSearchRequestsRealtime"
import { hydrateVariantSpecs, legacyVariantFromRequest } from "@/composables/needs/useVariantSpecs"
import ToChat from "@/components/chat/ToChat.vue"
import Badge from "@/components/common/Badge.vue"
import { useUnreadCountStore } from "@/stores/unreadCount"
import ExecutorSelector from "@/components/needs/ExecutorSelector.vue"
import ProposalsList from "@/components/needs/ProposalsList.vue"
import NeedStatusModal from "@/components/needs/NeedStatusModal.vue"
import NeedChecksSummary from "@/components/needs/NeedChecksSummary.vue"
import NeedCheckTransferModal from "@/components/needs/NeedCheckTransferModal.vue"
import NeedVariantDetailBlock from "@/components/needs/NeedVariantDetailBlock.vue"
import AddListingsDropdown from "@/components/needs/AddListingsDropdown.vue"
import ListingPreviewModal from "@/components/needs/ListingPreviewModal.vue"
import InfoLetterIcon from "@/components/icon/InfoLetterIcon.vue"
import LabelTooltip from "@/components/common/LabelTooltip.vue"
import CommonButton from "@/components/common/Button.vue"
import TranslatableWrapper from "@/components/common/TranslatableWrapper.vue"
import type { SearchRequestDetail, SearchRequestListingRequest } from "~/types/responses/searchRequest"
import type { Proposal } from "@/types/responses/proposal"
import { AlertTypeEnum, type Alert as AlertData } from "@/types/common/alert"
import Label from "@/components/common/Label.vue"
import { RoleEmployee, RoleDirector, RoleAdmin, RoleSellerSearch, RoleSellerClient } from "~/constants/roles"
import { useUserStore } from "@/stores/user"

definePageMeta({
  auth: true,
  roles: [RoleEmployee, RoleDirector, RoleAdmin, RoleSellerSearch, RoleSellerClient],
  layout: "personal",
  hideTitle: true,
})

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const { isSellerSearch, isSellerClient, isAdmin } = storeToRefs(userStore)

const { getMatchingListings, transferListingRequest } = useApiSearchRequests()
const proposals = ref<Proposal[]>([])

const id = computed(() => String(route.params.id ?? ""))
const numericId = computed(() => Number(id.value))

const { show, updateStatus, acknowledgeChanges, hasUnacknowledgedChanges: checkHasUnacknowledgedChanges, duplicateRequest } = useSearchRequest()

const showCancelModal = ref(false)
const showCompleteModal = ref(false)
const submitting = ref(false)
const submittingAck = ref(false)
const duplicating = ref(false)
const showPreviewModal = ref(false)
const previewListing = ref<any>(null)

const isSeller = computed(() => {
  return isSellerSearch.value || isAdmin.value || isSellerClient.value
})

const request = ref<SearchRequestDetail | null>(null)
const req = computed(() => request.value)
const unreadStore = useUnreadCountStore()
const chatUnread = computed(
  () => unreadStore.getSearchRequestUnreadCount(numericId.value) ?? (request.value?.chat_unread ?? 0),
)
const canManageChecks = computed(() => req.value?.user_id === userStore.currentUserId)
const transferRequest = ref<SearchRequestListingRequest | null>(null)
const transferAlert = ref<AlertData | null>(null)
const isTransferring = ref(false)
const isTransferRefreshing = ref(false)
const transferRefreshFailed = ref(false)
const showCheckTransfer = computed({
  get: () => transferRequest.value !== null,
  set: (value) => {
    if (!value && !isTransferring.value) {
      transferRequest.value = null
      transferAlert.value = null
    }
  },
})

const isLoadingRequest = ref(false)
const hasFetchedRequest = ref(false)
const isRequestPending = computed(() => !hasFetchedRequest.value || isLoadingRequest.value)

const requestVariants = computed(() => {
  const list = (req.value as any)?.variants
  if (Array.isArray(list) && list.length) {
    return [...list].sort((a: any, b: any) => (a.priority ?? 0) - (b.priority ?? 0))
  }
  return []
})

const displayVariants = computed(() => {
  if (requestVariants.value.length) {
    return requestVariants.value
  }
  if (req.value) {
    return [legacyVariantFromRequest(req.value)]
  }
  return []
})

const hasAnyTrims = computed(() =>
  displayVariants.value.some(v => (v.cars?.length ?? 0) > 0),
)

const primaryImage = computed(() => {
  const first = displayVariants.value[0]
  if (!first) {
    return null
  }
  return hydrateVariantSpecs(first.cars).primaryImage
})

const handleDuplicate = async () => {
  if (!req.value?.id) {
    return
  }
  duplicating.value = true
  try {
    const newId = await duplicateRequest(req.value.id)
    if (newId) {
      router.push(`/personal/needs/${newId}/edit`)
    }
  }
  finally {
    duplicating.value = false
  }
}

const openPreviewModal = (listing: any) => {
  previewListing.value = listing
  showPreviewModal.value = true
}

const handleListingsAdded = () => {
  fetchProposals()
}

const isLocked = computed(() => {
  const s = req.value?.status
  return s === "completed" || s === "cancelled"
})
const isBookingPaused = computed(() => req.value?.status === RequestStatusOnBooking)

watch([isLocked, isBookingPaused], ([locked, paused]) => {
  if (locked || paused) {
    showCompleteModal.value = false
    showCancelModal.value = false
  }
})

const canOpenChat = computed(() => {
  return Boolean(req.value) && reqStatus.value !== RequestStatusDraft
})

const hasUnacknowledgedChanges = computed(() => {
  if (!isSeller.value || !request.value) {
    return false
  }
  return checkHasUnacknowledgedChanges(request.value)
})

const isAddCarLocked = computed(() => {
  return reqStatus.value !== "in_work" || hasUnacknowledgedChanges.value
})

const addCarLockedTooltip = computed(() => {
  if (isBookingPaused.value) {
    return t("needs.booking_action_blocked")
  }
  if (reqStatus.value !== "in_work") {
    return t("needs.add_car_locked")
  }
  if (hasUnacknowledgedChanges.value) {
    return t("needs.form.edit_pending_changes_tooltip")
  }
  return t("needs.add_car_locked")
})

const hasPendingChanges = computed(() => {
  if (!req.value) {
    return false
  }
  const changedAt = req.value.changed_at
  const acknowledgedAt = req.value.acknowledged_at

  if (req.value.status === RequestStatusDraft) {
    return false
  }
  if (!changedAt) {
    return false
  }
  if (!acknowledgedAt) {
    return true
  }
  return new Date(changedAt) > new Date(acknowledgedAt)
})

const addCarRoute = computed(() => ({
  path: "/personal/listings/0",
  query: {
    from_request: numericId.value,
    brand_id: req.value?.brand?.id,
    series_id: req.value?.series?.id,
  },
}))

const lastChange = computed(() => {
  const changes = req.value?.changes || []
  return changes.length > 0 ? changes[0] : null
})

const hasChangedField = (field: string) => {
  if (!isSeller.value) {
    return false
  }
  if (!hasUnacknowledgedChanges.value || !lastChange.value) {
    return false
  }
  const before = lastChange.value.payload?.before
  const after = lastChange.value.payload?.after
  if (!before && !after) {
    return false
  }
  if (field in (before || {}) || field in (after || {})) {
    return before?.[field] !== after?.[field]
  }
  return false
}

const getOldValue = (field: string) => {
  if (!lastChange.value) {
    return null
  }
  return lastChange.value.payload?.before?.[field] ?? null
}

async function handleAcknowledge() {
  submittingAck.value = true
  try {
    const success = await acknowledgeChanges(numericId.value)
    if (success) {
      await fetchSearchRequest()
    }
  }
  finally {
    submittingAck.value = false
  }
}

async function submitCancel(payload: { reason?: string }) {
  if (isLocked.value || isBookingPaused.value || submitting.value) {
    return
  }
  submitting.value = true
  try {
    const success = await updateStatus(numericId.value, "cancelled", { cancellation_reason: payload.reason })
    if (success) {
      await router.push({ name: "personal-needs" })
    }
  }
  finally {
    submitting.value = false
  }
}

async function submitComplete() {
  if (isLocked.value || isBookingPaused.value || submitting.value) {
    return
  }
  submitting.value = true
  try {
    const success = await updateStatus(numericId.value, "completed", {})
    if (success) {
      await router.push({ name: "personal-needs" })
    }
  }
  finally {
    submitting.value = false
  }
}

function openComplete() {
  if (isLocked.value || isBookingPaused.value) {
    return
  }
  showCompleteModal.value = true
}
function openCancel() {
  if (isLocked.value || isBookingPaused.value) {
    return
  }
  showCancelModal.value = true
}

const changeDates = computed<string[]>(() => {
  const list = req.value?.changes || []
  return list.map((c: any) => formatDateTime(c.changed_at, locale.value))
})

const reqStatus = computed(() => req.value ? req.value.status : "new")

function openCheckTransfer(check: SearchRequestListingRequest) {
  if (!canManageChecks.value || !check.can_transfer || isTransferring.value || isTransferRefreshing.value) {
    return
  }
  transferAlert.value = null
  transferRequest.value = check
}

async function submitCheckTransfer(targetSearchRequestId: number) {
  const check = transferRequest.value
  if (!check?.can_transfer || !canManageChecks.value || isTransferring.value) {
    return
  }
  const sourceId = numericId.value
  isTransferring.value = true
  transferAlert.value = null
  try {
    await transferListingRequest(sourceId, check.id, targetSearchRequestId)
  }
  catch (error) {
    const response = (error as FetchError<{ message?: string, errors?: Record<string, string[]> }>).data
    transferAlert.value = {
      type: AlertTypeEnum.Error,
      subtitle: t("needs.check_transfer.error"),
      text: response?.errors?.target_search_request_id?.[0] || response?.message || t("error.base.generic"),
    }
    return
  }
  finally {
    isTransferring.value = false
  }

  transferRequest.value = null
  if (request.value?.id === sourceId) {
    request.value.listing_requests = request.value.listing_requests.filter(item => item.id !== check.id)
    await refreshAfterCheckTransfer()
  }
}

async function refreshAfterCheckTransfer() {
  if (isTransferRefreshing.value) {
    return
  }
  isTransferRefreshing.value = true
  try {
    transferRefreshFailed.value = !await fetchSearchRequest()
  }
  finally {
    isTransferRefreshing.value = false
  }
}

let requestLoadVersion = 0

async function fetchSearchRequest(): Promise<boolean> {
  const version = ++requestLoadVersion
  const sourceId = numericId.value
  isLoadingRequest.value = true
  try {
    const data = await show(sourceId)
    if (!data) {
      return false
    }
    if (version === requestLoadVersion && numericId.value === sourceId) {
      request.value = data
    }
    return true
  }
  catch (e) {
    console.error(e)
    return false
  }
  finally {
    if (version === requestLoadVersion) {
      isLoadingRequest.value = false
    }
  }
}

let proposalsLoadVersion = 0

async function fetchProposals() {
  const version = ++proposalsLoadVersion
  const sourceId = numericId.value
  try {
    const response = await getMatchingListings(sourceId) as any
    if (version === proposalsLoadVersion && numericId.value === sourceId) {
      proposals.value = response?.data || []
    }
  }
  catch (error) {
    console.error("Error fetching proposals:", error)
  }
}

function handleFindMoreUpdate(value: boolean) {
  if (request.value) {
    request.value.find_more_requested = value
  }
}

useSearchRequestsRealtime(
  () => {
    fetchSearchRequest()
    fetchProposals()
  },
  () => numericId.value,
  fetchProposals,
)

onMounted(async () => {
  try {
    await fetchSearchRequest()
    await fetchProposals()
  }
  finally {
    hasFetchedRequest.value = true
  }
})

const handleEdit = () => {
  if (hasPendingChanges.value) {
    return
  }
  router.push(`/personal/needs/${numericId.value}/edit`)
}
</script>

<style module>
.topBlock {
  @apply flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6;
}

.title {
  @apply text-3xl font-bold leading-tight mb-2;
}

.statusRow {
  @apply flex flex-wrap items-center gap-4 mt-2;
}

.actions {
  @apply flex gap-3 flex-shrink-0;
}

.button {
  @apply min-w-32;
}

.buttonWrapper {
  @apply relative;
}

.buttonWrapper:hover .tooltip {
  @apply opacity-100 visible;
}

.tooltip {
  @apply absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 invisible transition-opacity duration-200 z-50;
}

.tooltip::after {
  content: '';
  @apply absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900;
}

.layout {
  @apply flex flex-col lg:flex-row gap-8 bg-white border border-gray-200 rounded-xl p-6 mb-4;
}

.leftColumn {
  @apply w-full lg:flex-1;
}

.variantsSection {
  @apply mt-4;
}

.rightColumn {
  @apply w-full lg:flex-none;
}

@media (min-width:1024px) {
  .rightColumn {
    width: 322px;
  }
}

.reasonBlock {
  @apply bg-white border border-gray-200 rounded-xl p-4 mb-6;
}

.reasonBlock h3 {
  @apply text-xl font-bold mb-6;
}

.reasonBlock p {
  @apply text-gray-900;
}

.proposals {
  @apply border border-gray-200 rounded-xl p-6;
}

.proposalsTitle {
  @apply text-2xl font-bold mb-1;
}

.proposalsContent {
  @apply min-h-32;
}

.basicSpecs {
  @apply space-y-3;
}

.specRowNoBorder,
.specRow {
  @apply grid grid-cols-1 sm:grid-cols-2 sm:items-start sm:gap-x-8 py-2;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.specLabel {
  @apply text-gray-600 font-medium mb-1 sm:mb-0 text-left;
}

.specValue {
  @apply text-gray-900 text-left break-words;
}

.imageContainer {
  @apply relative p-4 lg:flex lg:justify-end;
}

.carImage {
  @apply w-full h-auto max-w-full lg:max-w-[322px] object-cover;
}

.imageOverlay {
  @apply absolute left-7 bottom-7 z-10;
}

.imageBadge :global(.labelOverlay) {
  width: 22px;
  height: 20px;
  border-radius: 9999px;
  background-color: #f5f5f5;
}

.imageBadge :global(.labelIcon) {
  width: 15px;
  height: 15px;
}

.arrowIcon {
  @apply w-4 h-4 ml-2;
}

.relativeBlock {
  @apply relative;
}

.chatMenuPanel {
  @apply absolute top-full z-50 mt-2 w-40 rounded-xl bg-white p-2 shadow-lg ring-1 ring-gray-900/5 right-0 md:left-auto md:right-0 left-0 right-auto;
}

.menuItem {
  @apply w-full text-left px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 rounded transition;
}

.menuItemDanger {
  @apply text-red-600;
}

.changedValueInline {
  @apply flex flex-col gap-2 items-start;
}

.oldValue {
  @apply line-through text-gray-400;
}

.newValue {
  @apply bg-green-100 text-green-800 px-2 py-1 rounded inline-block;
}

.popoverPanel {
  @apply absolute right-0 md:left-0 md:right-auto z-50 mt-2 bg-white shadow-xl ring-1 ring-black/5 rounded-xl origin-top w-[340px] sm:w-[450px] md:w-[800px] max-w-[calc(100vw-32px)]
}

.compareRow {
  @apply pt-4 mt-2;
}

.compareButton {
  @apply inline-flex items-center gap-1 text-base text-red-600 hover:text-red-800 transition-colors;
}

.compareIcon {
  @apply w-4 h-4;
}
</style>
