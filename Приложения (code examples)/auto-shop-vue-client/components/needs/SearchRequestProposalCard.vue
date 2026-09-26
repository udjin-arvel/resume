<template>
  <div :class="[$style.carBlock, isUnavailable ? $style.carBlockUnavailable : '']">
    <div class="w-full md:w-[240px] lg:w-[200px] md:flex-none">
      <div :class="$style.imgWrapper">
        <div
          ref="sliderRef"
          class="keen-slider"
          :class="$style.slider"
          @mousemove="handleMouseMove"
          @mouseleave="handleMouseLeave"
        >
          <div
            v-for="(img, idx) in displayImages"
            :key="img"
            class="keen-slider__slide"
            :class="[$style.slide, hasPhotos ? $style.slideZoom : '']"
            @click="hasPhotos && openFullscreen(idx)"
          >
            <img
              :src="img"
              :alt="listing.name"
              :class="$style.carImage"
              @load="onImageLoad"
            >
          </div>

          <div
            v-if="hasPhotos && displayImages.length > 1"
            :class="$style.stripes"
          >
            <button
              v-for="(img, idx) in displayImages"
              :key="idx"
              :class="[
                $style.stripe,
                currentSlide === idx ? $style.stripeActive : '',
              ]"
              :aria-label="t('common.go_to_slide')"
              type="button"
              @click.stop.prevent="goToSlide(idx)"
            />
          </div>
        </div>

        <transition name="fade">
          <div
            v-if="fullscreen.active"
            :class="$style.fullscreenOverlay"
            @click.self="closeFullscreen"
          >
            <Button
              kind="unset"
              size="unset"
              :class="$style.fullscreenClose"
              :aria-label="t('common.close')"
              @click="closeFullscreen"
            >
              <XMarkIcon :class="$style.fullscreenCloseIcon" />
            </Button>

            <Button
              kind="unset"
              size="unset"
              :class="$style.fullscreenArrowLeft"
              :aria-label="t('common.previous')"
              @click.stop="fullscreenPrev"
            >
              <ChevronLeftIcon :class="$style.sliderArrowIcon" />
            </Button>

            <Button
              kind="unset"
              size="unset"
              :class="$style.fullscreenArrowRight"
              :aria-label="t('common.next')"
              @click.stop="fullscreenNext"
            >
              <ChevronRightIcon :class="$style.sliderArrowIcon" />
            </Button>

            <img
              :src="fullscreenImages[fullscreen.idx]"
              :alt="listing.name"
              :class="$style.fullscreenImg"
            >
          </div>
        </transition>
      </div>
    </div>
    <div class="w-full md:flex-1 min-w-0 flex flex-col gap-2 justify-start">
      <div class="flex items-start justify-between gap-3">
        <NuxtLink
          :to="
            isSeller
              ? `/personal/listings/${listing.id}`
              : `/catalog/${listing.id}`
          "
          class="text-lg font-semibold text-blue-600 hover:underline mb-1 min-w-0"
        >
          {{ listing.name }}
        </NuxtLink>

        <div class="flex flex-col items-end gap-2">
          <div class="flex items-center gap-4">
            <div class="text-xl font-bold whitespace-nowrap">
              {{ formattedPrice }} <span>¥</span>
            </div>

            <ToChat
              type="listing"
              :listing-id="listing.id"
              :buyer-id="buyerId"
              :seller-id="listing.user_id"
            >
              <template #default="{ chatLoading, clickDisabled, goToChat }">
                <Button
                  kind="lightgrey"
                  :disabled="clickDisabled"
                  :aria-busy="chatLoading || undefined"
                  class="whitespace-nowrap"
                  @click="goToChat"
                >
                  <ChatBubbleOvalLeftIcon class="w-5 h-5 mr-2" />
                  <span v-if="chatLoading">{{ t("common.loading") }}</span>
                  <span v-else>{{ chatButtonText }}</span>
                </Button>
              </template>
            </ToChat>
          </div>

          <div
            v-if="!isSeller && proposalStatus === 'pending'"
            class="flex flex-col items-end gap-1"
          >
            <Button
              kind="lightgrey"
              :disabled="hasPendingBooking"
              :aria-describedby="hasPendingBooking ? `booking-reject-${listing.id}` : undefined"
              @click="!hasPendingBooking && (showRejectModal = true)"
            >
              {{ t("needs.not_suitable") }}
            </Button>
            <p
              v-if="hasPendingBooking"
              :id="`booking-reject-${listing.id}`"
              class="max-w-60 text-right text-xs text-gray-500"
            >
              {{ t('needs.booking_action_blocked') }}
            </p>
          </div>
        </div>
      </div>
      <div class="text-gray-500 text-sm">
        {{ description }}
      </div>
      <div class="flex gap-2 mt-2 mb-3">
        <LabelTooltip
          v-if="hasVideos"
          :icon="PlayIconOutline"
          :tooltip-text="t('common.has_video')"
          kind="gray"
        />
        <LabelTooltip
          v-if="hasDiagnostics"
          :icon="Activity"
          :tooltip-text="t('common.has_diagnostics')"
          kind="gray"
        />
        <LabelTooltip
          v-if="listing.original_paint"
          :icon="PaintBucket"
          :tooltip-text="t('common.original_paint')"
          kind="gray"
        />
      </div>
      <div class="flex flex-wrap gap-1.5 mb-3">
        <Label
          v-if="listing.sale_status === SaleStatusSold"
          :text="t('catalog.list.sold')"
          kind="red"
        />
        <Label
          v-else-if="listing.sale_status === SaleStatusWithdrawn"
          :text="t('catalog.list.withdrawn')"
          kind="red"
        />
        <Label
          v-else-if="listing.sale_status === SaleStatusBooked"
          :text="t('catalog.list.booked')"
          kind="red"
        />
        <Label
          v-if="source === 'auto'"
          :tooltip-text="t('needs.auto_matched_tooltip')"
          :text="t('needs.auto_matched')"
          kind="yellow"
        />
        <template v-if="isSeller">
          <Label
            v-if="proposalStatus === 'accepted'"
            :text="t('catalog.common.booking_confirmed')"
            kind="green"
          />
          <Label
            v-if="listing.total_booking && listing.total_booking > 0"
            :text="`${t('catalog.common.booking_requested')} (${listing.total_booking})`"
            kind="gray"
          />
          <Label
            v-if="listing.total_diagnostic && listing.total_diagnostic > 0"
            :text="`${t('catalog.common.diagnostic_requested')} (${listing.total_diagnostic})`"
            kind="gray"
          />
          <Label
            v-if="listing.total_compensation && listing.total_compensation > 0"
            :text="`${t('catalog.common.compensation_requested')} (${listing.total_compensation})`"
            kind="gray"
          />
          <Label
            v-if="listing.total_video && listing.total_video > 0"
            :text="`${t('catalog.common.video_requested')} (${listing.total_video})`"
            kind="gray"
          />
        </template>

        <template v-else>
          <Label
            v-if="listing.booking_requested"
            :text="t('catalog.common.booking_requested')"
            kind="gray"
          />
          <Label
            v-if="listing.diagnostic_requested"
            :text="t('catalog.common.diagnostic_requested')"
            kind="gray"
          />
          <Label
            v-if="listing.compensation_requested"
            :text="t('catalog.common.compensation_requested')"
            kind="gray"
          />
          <Label
            v-if="listing.diagnostic_loaded && !listing.diagnostic_requested"
            :text="t('catalog.common.diagnostic_loaded')"
            kind="green"
          />
          <Label
            v-if="listing.compensation_loaded && !listing.compensation_requested"
            :text="t('needs.compensation_report_loaded')"
            kind="green"
          />
          <Label
            v-if="proposalStatus === 'accepted'"
            :text="t('catalog.common.booking_confirmed')"
            kind="green"
          />

          <Label
            v-if="listing.diagnostic_subscribed"
            :text="t('catalog.common.diagnostic_subscribed')"
            kind="yellow"
          />
          <Label
            v-if="listing.video_requested"
            :text="t('catalog.common.video_requested')"
            kind="gray"
          />
          <Label
            v-if="listing.video_loaded && !listing.video_requested"
            :text="t('catalog.common.video_loaded')"
            kind="green"
          />
        </template>
      </div>

      <div class="mt-auto flex flex-col gap-2">
        <div class="text-xs text-gray-400 mb-0">
          <span class="block">{{ t("catalog.common.published") }}</span>
          {{ publishedAt }}
        </div>

        <div
          v-if="checkGroups.length > 0"
          :class="$style.checks"
        >
          <div :class="$style.checksTitle">
            {{ t('needs.proposal_checks.title') }}
          </div>
          <div :class="$style.checksItems">
            <span
              v-for="(group, index) in checkGroups"
              :key="group.type"
            >
              <span
                v-if="index > 0"
                aria-hidden="true"
                class="mr-2 text-gray-400"
              >·</span>
              {{ group.label }} <span class="whitespace-nowrap">{{ formatPriceWithOptionalDecimals(group.total) }} ¥</span>
            </span>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <Label
            v-if="proposalStatus === 'rejected'"
            :text="t('needs.not_suitable')"
            kind="red"
          />
          <Button
            v-if="proposalStatus === 'rejected'"
            kind="link"
            size="unset"
            @click="showRejectionReason = true"
          >
            {{ t("needs.view_reason") }}
          </Button>
        </div>
      </div>
    </div>
    <RejectProposalModal
      v-model:show="showRejectModal"
      :submitting="isSubmitting"
      @submit="handleReject"
    />
    <Modal
      v-model="showRejectionReason"
      size="lg"
    >
      <template #body>
        <h2 class="text-xl font-bold mb-4">
          {{ t("needs.modal.rejection_reason_title") }}
        </h2>

        <div class="text-gray-700 relative mb-4">
          <TranslatableWrapper
            v-if="rejectionReasonText"
            :data="rejectionData"
            :config="{
              keys: {
                ru: 'rejection_reason_ru',
                zh: 'rejection_reason_zh',
                original: 'rejection_reason_original_locale',
              },
            }"
            control-class="absolute top-0 right-0 z-10"
            class="pr-10"
          >
            <template #default="{ displayedText }">
              <div class="whitespace-pre-wrap">
                {{ displayedText || rejectionReasonText }}
              </div>
            </template>
          </TranslatableWrapper>
          <div
            v-else
            class="text-gray-400 italic"
          >
            {{ t("common.no_information") }}
          </div>
        </div>

        <div
          v-if="props.rejectionPhotos?.length"
          class="mt-2"
        >
          <h3 class="text-sm font-medium text-gray-600 mb-2">
            {{ t('needs.modal.rejection_photos_title') }}
          </h3>
          <div :class="$style.rejectionPhotoGrid">
            <div
              v-for="(photo, idx) in props.rejectionPhotos"
              :key="photo.id"
              :class="$style.rejectionPhotoItem"
            >
              <img
                :src="photo.thumb || photo.url"
                :alt="t('listing.photo_alt')"
                :class="$style.rejectionPhotoImage"
                @click="openRejectionFullscreen(idx)"
              >
            </div>
          </div>
        </div>
      </template>
      <template #footer>
        <Button
          kind="primary"
          @click="showRejectionReason = false"
        >
          {{ t("common.close") }}
        </Button>
      </template>
    </Modal>
    <Teleport to="body">
      <transition name="fade">
        <div
          v-if="rejectionFullscreen.active"
          :class="$style.fullscreenOverlay"
          @click.self.stop="closeRejectionFullscreen"
        >
          <Button
            kind="unset"
            size="unset"
            :class="$style.fullscreenClose"
            @click.stop="closeRejectionFullscreen"
          >
            <XMarkIcon :class="$style.fullscreenCloseIcon" />
          </Button>
          <Button
            kind="unset"
            size="unset"
            :class="$style.fullscreenArrowLeft"
            @click.stop="rejectionFullscreenPrev"
          >
            <ChevronLeftIcon :class="$style.sliderArrowIcon" />
          </Button>
          <Button
            kind="unset"
            size="unset"
            :class="$style.fullscreenArrowRight"
            @click.stop="rejectionFullscreenNext"
          >
            <ChevronRightIcon :class="$style.sliderArrowIcon" />
          </Button>
          <img
            :src="rejectionImages[rejectionFullscreen.idx]"
            :alt="t('listing.photo_alt')"
            :class="$style.fullscreenImg"
            @click.stop
          >
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue"
import { useI18n } from "vue-i18n"
import {
  PlayIcon as PlayIconOutline,
  ChatBubbleOvalLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
} from "@heroicons/vue/24/outline"
import "keen-slider/keen-slider.min.css"
import { useKeenSlider } from "keen-slider/vue"
import { useMoney } from "@/composables/useMoney"
import useSearchRequest from "@/composables/useSearchRequest"
import Button from "@/components/common/Button.vue"
import Label from "@/components/common/Label.vue"
import LabelTooltip from "@/components/common/LabelTooltip.vue"
import Modal from "@/components/common/Modal.vue"
import RejectProposalModal from "@/components/needs/RejectProposalModal.vue"
import Activity from "@/components/icon/Activity.vue"
import PaintBucket from "@/components/icon/PaintBucket.vue"
import { carStubImage, SaleStatusBooked, SaleStatusSold, SaleStatusWithdrawn } from "@/constants/catalog"
import { RequestTypeDiagnostic, RequestTypeCompensation } from "@/constants/listingRequests"
import ToChat from "@/components/chat/ToChat.vue"
import TranslatableWrapper from "@/components/common/TranslatableWrapper.vue"
import type { Listing } from "@/types/responses/listing"
import type { SearchRequestListingRequest } from "@/types/responses/searchRequest"
import { getListingRequestCost } from "@/utils/listingRequestCost"
import type {
  ProposalStatus,
  ProposalSource,
  RejectionPhoto,
} from "@/types/responses/proposal"

