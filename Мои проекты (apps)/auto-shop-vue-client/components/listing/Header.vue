<template>
  <div>
    <div v-if="showBackButton">
      <Button
        kind="white"
        :class="$style.backBtn"
        @click="goBack"
      >
        <ArrowLeftIcon class="w-5 h-5 mr-2" />
        {{ t("listing.back_to_events") }}
      </Button>
    </div>
  </div>
  <div :class="$style.topBlock">
    <h1 :class="$style.title">
      {{ t("listing.title") }}
    </h1>
    <div
      v-if="!isNew && !isLogist"
      :class="$style.actions"
    >
      <NuxtLink
        :to="{ name: 'catalog-id', params: { id } }"
        :class="$style.viewCarLink"
      >
        {{ t("listing.view_car_page") }}
        <ArrowUpRightIcon class="w-4 h-4 ml-1" />
      </NuxtLink>
      <ToChat
        type="admin"
        :user-id="currentUserId ?? undefined"
      >
        <template #default="{ chatLoading, clickDisabled, goToChat }">
          <Button
            type="button"
            kind="white"
            :class="$style.actionBtn"
            :disabled="clickDisabled"
            :aria-busy="chatLoading || undefined"
            @click.stop.prevent="goToChat"
          >
            <ChatBubbleOvalLeftIcon class="w-5 h-5 mr-2" />
            {{ t("listing.chat_with_admin") }}
          </Button>
        </template>
      </ToChat>
      <Popover
        v-if="!isSellerContent"
        v-slot="{ open }"
        :class="$style.relativeBlock"
      >
        <PopoverButton as="template">
          <Button
            kind="white"
            :class="$style.actionBtn"
            @click="loadRequestData"
          >
            {{ t("listing.add_to_request") }}
            <ChevronDownIcon class="w-4 h-4 ml-2" />
          </Button>
        </PopoverButton>
        <transition
          enter-active-class="transition ease-out duration-200"
          enter-from-class="opacity-0 translate-y-1"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition ease-in duration-150"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 translate-y-1"
        >
          <PopoverPanel
            v-if="open"
            :class="$style.menuPanel"
          >
            <SearchableSelect
              v-model="selectedInfoRequest"
              :options="requestOptions"
              :placeholder="t('listing.request_placeholder')"
              class="mb-2"
              :multiple="true"
              :disabled="isLoadingRequests || isSavingRequests || !hasLoadedBindings"
            />
            <Button
              kind="black"
              :class="$style.addRequestBtn"
              :disabled="isLoadingRequests || isSavingRequests || !hasLoadedBindings"
              @click="handleSaveRequests"
            >
              {{ isSavingRequests ? t("common.saving") : t("listing.add") }}
            </Button>
          </PopoverPanel>
        </transition>
      </Popover>
      <ShareLinkPopover
        :loading="isGeneratingLink"
        :last-generated-share="lastGeneratedShare"
        :link-duration-options="linkDurationOptions"
        @generate="handleGenerateLink"
      />

      <Button
        v-if="canWithdraw"
        type="button"
        kind="white"
        :class="[$style.actionBtn, $style.withdrawBtn]"
        :disabled="isActionLoading"
        @click="confirmWithdrawOpen = true"
      >
        <EyeSlashIcon class="w-4 h-4 mr-2" />
        {{ t("catalog.actions.withdraw") }}
      </Button>

      <Button
        v-if="canReturnToSale"
        type="button"
        kind="white"
        :class="[$style.actionBtn, $style.withdrawBtn]"
        :disabled="isActionLoading"
        @click="isReturnToSaleModalOpen = true"
      >
        <ArrowPathIcon class="w-4 h-4 mr-2" />
        {{ t("catalog.actions.return_to_sale") }}
      </Button>

      <Button
        v-if="canDelete"
        type="button"
        kind="white"
        :class="[$style.actionBtn, $style.deleteBtn]"
        :disabled="isActionLoading"
        @click="confirmDeleteOpen = true"
      >
        <TrashIcon class="w-4 h-4 mr-2" />
        {{ t("catalog.actions.delete") }}
      </Button>
    </div>
  </div>

  <ModalConfirm
    :is-open="confirmWithdrawOpen"
    :title="t('listing.withdraw_confirm_title')"
    :description="t('listing.withdraw_confirm_description')"
    :confirm-text="t('catalog.actions.withdraw')"
    confirm-kind="primary"
    @close="confirmWithdrawOpen = false"
    @confirm="handleWithdraw"
  />

  <ModalConfirm
    :is-open="confirmDeleteOpen"
    :title="t('listing.delete_confirm_title')"
    :description="t('listing.delete_confirm_description')"
    :confirm-text="t('catalog.actions.delete')"
    confirm-kind="primary"
    @close="confirmDeleteOpen = false"
    @confirm="handleDelete"
  />

  <ReturnToSaleModal
    :is-open="isReturnToSaleModalOpen"
    :listing-id="numericListingId"
    @close="isReturnToSaleModalOpen = false"
    @success="handleReturnToSaleSuccess"
  />

  <div
    v-if="!isNew && isWithdrawn"
    :class="$style.withdrawnNotice"
  >
    {{ t("listing.withdrawn_notice") }}
  </div>

  <div
    v-if="!isNew"
    :class="$style.carCard"
  >
    <CarPreviewImage
      :src="listing?.thumb || listing?.image"
      :fallback-src="listing?.image"
      :alt="carName"
      :image-class="$style.carImage"
    />
    <div :class="$style.carInfo">
      <NuxtLink
        :to="{ name: 'personal-listings-id', params: { id } }"
        :class="$style.carName"
      >
        {{ carName }}
      </NuxtLink>
      <p :class="$style.carParams">
        {{ carParams }}
      </p>
    </div>
  </div>

  <div
    v-if="!isNew"
    :class="$style.menuTabs"
  >
    <div
      v-for="tab in visibleMenuTabs"
      :key="tab.route"
      :class="[
        $style.menuTabWrapper,
        $route.name === tab.route
          ? $style.menuTabWrapperActive
          : $style.menuTabWrapperInactive,
      ]"
    >
      <NuxtLink
        :to="{ name: tab.route, params: { id }, query: tab.query }"
        :class="$style.menuTab"
      >
        <template v-if="tab.label === 'listing.menu_tabs_chat'">
          {{ t("listing.chats_tab") }}
          <ArrowUpRightIcon
            class="w-4 h-4 inline-block ml-1 align-text-bottom"
          />
        </template>
        <template v-else-if="tab.label === 'listing.menu_tabs_video'">
          {{ t(tab.label) }} ({{ totals?.total_video || 0 }})
        </template>
        <template v-else-if="tab.label === 'listing.menu_tabs_diagnostic'">
          {{ t(tab.label) }} ({{ totals?.total_diagnostic || 0 }})
        </template>
        <template v-else-if="tab.label === 'listing.menu_tabs_compensation'">
          {{ t(tab.label) }} ({{ totals?.total_compensation || 0 }})
        </template>
        <template v-else-if="tab.label === 'listing.menu_tabs_booking'">
          {{ t(tab.label) }} ({{ totals?.total_booking || 0 }})
        </template>
        <template v-else>
          {{ t(tab.label) }}
        </template>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue"
