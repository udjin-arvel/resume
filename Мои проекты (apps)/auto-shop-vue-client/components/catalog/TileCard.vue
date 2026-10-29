<template>
  <div :class="$style.carBlock">
    <div :class="$style.imgWrapper">
      <div
        v-if="isSeller"
        :class="$style.menuWrapper"
      >
        <MenuElips
          kind="lightgrey"
          :menu-action-groups="menuActionGroups"
        >
          <template #item="{ item }">
            <span :class="[$style.menuItemName, item.style === 'red' ? $style.redMenuItem : '']">{{ item.label }}</span>
          </template>
        </MenuElips>
      </div>
      <div
        ref="sliderRef"
        class="keen-slider"
        :class="$style.slider"
        @mousemove="handleMouseMove"
        @mouseleave="handleMouseLeave"
      >
        <div
          v-for="(img, idx) in displayImages"
          :key="`${img.original}-${idx}`"
          class="keen-slider__slide"
          :class="[$style.slide, (images && images.length > 0) ? $style.slideZoom : '']"
          @click="(images && images.length > 0) && openFullscreen(idx)"
        >
          <CatalogCardPicture
            :image="img"
            :alt="name"
            :picture-class="$style.carPicture"
            :image-class="$style.carImage"
          />
          <div
            v-if="visibility === 'hidden'"
            :class="$style.hiddenOverlay"
          >
            <span :class="$style.hiddenText">
              <EyeSlashIcon :class="$style.hiddenIcon" />
              {{ t('catalog.common.hidden') }}
            </span>
          </div>
        </div>
        <div
          v-if="images && displayImages.length > 1"
          :class="$style.stripes"
        >
          <button
            v-for="(img, idx) in displayImages"
            :key="idx"
            :class="[$style.stripe, currentSlide === idx ? $style.stripeActive : '']"
            :aria-label="t('common.go_to_slide')"
            type="button"
            @click.stop.prevent="goToSlide(idx)"
          />
        </div>
      </div>
      <div :class="$style.labelRow">
        <LabelTooltip
          v-if="hasVideos"
          :icon="PlayIconOutline"
          :tooltip-text="t('common.has_video')"
        />
        <LabelTooltip
          v-if="hasDiagnostics"
          :icon="Activity"
          :tooltip-text="t('common.has_diagnostics')"
        />
        <LabelTooltip
          v-if="hasCompensation"
          :icon="ClipboardDocumentCheckIcon"
          :tooltip-text="t('common.has_compensation')"
        />
        <LabelTooltip
          v-if="originalPaint"
          :icon="PaintBucket"
          :tooltip-text="t('common.original_paint')"
        />
      </div>
      <transition name="fade">
        <div
          v-if="fullscreen.active"
          :class="$style.fullscreenOverlay"
          @click.self="closeFullscreen"
        >
          <button
            type="button"
            :class="$style.fullscreenClose"
            :aria-label="t('common.close')"
            @click="closeFullscreen"
          >
            <XMarkIcon :class="$style.fullscreenCloseIcon" />
          </button>
          <button
            type="button"
            :class="$style.fullscreenArrowLeft"
            :aria-label="t('common.previous')"
            @click.stop="fullscreenPrev"
          >
            <ChevronLeftIcon :class="$style.sliderArrowIcon" />
          </button>
          <button
            type="button"
            :class="$style.fullscreenArrowRight"
            :aria-label="t('common.next')"
            @click.stop="fullscreenNext"
          >
            <ChevronRightIcon :class="$style.sliderArrowIcon" />
          </button>
          <CarPreviewImage
            :key="fullscreen.idx"
            :src="displayImages[fullscreen.idx].original"
            :fallback-src="displayImages[fullscreen.idx].mobile"
            :alt="name"
            :image-class="$style.fullscreenImg"
          />
        </div>
      </transition>
    </div>
    <NuxtLink
      :to="link"
      tabindex="-1"
      :class="$style.tileTextLink"
    >
      <div :class="$style.carTitleBlack">{{ name }}</div>
      <div :class="$style.carDesc"><ListingDescription
        :parts="descriptionParts"
        :fallback="description"
      /></div>
      <div
        v-if="productionDate"
        :class="$style.carProductionDate"
      >
        <span :class="$style.carProductionDateLabel">{{ t('catalog.list.production_date') }}:</span> {{ productionDate }}
      </div>
    </NuxtLink>
    <div :class="$style.priceRow">
      <AuthLockInline
        v-if="isPriceLocked"
        size="sm"
      />
      <div v-else>
        <b>{{ formattedPrice }}</b> {{ yuanSymbol }}
      </div>
      <FavoriteButton
        v-if="showFavorite"
        :listing-id="Number(listingId)"
        :is-favorited="isFavorited"
        @change="emit('favoriteChange', $event)"
      />
    </div>
    <NuxtLink
      :to="link"
      tabindex="-1"
      :class="$style.tileLabelsLink"
    >
      <div class="flex flex-wrap gap-1.5">
        <template v-if="showSellerStats">
          <Label
            v-if="totalBooking && totalBooking > 0"
            :text="`${t('catalog.common.booking_requested')} (${totalBooking})`"
            kind="gray"
          />
          <Label
            v-if="totalDiagnostic && totalDiagnostic > 0"
            :text="`${t('catalog.common.diagnostic_requested')} (${totalDiagnostic})`"
            kind="gray"
          />
          <Label
            v-if="totalCompensation && totalCompensation > 0"
            :text="`${t('catalog.common.compensation_requested')} (${totalCompensation})`"
            kind="gray"
          />
          <Label
            v-if="totalVideo && totalVideo > 0"
            :text="`${t('catalog.common.video_requested')} (${totalVideo})`"
            kind="gray"
          />
        </template>

        <template v-else>
          <Label
            v-if="bookingRequested"
            :text="t('catalog.common.booking_requested')"
            kind="gray"
          />
          <Label
            v-if="diagnosticRequested"
            :text="t('catalog.common.diagnostic_requested')"
            kind="gray"
          />
          <Label
            v-if="compensationRequested"
            :text="t('catalog.common.compensation_requested')"
            kind="gray"
          />
          <Label
            v-if="diagnosticLoaded && !diagnosticRequested"
            :text="t('catalog.common.diagnostic_loaded')"
            kind="green"
          />
          <Label
            v-if="compensationLoaded && !compensationRequested"
            :text="t('catalog.common.compensation_loaded')"
            kind="green"
          />
          <Label
            v-if="diagnosticSubscribed"
            :text="t('catalog.common.diagnostic_subscribed')"
            kind="yellow"
          />
          <Label
            v-if="videoRequested"
            :text="t('catalog.common.video_requested')"
            kind="gray"
          />
          <Label
            v-if="videoLoaded && !videoRequested"
            :text="t('catalog.common.video_loaded')"
            kind="green"
          />
        </template>
      </div>
    </NuxtLink>

    <ReturnToSaleModal
      :is-open="isReturnToSaleModalOpen"
      :listing-id="Number(listingId)"
      @close="closeReturnToSaleModal"
      @success="refreshListingsAfterReturn"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed } from "vue"