interface Props {
  listing: Listing
  listingRequests: SearchRequestListingRequest[]
  searchRequestId: number
  proposalStatus?: ProposalStatus
  hasPendingBooking: boolean
  source?: ProposalSource
  rejectionReasonText?: string
  isSeller?: boolean
  buyerId?: number
  onReject?: () => void
  rejectionReasonRu?: string
  rejectionReasonZh?: string
  rejectionReasonOriginalLocale?: string
  rejectionPhotos?: RejectionPhoto[]
}

const props = defineProps<Props>()

const { t } = useI18n()
const { formatNumberWithSpace, formatPriceWithOptionalDecimals } = useMoney()
const { rejectProposal: rejectProposalAction } = useSearchRequest()

const listing = computed(() => props.listing)
const isSeller = computed(() => !!props.isSeller)
const buyerId = computed(() => props.buyerId)

const checkGroups = computed(() => ([
  { type: RequestTypeDiagnostic, label: t("needs.proposal_checks.diagnostic") },
  { type: RequestTypeCompensation, label: t("needs.proposal_checks.compensation") },
] as const).map((group) => {
  const count = props.listingRequests.filter(request => request.type === group.type).length
  return {
    ...group,
    count,
    total: count * getListingRequestCost(group.type),
  }
}).filter(group => group.count > 0))