import { storeToRefs } from "pinia"
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/vue"
import { ArrowUpRightIcon, ChatBubbleOvalLeftIcon, ChevronDownIcon, ArrowLeftIcon, EyeSlashIcon, TrashIcon, ArrowPathIcon } from "@heroicons/vue/24/outline"
import { useI18n } from "vue-i18n"
import { useRoute } from "vue-router"
import { toInteger } from "lodash"
import ToChat from "@/components/chat/ToChat.vue"
import ShareLinkPopover from "@/components/catalog/ShareLinkPopover.vue"
import { useUserStore } from "@/stores/user"
import { useNotificationsStore } from "@/stores/notifications"
import Button from "@/components/common/Button.vue"
import SearchableSelect from "@/components/form/SearchableSelect.vue"
import ModalConfirm from "@/components/reviews/ModalConfirm.vue"
import ReturnToSaleModal from "@/components/listing/ReturnToSaleModal.vue"
import CarPreviewImage from "@/components/common/CarPreviewImage.vue"
import type { Alert } from "@/types/common/alert"
import { useSharedLink } from "@/composables/useSharedLink"
import { useListingData } from "@/composables/useListingData"
import useListing from "@/composables/useListing"
import { useListingRequestSelection } from "@/composables/useListingRequestSelection"
import type { OptionBase } from "@/types/form/optionType"
import { useApiListing } from "@/composables/api/useApiListing"
import { useListingRequestStore } from "@/stores/listingRequest"
import type { Listing } from "@/types/responses/listing"
import { SaleStatusWithdrawn } from "@/constants/catalog"

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const userStore = useUserStore()
const { currentUserId, isAdmin, isLogist, isSellerContent, isSellerSearch, isSellerClient, isAnySeller } = storeToRefs(userStore)
const { successNotify, errorNotify } = useNotificationsStore()
const { withdraw, destroy } = useApiListing()