import "keen-slider/keen-slider.min.css"
import { useKeenSlider } from "keen-slider/vue"
import { PlayIcon as PlayIconOutline, ChevronLeftIcon, ChevronRightIcon, XMarkIcon, EyeSlashIcon, ClipboardDocumentCheckIcon } from "@heroicons/vue/24/outline"
import { useI18n } from "vue-i18n"
import { storeToRefs } from "pinia"
import { useMoney } from "@/composables/useMoney"
import AuthLockInline from "@/components/common/AuthLockInline.vue"
import { displayCatalogImages, type CatalogCardImage } from "@/utils/catalogImages"
import CatalogCardPicture from "@/components/catalog/CatalogCardPicture.vue"
import CarPreviewImage from "@/components/common/CarPreviewImage.vue"
import currency from "@/lang/ru/currency.json"
import Activity from "@/components/icon/Activity.vue"
import PaintBucket from "@/components/icon/PaintBucket.vue"
import LabelTooltip from "@/components/common/LabelTooltip.vue"
import Label from "@/components/common/Label.vue"
import MenuElips from "@/components/common/MenuElips.vue"
import { useCatalogCardMenu } from "@/composables/useCatalogCardMenu"
import { useUserStore } from "@/stores/user"
import ReturnToSaleModal from "@/components/listing/ReturnToSaleModal.vue"
import ListingDescription, { type DescriptionPart } from "@/components/catalog/ListingDescription.vue"
import FavoriteButton from "@/components/catalog/FavoriteButton.vue"

interface Props {
  name: string
  images: CatalogCardImage[]
  description?: string
  descriptionParts?: DescriptionPart[]
  productionDate?: string
  price: string | number
  isPriceLocked?: boolean
  link: string | { name: string, params: { id: string | number } }
  hasDiagnostics: boolean
  hasCompensation?: boolean
  hasVideos: boolean
  originalPaint?: boolean
  diagnosticRequested: boolean
  compensationRequested: boolean
  videoRequested: boolean
  diagnosticLoaded: boolean
  compensationLoaded: boolean
  videoLoaded: boolean
  diagnosticSubscribed: boolean
  bookingRequested: boolean
  isSeller?: boolean
  visibility?: string
  refreshListings?: () => void
  totalVideo?: number
  totalDiagnostic?: number
  totalCompensation?: number
  totalBooking?: number
  totalMessages?: number
  deleted?: boolean
  saleStatus?: string | null
  listingId?: number
  showFavorite?: boolean
  isFavorited?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showFavorite: false,
  isFavorited: false,
})
const emit = defineEmits<{
  favoriteChange: [isFavorited: boolean]
}>()
const { formatNumberWithSpace } = useMoney()
const formattedPrice = computed(() => formatNumberWithSpace(Number(props.price)))
const yuanSymbol = currency.CNY_symbol