const proposalStatus = computed<ProposalStatus>(
  () => props.proposalStatus ?? "pending",
)
const isUnavailable = computed(
  () =>
    listing.value.sale_status === SaleStatusSold
    || listing.value.sale_status === SaleStatusWithdrawn
    || listing.value.sale_status === SaleStatusBooked,
)
const source = computed<ProposalSource>(() => props.source ?? "manual")
const rejectionReasonText = computed(() => props.rejectionReasonText ?? "")

const showRejectModal = ref(false)
watch(() => props.hasPendingBooking, (pending) => {
  if (pending) {
    showRejectModal.value = false
  }
})
const showRejectionReason = ref(false)
const isSubmitting = ref(false)

const hasPhotos = computed(
  () => Array.isArray(listing.value?.photos) && listing.value.photos.length > 0,
)

const displayImages = computed(() =>
  hasPhotos.value
    ? listing.value.photos.map((p: any) => p.url).slice(0, 5)
    : [carStubImage],
)

const fullscreen = ref<{ active: boolean, idx: number }>({
  active: false,
  idx: 0,
})
const fullscreenImages = computed(() => displayImages.value)

function openFullscreen(idx: number) {
  fullscreen.value = { active: true, idx }
}
function closeFullscreen() {
  fullscreen.value = { active: false, idx: 0 }
}
function fullscreenPrev(e?: Event) {
  if (e) {
    e.stopPropagation()
  }
  const imgs = fullscreenImages.value
  fullscreen.value.idx = (fullscreen.value.idx - 1 + imgs.length) % imgs.length
}
function fullscreenNext(e?: Event) {
  if (e) {
    e.stopPropagation()
  }
  const imgs = fullscreenImages.value
  fullscreen.value.idx = (fullscreen.value.idx + 1) % imgs.length
}