const id = route.params.id as string
const listingId = computed(() => route.params.id as string)

const showBackButton = computed(() => {
  return route.query.from === "events"
})

const goBack = () => {
  if (document.referrer && document.referrer.includes(window.location.hostname)) {
    window.history.back()
  }
  else {
    router.push({ name: "personal-events" })
  }
}

const numericListingId = computed(() => {
  return Number(id)
})

const isNew = computed(() => id === "0")
const { listing, totals, fetchListingData } = useListingData(toInteger(id))
const listingRequestStore = useListingRequestStore()
const { isGeneratingLink, lastGeneratedShare, linkDurationOptions, handleGenerateLink } = useSharedLink(numericListingId.value)

const allMenuTabs = [
  { label: "listing.menu_tabs_auto", route: "personal-listings-id" },
  { label: "listing.menu_tabs_video", route: "personal-listings-id-video" },
  { label: "listing.menu_tabs_diagnostic", route: "personal-listings-id-diagnostic" },
  { label: "listing.menu_tabs_compensation", route: "personal-listings-id-compensation" },
  { label: "listing.menu_tabs_booking", route: "personal-listings-id-booking" },
  {
    label: "listing.menu_tabs_chat",
    route: "personal-chats",
    query: { listingId: id },
  },
].map(tab => ({
  ...tab,
  query: {
    ...(tab.query || {}),
    ...(route.query.from === "events" ? { from: "events" } : {}),
  },
}))

const visibleMenuTabs = computed(() => {
  if (isLogist.value || isSellerContent.value) {
    return [allMenuTabs[0]]
  }
  if (isSellerSearch.value) {
    return allMenuTabs.filter(tab =>
      tab.route === "personal-listings-id"
      || tab.route === "personal-listings-id-video",
    )
  }
  return allMenuTabs
})

const {
  loadOpenRequests,
  requestOptions,
  bindListingToRequests,
  show,
  isSavingRequests,
} = useListing()

const requestSelection = ref<OptionBase[]>([])
const { selectedRequests: selectedInfoRequest, initialize: initializeRequestSelection } = useListingRequestSelection(requestOptions, requestSelection)
const isLoadingRequests = ref(false)
const hasLoadedBindings = ref(false)

const loadRequestData = async () => {
  if (isNew.value) {
    return
  }

  isLoadingRequests.value = true
  hasLoadedBindings.value = false
  try {
    if (!await loadOpenRequests()) {
      errorNotify(t("needs.action_error"))
      return
    }

    const listing = await show(numericListingId.value) as Listing
    if (!listing) {
      errorNotify(t("needs.action_error"))
      return
    }
    initializeRequestSelection(listing.search_requests ?? [])
    hasLoadedBindings.value = true
  }
  catch (e) {
    console.error(e)
  }
  finally {
    isLoadingRequests.value = false
  }
}

const handleSaveRequests = async () => {
  if (isNew.value || !hasLoadedBindings.value || isSavingRequests.value) {
    return
  }

  const requestIds = selectedInfoRequest.value.map(r => Number(r.value))
  if (!await bindListingToRequests(numericListingId.value, requestIds)) {
    errorNotify(t("needs.action_error"))
  }
}

const carName = computed(() => {
  return listing.value?.name || ""
})

const carParams = computed(() => {
  if (!listing.value) {
    return ""
  }

  const params = []

  if (listing.value.engine) {
    params.push(`${listing.value.engine} ${t("listing_request.engine_unit")}`)
  }

  if (listing.value.year) {
    params.push(`${listing.value.year} ${t("listing_request.year_unit")}`)
  }

  if (listing.value.mileage) {
    params.push(`${listing.value.mileage.toLocaleString()} ${t("listing_request.mileage_unit")}`)
  }

  return params.join(", ")
})

const isWithdrawn = computed(() => listing.value?.sale_status === SaleStatusWithdrawn)

const isOwnListing = computed(() => {
  if (!listing.value || currentUserId.value == null) {
    return false
  }
  return listing.value.user_id === currentUserId.value
    || listing.value.created_by === currentUserId.value
})

const canWithdraw = computed(() => {
  if (isNew.value || isLogist.value || isWithdrawn.value || listing.value?.sale_status) {
    return false
  }
  if (isAdmin.value) {
    return true
  }
  if (!isAnySeller.value) {
    return false
  }
  if (isSellerClient.value || isSellerContent.value) {
    return true
  }
  if (isSellerSearch.value) {
    return isOwnListing.value
  }
  return isOwnListing.value
})