const listingId = computed(() => {
  if (props.listingId) {
    return props.listingId
  }

  return typeof props.link === "string" ? props.link : props.link.params.id
})
const totalVideoRef = computed(() => props.totalVideo || 0)
const totalDiagnosticRef = computed(() => props.totalDiagnostic || 0)
const totalCompensationRef = computed(() => props.totalCompensation || 0)
const totalBookingRef = computed(() => props.totalBooking || 0)
const totalMessagesRef = computed(() => props.totalMessages || 0)
const userStore = useUserStore()
const { isSellerContent, isSellerSearch } = storeToRefs(userStore)
const { menuActionGroups, isReturnToSaleModalOpen, closeReturnToSaleModal } = useCatalogCardMenu(
  listingId.value,
  props.refreshListings || (() => { }),
  props.visibility || "all",
  totalVideoRef,
  totalDiagnosticRef,
  totalCompensationRef,
  totalBookingRef,
  totalMessagesRef,
  props.deleted,
  props.saleStatus ?? null,
)

const refreshListingsAfterReturn = () => {
  props.refreshListings?.()
}
const displayImages = computed(() => displayCatalogImages(props.images))

const [sliderRef, slider] = useKeenSlider({
  loop: false,
  slides: { perView: 1 },
})
const currentSlide = ref(0)
const hoverSlideIndex = ref(-1)
const showSellerStats = computed(() => {
  if (!props.isSeller) {
    return false
  }
  if (isSellerContent.value || isSellerSearch.value) {
    return false
  }

  return true
})
watch(
  slider,
  (instance) => {
    if (instance) {
      instance.on("slideChanged", (s) => {
        currentSlide.value = s.track.details.rel
      })
    }
  },
  { immediate: true },
)

function goToSlide(idx: number) {
  if (slider.value) {
    slider.value.moveToIdx(idx, true, { duration: 0 })
  }
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

onMounted(() => {
  if (slider.value) {
    slider.value.update()
  }
})

onUnmounted(() => {
  slider.value?.destroy()
})

const fullscreen = ref<{ active: boolean, idx: number }>({ active: false, idx: 0 })

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
  const imgs = displayImages.value
  fullscreen.value.idx = (fullscreen.value.idx - 1 + imgs.length) % imgs.length
}

function fullscreenNext(e?: Event) {
  if (e) {
    e.stopPropagation()
  }
  const imgs = displayImages.value
  fullscreen.value.idx = (fullscreen.value.idx + 1) % imgs.length
}

const { t } = useI18n()
</script>

<style module>
.carBlock {
  @apply block rounded-xl bg-white transition;
}
.imgWrapper {
  @apply relative;
}
.slider {
  @apply relative w-full h-[280px] sm:h-[280px] md:h-[240px] rounded-xl overflow-hidden;
}
.slide {
  @apply flex items-center justify-center bg-gray-100 w-full h-full min-h-0 min-w-0 p-0 relative cursor-zoom-in pointer-events-auto;
}
.slideZoom {
  @apply cursor-zoom-in;
}
.carPicture {
  @apply w-full h-full block;
}
.carImage {
  @apply w-full h-full object-cover block;
}
.centerIconOverlay {
  @apply absolute left-1/2 top-1/2 flex items-center justify-center;
  width: 56px;
  height: 56px;
  background: rgba(0,0,0,0.55);
  border-radius: 12px;
  transform: translate(-50%, -50%);
  z-index: 20;
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
.labelRow {
  @apply absolute top-2 left-2 flex flex-row gap-2;
}
.carTitleBlack {
  @apply text-lg font-semibold mb-2 text-black hover:text-red-600 whitespace-nowrap overflow-hidden text-ellipsis block;
}
.carDesc {
  @apply text-gray-500 text-sm;
}
.carProductionDate {
  @apply text-sm text-gray-700 mb-1;
}
.carProductionDateLabel {
  @apply text-gray-500;
}
.fullscreenOverlay {
  @apply fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-95;
  animation: fadeIn 0.2s;
}
.fullscreenImg {
  @apply max-w-full max-h-full rounded-xl shadow-2xl bg-[#111] !object-contain;
  box-shadow: 0 0 40px 8px rgba(0,0,0,0.7);
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
.tileTextLink {
  @apply block mt-2 no-underline;
}
.tileLabelsLink {
  @apply block mt-2 no-underline;
}
.priceRow {
  @apply text-xl flex items-center justify-between gap-2 mt-1;
}
.menuWrapper {
  @apply absolute top-2 right-2 z-20;
}
.menuItemName {
  @apply text-sm text-black;
}
.redMenuItem {
  @apply text-red-600;
}
.hiddenOverlay {
  @apply absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-30;
}
.hiddenText {
  @apply flex items-center gap-2 text-white text-lg font-semibold bg-black bg-opacity-70 rounded-full px-4 py-2;
}
.hiddenIcon {
  @apply w-5 h-5 text-white;
}
</style>