const rejectionData = computed(() => ({
  rejection_reason_ru: props.rejectionReasonRu,
  rejection_reason_zh: props.rejectionReasonZh,
  rejection_reason_original_locale: props.rejectionReasonOriginalLocale,
}))

const rejectionFullscreen = ref<{ active: boolean, idx: number }>({ active: false, idx: 0 })
const rejectionImages = computed(() =>
  (props.rejectionPhotos || []).map(p => p.url),
)

function openRejectionFullscreen(idx: number) {
  rejectionFullscreen.value = { active: true, idx }
}
function closeRejectionFullscreen() {
  rejectionFullscreen.value = { active: false, idx: 0 }
}
function rejectionFullscreenPrev(e?: Event) {
  if (e) {
    e.stopPropagation()
  }
  const imgs = rejectionImages.value
  rejectionFullscreen.value.idx = (rejectionFullscreen.value.idx - 1 + imgs.length) % imgs.length
}
function rejectionFullscreenNext(e?: Event) {
  if (e) {
    e.stopPropagation()
  }
  const imgs = rejectionImages.value
  rejectionFullscreen.value.idx = (rejectionFullscreen.value.idx + 1) % imgs.length
}

const formattedPrice = computed(() =>
  formatNumberWithSpace(Number(listing.value?.price)),
)