const canReturnToSale = computed(() => {
  if (isNew.value || isLogist.value || !isWithdrawn.value) {
    return false
  }
  if (isAdmin.value) {
    return true
  }
  if (!isAnySeller.value) {
    return false
  }
  if (isSellerClient.value || isSellerContent.value) {
    return true
  }
  if (isSellerSearch.value) {
    return isOwnListing.value
  }
  return isOwnListing.value
})

const canDelete = computed(() => {
  return !isNew.value && !isLogist.value && isAdmin.value
})

const confirmWithdrawOpen = ref(false)
const confirmDeleteOpen = ref(false)
const isReturnToSaleModalOpen = ref(false)
const isActionLoading = ref(false)

const handleWithdraw = async () => {
  if (!canWithdraw.value || isActionLoading.value) {
    return
  }
  isActionLoading.value = true
  confirmWithdrawOpen.value = false
  try {
    await withdraw(numericListingId.value)
    successNotify(t("notification.listing.withdrawn"))
    listingRequestStore.lastFetched = null
    await fetchListingData()
  }
  catch (e) {
    console.error(e)
    errorNotify(t("notification.response_status.forbidden"))
  }
  finally {
    isActionLoading.value = false
  }
}

const handleReturnToSaleSuccess = async () => {
  listingRequestStore.lastFetched = null
  await fetchListingData()
}

const handleDelete = async () => {
  if (!canDelete.value || isActionLoading.value) {
    return
  }
  isActionLoading.value = true
  confirmDeleteOpen.value = false
  try {
    await destroy(numericListingId.value)
    successNotify(t("notification.listing.deleted"))
    await navigateTo({ name: "personal-listings" })
  }
  catch (e) {
    console.error(e)
    errorNotify(t("notification.response_status.forbidden"))
  }
  finally {
    isActionLoading.value = false
  }
}

defineEmits<{
  (e: "update:activeTab", value: number): void
  (e: "update:alert", value: Alert | null): void
}>()

const loadListingData = async () => {
  if (!isNew.value) {
    await fetchListingData()
  }
}
onMounted(loadListingData)

watch(listingId, loadListingData)
</script>

<style module>
.topBlock {
  @apply flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-6 w-full;
}

.backBtn {
  @apply flex items-center whitespace-nowrap mb-2;
}

.title {
  @apply text-3xl font-extrabold shrink-0;
}

.actions {
  @apply flex min-w-0 w-full sm:w-3/4 sm:ml-auto flex-row flex-wrap items-center justify-start sm:justify-end gap-2 sm:gap-3;
}

.actionBtn {
  @apply whitespace-nowrap flex items-center;
}

.withdrawBtn {
  @apply hover:border-amber-500 hover:text-amber-600;
}

.deleteBtn {
  @apply text-red-600 hover:border-red-500 hover:text-red-700;
}

.viewCarLink {
  @apply text-blue text-sm font-medium whitespace-nowrap no-underline flex items-center;
}

.relativeBlock {
  @apply relative;
}

.menuPanel {
  @apply absolute top-full z-50 mt-2 w-96 rounded-xl bg-white p-2 shadow-lg ring-1 ring-gray-900/5 right-0 sm:w-80;
}

.addRequestBtn {
  @apply mt-2 whitespace-nowrap flex items-center;
}

.withdrawnNotice {
  @apply flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 mb-4 text-sm font-medium;
}

.carCard {
  @apply flex items-center gap-4 mb-4;
}

.carImage {
  @apply h-[74px] w-[110px] shrink-0 rounded-[9px] border border-gray-200 object-cover;
}

.carInfo {
  @apply min-w-0 flex flex-col;
}

.carName {
  @apply block truncate text-lg font-semibold text-blue-600 hover:text-blue-700;
}

.carParams {
  @apply mt-1 text-sm text-gray-500;
}

.menuTabs {
  @apply flex flex-row flex-wrap items-center gap-x-6 gap-y-1 border-b border-gray-200 mb-4;
}

.menuTabWrapper {
  @apply -mb-px border-b-2 pb-2.5 pt-1;
}

.menuTabWrapperActive {
  @apply border-b-black;
}

.menuTabWrapperInactive {
  @apply border-b-transparent;
}

.menuTab {
  @apply text-sm font-medium whitespace-nowrap p-0 border-b-0 bg-transparent outline-none transition-colors duration-150 text-gray-500 hover:text-gray-900;
}

.menuTabWrapperActive .menuTab {
  @apply text-black font-semibold;
}
</style>