const chatButtonText = computed(() =>
  isSeller.value ? t("needs.chat_with_buyer") : t("needs.chat_with_seller"),
)

const translateIfExists = (key: string, value?: string | null): string => {
  if (!value) {
    return ""
  }
  const candidate = `${key}.${value}`
  return t(candidate) === candidate ? value : t(candidate)
}

const description = computed(() => {
  const parts: string[] = []

  if (listing.value?.car?.displacement) {
    const hp = listing.value.car.horse_power
    const literPart = `${listing.value.car.displacement} ${t("catalog.list.liter")}`
    const hpPart = hp ? ` (${hp} ${t("catalog.detail.hp")})` : ""
    parts.push(`${literPart}${hpPart}`)
  }

  if (listing.value?.car?.short_power_type || listing.value?.car?.power_type) {
    const engineType = (listing.value.car.short_power_type
      || listing.value.car.power_type) as string
    parts.push(translateIfExists("cars.power_type", engineType))
  }

  if (listing.value?.car?.gearbox) {
    parts.push(translateIfExists("cars.gearbox", listing.value.car.gearbox))
  }

  if (listing.value?.car?.common_short_gearbox) {
    parts.push(t("cars.gearbox." + listing.value.car.common_short_gearbox))
  }

  if (listing.value?.car?.drive_type) {
    parts.push(
      translateIfExists("cars.drive_type", listing.value.car.drive_type),
    )
  }

  if (listing.value?.mileage) {
    parts.push(
      `${t("catalog.list.mileage")} ${formatNumberWithSpace(listing.value.mileage)} ${t("catalog.list.km")}`,
    )
  }

  return (parts.join(", ") || t("catalog.list.no_description")).toLowerCase()
})

const hasVideos = computed(
  () => Array.isArray(listing.value?.videos) && listing.value.videos.length > 0,
)
const hasDiagnostics = computed(() => !!listing.value?.diagnostic_url)
const publishedAt = computed(() => listing.value?.created_at)

const [sliderRef, slider] = useKeenSlider({
  loop: false,
  slides: { perView: 1 },
})

const currentSlide = ref(0)
const hoverSlideIndex = ref(-1)

watch(
  slider,
  (instance) => {
    if (!instance) {
      return
    }
    instance.on("slideChanged", (s) => {
      currentSlide.value = s.track.details.rel
    })
  },
  { immediate: true },
)

function goToSlide(idx: number) {
  slider.value?.moveToIdx(idx, true, { duration: 0 })
}

function handleMouseMove(event: MouseEvent) {
  if (fullscreen.value.active) {
    return
  }
  const sliderElement = sliderRef.value
  if (!sliderElement || !slider.value) {
    return
  }

  const rect = sliderElement.getBoundingClientRect()
  const mouseX = event.clientX - rect.left
  const totalSlides = displayImages.value.length
  const sectionWidth = rect.width / totalSlides

  const newIdx = Math.floor(mouseX / sectionWidth)
  const clampedIdx = Math.max(0, Math.min(newIdx, totalSlides - 1))

  if (hoverSlideIndex.value !== clampedIdx) {
    hoverSlideIndex.value = clampedIdx
    slider.value.moveToIdx(clampedIdx, true, { duration: 0 })
  }
}

function handleMouseLeave() {
  hoverSlideIndex.value = -1
}

const loadedImages = ref(0)
function onImageLoad() {
  loadedImages.value += 1
  if (loadedImages.value === displayImages.value.length) {
    slider.value?.update()
  }
}

let resizeObserver: ResizeObserver | null = null
onMounted(() => {
  if (sliderRef.value && slider.value) {
    slider.value.update()
    setTimeout(() => slider.value?.update(), 100)

    resizeObserver = new ResizeObserver(() => {
      slider.value?.update()
    })
    resizeObserver.observe(sliderRef.value)
  }
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  slider.value?.destroy()
})

async function handleReject(reason: string, draftMediaIds: number[]) {
  if (props.hasPendingBooking || isSubmitting.value) {
    return
  }
  isSubmitting.value = true
  try {
    const success = await rejectProposalAction(props.searchRequestId, {
      listing_id: listing.value.id,
      rejection_reason: reason,
      draft_media_ids: draftMediaIds,
    })
    if (success) {
      showRejectModal.value = false
      props.onReject?.()
    }
  }
  catch (error) {
    console.error("Error rejecting proposal:", error)
  }
  finally {
    isSubmitting.value = false
  }
}
</script>

<style module>
.carBlock {
  @apply flex flex-wrap items-start gap-4 border border-gray-200 lg:gap-6 pb-4 mb-6 border-b border-gray-200 md:flex-nowrap;
}

.carBlockUnavailable {
  @apply -mx-3 px-3 pt-3 rounded-lg bg-red-50 border-red-200;
}

.checks {
  @apply w-fit max-w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2;
}

.checksTitle {
  @apply mb-1 text-xs font-bold uppercase text-gray-500;
}

.checksItems {
  @apply flex flex-wrap gap-x-2 gap-y-1 text-sm font-medium text-gray-900;
}

.imgWrapper {
  @apply relative;
}

.slider {
  @apply relative w-full aspect-[4/3] overflow-hidden;
}

.slide {
  @apply flex items-center justify-center bg-gray-100 w-full h-full min-h-0 min-w-0 p-0 relative cursor-zoom-in pointer-events-auto;
}

.slideZoom {
  @apply cursor-zoom-in;
}

.carImage {
  @apply w-full h-full object-cover block;
}

.stripes {
  @apply absolute bottom-0 left-0 w-full flex justify-center items-end gap-2 pb-2 z-10;
}

.stripe {
  @apply w-8 h-[6px] rounded bg-white opacity-60 transition-all border-none outline-none cursor-pointer;
}

.stripeActive {
  @apply opacity-100 bg-white shadow-lg;
}

.fullscreenOverlay {
  @apply fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-95;
  animation: fadeIn 0.2s;
}

.fullscreenImg {
  @apply max-w-full max-h-full shadow-2xl bg-[#111] object-contain;
  box-shadow: 0 0 40px 8px rgba(0, 0, 0, 0.7);
}

.fullscreenClose {
  @apply absolute top-6 right-6 z-10 bg-black bg-opacity-60 rounded-full p-2 hover:bg-opacity-90 transition;
}

.fullscreenCloseIcon {
  @apply w-7 h-7 text-white;
}

.fullscreenArrowLeft,
.fullscreenArrowRight {
  @apply absolute top-1/2 z-10 bg-white bg-opacity-80 rounded-full p-2 shadow-md border border-gray-200 transition hover:bg-primary-600 hover:text-white flex items-center justify-center w-10 h-10;
  transform: translateY(-50%);
}

.fullscreenArrowLeft {
  @apply left-8;
}

.fullscreenArrowRight {
  @apply right-8;
}

.sliderArrowIcon {
  @apply w-6 h-6;
}

.rejectionPhotoGrid {
  @apply grid grid-cols-2 sm:grid-cols-3 gap-3;
}

.rejectionPhotoItem {
  @apply relative w-full h-28 rounded-lg overflow-hidden border border-gray-200;
}

.rejectionPhotoImage {
  @apply w-full h-full object-cover cursor-zoom-in hover:opacity-90 transition-opacity;
}
</style>
