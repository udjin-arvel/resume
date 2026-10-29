<template>
  <div>
    <div :class="$style.sliderLabelWrap">
      <span :class="$style.sliderLabelTitle">{{ label }}</span>
      <span :class="$style.sliderLabelCount">({{ slides.length }})</span>
    </div>
    <div :class="$style.sliderWrap">
      <Button
        kind="white"
        type="button"
        :class="$style.sliderArrowLeft"
        :aria-label="t('actions.prev')"
        @click="prevSlide"
      >
        <ChevronLeftIcon :class="$style.sliderArrowIcon" />
      </Button>
      <div
        ref="sliderContainerRef"
        :class="['keen-slider', $style.slider]"
      >
        <div
          v-for="(slide, idx) in slides"
          :key="slide.key"
          class="keen-slider__slide"
          :class="$style.slide"
          @click="slide.blurred ? emit('lockedClick') : openFullscreen(idx)"
        >
          <CarPreviewImage
            v-if="type === 'image'"
            :src="slide.src"
            :fallback-src="originalSrc(idx)"
            :image-class="slide.blurred ? `${$style.slideImg} ${$style.blurredImg}` : $style.slideImg"
            @load="updateSlider"
          />
          <video
            v-else
            :src="slide.src"
            :poster="posters[idx] || undefined"
            :class="$style.slideImg"
            preload="metadata"
            playsinline
            :alt="''"
            :controls="false"
            @loadedmetadata="updateSlider"
            @play.prevent
          />
          <PlayIcon
            v-if="type === 'video'"
            :class="$style.playIcon"
            :size="80"
          />
          <div
            v-if="slide.blurred"
            :class="$style.slideLockBadge"
          >
            <AuthLockIcon :icon-class="$style.slideLockIcon" />
          </div>
        </div>
      </div>
      <Button
        kind="white"
        type="button"
        :class="$style.sliderArrowRight"
        :aria-label="t('actions.next')"
        @click="nextSlide"
      >
        <ChevronRightIcon :class="$style.sliderArrowIcon" />
      </Button>
    </div>
    <div :class="$style.thumbsWrap">
      <div
        v-for="(row, rowIdx) in thumbRows"
        :key="rowIdx"
        :class="$style.thumbsRow"
      >
        <template
          v-for="tile in row"
          :key="tile.key"
        >
          <button
            type="button"
            :class="[$style.thumb, currentSlide === tile.index ? $style.thumbActive : '']"
            :aria-label="tile.blurred ? t('catalog.detail.locked_photos') : t('actions.goto_slide')"
            @click="goToSlide(tile.index)"
          >
            <CarPreviewImage
              v-if="type === 'image'"
              :src="thumbSrc(tile.index)"
              :fallback-src="originalSrc(tile.index)"
              :image-class="tile.blurred ? `${$style.thumbImg} ${$style.blurredImg}` : $style.thumbImg"
            />
            <video
              v-else
              :src="slides[tile.index]?.src"
              :poster="posters[tile.index] || undefined"
              :class="$style.thumbImg"
              preload="metadata"
              playsinline
              :alt="''"
            />
            <PlayIcon
              v-if="type === 'video'"
              :class="$style.playIconThumb"
              :size="32"
            />
            <AuthLockIcon
              v-if="tile.blurred"
              :icon-class="$style.thumbLockIcon"
              :class="$style.thumbLockWrap"
            />
          </button>
        </template>
      </div>
    </div>
    <Teleport to="body">
      <transition name="fade">
        <div
          v-if="fullscreen.active"
          :class="$style.fullscreenOverlay"
          @click.self="closeFullscreen"
        >
          <Button
            kind="white"
            type="button"
            :class="$style.fullscreenClose"
            :aria-label="t('actions.close')"
            @click="closeFullscreen"
          >
            <XMarkIcon :class="$style.fullscreenCloseIcon" />
          </Button>
          <div
            v-if="type === 'image'"
            :class="$style.fullscreenZoomControl"
            @click.stop
          >
            <input
              v-model.number="fullscreenZoom"
              type="range"
              min="50"
              :max="fullscreenMaxZoom"
              step="10"
              :aria-label="t('actions.zoom')"
              :class="$style.fullscreenZoomRange"
              @keydown.stop
            >
            <output :class="$style.fullscreenZoomValue">
              {{ fullscreenZoom }}%
            </output>
          </div>
          <Button
            kind="white"
            type="button"
            :class="$style.fullscreenArrowLeft"
            :aria-label="t('actions.prev')"
            @click.stop="fullscreenPrev"
          >
            <ChevronLeftIcon :class="$style.sliderArrowIcon" />
          </Button>
          <Button
            kind="white"
            type="button"
            :class="$style.fullscreenArrowRight"
            :aria-label="t('actions.next')"
            @click.stop="fullscreenNext"
          >
            <ChevronRightIcon :class="$style.sliderArrowIcon" />
          </Button>
          <div
            ref="fullscreenContentRef"
            :class="$style.fullscreenContent"
            @click.self="closeFullscreen"
          >
            <div
              v-if="type === 'image'"
              :class="$style.fullscreenImageCanvas"
              :style="fullscreenCanvasStyle"
            >
              <CarPreviewImage
                :key="originalSrc(fullscreen.idx)"
                :src="originalSrc(fullscreen.idx)"
                :image-class="$style.fullscreenImg"
                :style="fullscreenImageStyle"
                @load="handleFullscreenImageLoad"
              />
            </div>
            <video
              v-else
              :key="items[fullscreen.idx]"
              :src="items[fullscreen.idx]"
              :poster="posters[fullscreen.idx] || undefined"
              :class="$style.fullscreenImg"
              controls
              autoplay
              playsinline
            />
          </div>
          <div
            v-if="type === 'image' && captions[fullscreen.idx]"
            :class="$style.fullscreenCaption"
          >
            {{ captions[fullscreen.idx] }}
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted, nextTick } from "vue"
import { useKeenSlider } from "keen-slider/vue"
import { useI18n } from "vue-i18n"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
} from "@heroicons/vue/24/solid"
import type { PropType } from "vue"
import AuthLockIcon from "@/components/common/AuthLockIcon.vue"
import Button from "@/components/common/Button.vue"
import CarPreviewImage from "@/components/common/CarPreviewImage.vue"
import PlayIcon from "@/components/icon/Play.vue"
import "keen-slider/keen-slider.min.css"

const props = defineProps({
  type: {
    type: String as PropType<"image" | "video">,
    required: true,
  },
  items: {
    type: Array as PropType<string[]>,
    required: true,
  },
  originals: {
    type: Array as PropType<string[]>,
    default: () => [],
  },
  thumbs: {
    type: Array as PropType<string[]>,
    default: () => [],
  },
  posters: {
    type: Array as PropType<(string | null)[]>,
    default: () => [],
  },
  captions: {
    type: Array as PropType<string[]>,
    default: () => [],
  },
  label: {
    type: String,
    required: true,
  },
  id: {
    type: String,
    required: true,
  },
  blurred: {
    type: Array as PropType<(string | null)[]>,
    default: () => [],
  },
})

const emit = defineEmits<{ lockedClick: [] }>()

const { t } = useI18n()

const [sliderContainerRef, slider] = useKeenSlider({
  loop: true,
  slides: { perView: 1 },
})

const currentSlide = ref(0)

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

onMounted(() => {
  if (slider.value) {
    slider.value.update()
    setTimeout(() => {
      slider.value?.update()
    }, 100)
  }
})

function updateSlider() {
  if (slider.value) {
    slider.value.update()
  }
}

let resizeObserver: ResizeObserver | null = null
onMounted(() => {
  if (sliderContainerRef.value && slider.value) {
    resizeObserver = new ResizeObserver(() => {
      slider.value?.update()
    })
    resizeObserver.observe(sliderContainerRef.value)
  }
})

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
  if (fullscreen.value.active) {
    document.body.style.overflow = previousBodyOverflow
    window.removeEventListener("keydown", handleFullscreenKeydown)
    window.removeEventListener("resize", handleFullscreenResize)
  }
  fullscreenContentResizeObserver?.disconnect()
})

function prevSlide() {
  if (slider.value) {
    slider.value.prev()
  }
}

function nextSlide() {
  if (slider.value) {
    slider.value.next()
  }
}

function goToSlide(idx: number) {
  if (slider.value) {
    slider.value.moveToIdx(idx, true, { duration: 0 })
  }
}

type Slide = { key: string, src: string, blurred: boolean }

const slides = computed<Slide[]>(() => [
  ...props.items.map((src, index) => ({ key: `item-${index}`, src, blurred: false })),
  ...props.blurred.map((src, index) => ({ key: `blurred-${index}`, src: src ?? "", blurred: true })),
])

function originalSrc(idx: number): string {
  const slide = slides.value[idx]

  if (slide?.blurred) {
    return slide.src
  }

  return props.originals?.[idx] || props.items[idx] || ""
}

function thumbSrc(idx: number): string {
  const slide = slides.value[idx]

  if (slide?.blurred) {
    return slide.src
  }

  return props.thumbs?.[idx] || props.items[idx] || ""
}

const thumbsPerRow = 4

type ThumbTile = { key: string, index: number, blurred: boolean }

const thumbRows = computed(() => {
  const tiles: ThumbTile[] = slides.value.map((slide, index) => ({
    key: slide.key,
    index,
    blurred: slide.blurred,
  }))

  const rows: ThumbTile[][] = []
  for (let i = 0; i < tiles.length; i += thumbsPerRow) {
    rows.push(tiles.slice(i, i + thumbsPerRow))
  }
  return rows
})

const fullscreen = ref<{ active: boolean, idx: number }>({ active: false, idx: 0 })
const fullscreenContentRef = ref<HTMLElement | null>(null)
const fullscreenZoom = ref(100)
const fullscreenViewport = ref({ width: 0, height: 0 })
const fullscreenImageNaturalSize = ref({ width: 0, height: 0 })
let previousBodyOverflow = ""

const fullscreenPadding = computed(() => fullscreenViewport.value.width >= 640 ? 96 : 32)

const fullscreenFitSize = computed(() => {
  const { width: naturalWidth, height: naturalHeight } = fullscreenImageNaturalSize.value
  const availableWidth = Math.max(0, fullscreenViewport.value.width - fullscreenPadding.value)
  const availableHeight = Math.max(0, fullscreenViewport.value.height - fullscreenPadding.value)

  if (!naturalWidth || !naturalHeight || !availableWidth || !availableHeight) {
    return { width: 0, height: 0 }
  }

  const fitRatio = Math.min(availableWidth / naturalWidth, availableHeight / naturalHeight, 1)
  return {
    width: naturalWidth * fitRatio,
    height: naturalHeight * fitRatio,
  }
})

const fullscreenMaxZoom = computed(() => {
  if (!fullscreenFitSize.value.width) {
    return 300
  }

  const previousFitWidth = Math.min(
    1200,
    Math.max(0, fullscreenViewport.value.width - fullscreenPadding.value),
  )
  const fitWidthZoom = Math.ceil((previousFitWidth / fullscreenFitSize.value.width) * 10) * 10
  return Math.max(300, fitWidthZoom)
})

function fullscreenGeometry(zoom: number) {
  const imageWidth = fullscreenFitSize.value.width * zoom / 100
  const imageHeight = fullscreenFitSize.value.height * zoom / 100
  const canvasWidth = Math.max(fullscreenViewport.value.width, imageWidth + fullscreenPadding.value)
  const canvasHeight = Math.max(fullscreenViewport.value.height, imageHeight + fullscreenPadding.value)

  return { imageWidth, imageHeight, canvasWidth, canvasHeight }
}

const fullscreenCanvasStyle = computed(() => {
  const geometry = fullscreenGeometry(fullscreenZoom.value)
  const imageWidthWithPadding = geometry.imageWidth + fullscreenPadding.value
  const imageHeightWithPadding = geometry.imageHeight + fullscreenPadding.value
  return {
    width: imageWidthWithPadding <= fullscreenViewport.value.width
      ? "100%"
      : `${imageWidthWithPadding}px`,
    height: imageHeightWithPadding <= fullscreenViewport.value.height
      ? "100%"
      : `${imageHeightWithPadding}px`,
  }
})

let fullscreenContentResizeObserver: ResizeObserver | null = null

const fullscreenImageStyle = computed(() => {
  const geometry = fullscreenGeometry(fullscreenZoom.value)
  return {
    width: `${geometry.imageWidth}px`,
    height: `${geometry.imageHeight}px`,
  }
})

function openFullscreen(idx: number) {
  if (props.type === "video" && sliderContainerRef.value) {
    const videos = sliderContainerRef.value.querySelectorAll("video")
    videos.forEach(video => video.pause())
  }
  fullscreen.value = { active: true, idx }
  fullscreenZoom.value = 100
  fullscreenImageNaturalSize.value = { width: 0, height: 0 }
  previousBodyOverflow = document.body.style.overflow
  document.body.style.overflow = "hidden"
  window.addEventListener("keydown", handleFullscreenKeydown)
  window.addEventListener("resize", handleFullscreenResize)
  nextTick(() => {
    updateFullscreenViewport()
    observeFullscreenContent()
  })
}

function closeFullscreen() {
  goToSlide(fullscreen.value.idx)
  fullscreen.value = { active: false, idx: 0 }
  document.body.style.overflow = previousBodyOverflow
  window.removeEventListener("keydown", handleFullscreenKeydown)
  window.removeEventListener("resize", handleFullscreenResize)
  fullscreenContentResizeObserver?.disconnect()
  fullscreenContentResizeObserver = null
}

function handleFullscreenKeydown(event: KeyboardEvent) {
  if (event.key === "Escape") {
    closeFullscreen()
  }
  if (event.key === "ArrowLeft") {
    fullscreenPrev()
  }
  if (event.key === "ArrowRight") {
    fullscreenNext()
  }
}

function scrollFullscreenToTop() {
  nextTick(() => fullscreenContentRef.value?.scrollTo({ top: 0, left: 0 }))
}

function updateFullscreenViewport(center = false) {
  const content = fullscreenContentRef.value
  if (!content) {
    return
  }

  const nextViewport = {
    width: content.clientWidth,
    height: content.clientHeight,
  }

  if (
    nextViewport.width !== fullscreenViewport.value.width
    || nextViewport.height !== fullscreenViewport.value.height
  ) {
    fullscreenViewport.value = nextViewport
  }

  if (center) {
    nextTick(centerFullscreenImage)
  }
}

function observeFullscreenContent() {
  const content = fullscreenContentRef.value
  if (!content) {
    return
  }

  fullscreenContentResizeObserver?.disconnect()
  fullscreenContentResizeObserver = new ResizeObserver(() => updateFullscreenViewport())
  fullscreenContentResizeObserver.observe(content)
}

function centerFullscreenImage() {
  const content = fullscreenContentRef.value
  if (!content) {
    return
  }

  content.scrollTo({
    left: Math.max(0, (content.scrollWidth - content.clientWidth) / 2),
    top: Math.max(0, (content.scrollHeight - content.clientHeight) / 2),
  })
}

function handleFullscreenImageLoad(event: Event) {
  const image = event.currentTarget as HTMLImageElement
  fullscreenImageNaturalSize.value = {
    width: image.naturalWidth,
    height: image.naturalHeight,
  }
  updateFullscreenViewport(true)
}

function handleFullscreenResize() {
  updateFullscreenViewport(true)
}

function fullscreenPrev(e?: Event) {
  if (e) {
    e.stopPropagation()
  }
  fullscreen.value.idx = (fullscreen.value.idx - 1 + props.items.length) % props.items.length
  fullscreenZoom.value = 100
  fullscreenImageNaturalSize.value = { width: 0, height: 0 }
  scrollFullscreenToTop()
  goToSlide(fullscreen.value.idx)
}

function fullscreenNext(e?: Event) {
  if (e) {
    e.stopPropagation()
  }
  fullscreen.value.idx = (fullscreen.value.idx + 1) % props.items.length
  fullscreenZoom.value = 100
  fullscreenImageNaturalSize.value = { width: 0, height: 0 }
  scrollFullscreenToTop()
  goToSlide(fullscreen.value.idx)
}

watch(currentSlide, (val) => {
  if (fullscreen.value.active) {
    fullscreen.value.idx = val
  }
})

watch(fullscreenZoom, (zoom, previousZoom) => {
  const content = fullscreenContentRef.value
  if (!fullscreen.value.active || !content || !fullscreenFitSize.value.width) {
    return
  }

  const previousGeometry = fullscreenGeometry(previousZoom)
  const nextGeometry = fullscreenGeometry(zoom)
  const previousImageLeft = (previousGeometry.canvasWidth - previousGeometry.imageWidth) / 2
  const previousImageTop = (previousGeometry.canvasHeight - previousGeometry.imageHeight) / 2
  const focalX = previousGeometry.imageWidth
    ? (content.scrollLeft + content.clientWidth / 2 - previousImageLeft) / previousGeometry.imageWidth
    : 0.5
  const focalY = previousGeometry.imageHeight
    ? (content.scrollTop + content.clientHeight / 2 - previousImageTop) / previousGeometry.imageHeight
    : 0.5

  nextTick(() => {
    const nextImageLeft = (nextGeometry.canvasWidth - nextGeometry.imageWidth) / 2
    const nextImageTop = (nextGeometry.canvasHeight - nextGeometry.imageHeight) / 2
    content.scrollTo({
      left: nextImageLeft + focalX * nextGeometry.imageWidth - content.clientWidth / 2,
      top: nextImageTop + focalY * nextGeometry.imageHeight - content.clientHeight / 2,
    })
  })
})
</script>

<style module>
.sliderLabelWrap {
  @apply flex items-center mb-2;
}
.sliderLabelTitle {
  @apply text-black font-medium text-base;
}
.sliderLabelCount {
  @apply text-gray-500 font-normal text-base ml-2;
}
.sliderWrap {
  @apply relative w-full flex items-stretch aspect-[4/3] min-h-[180px] sm:min-h-[260px] max-w-[420px];
}
.slider {
  @apply rounded-xl overflow-hidden w-full h-full relative max-w-full max-h-full min-h-[inherit];
}
.slide {
  @apply flex items-center justify-center bg-gray-100 w-full h-full min-h-0 min-w-0 p-0 relative cursor-zoom-in pointer-events-auto;
}
.slideImg {
  @apply object-cover w-full h-full block max-w-full max-h-full pointer-events-none;
}
.sliderArrowLeft,
.sliderArrowRight {
  @apply absolute top-1/2 z-10 bg-white bg-opacity-80 rounded-full p-2 shadow-md border border-gray-200 transition hover:bg-primary-600 hover:text-white flex items-center justify-center w-10 h-10;
  transform: translateY(-50%);
}
.sliderArrowLeft {
  @apply left-2;
}
.sliderArrowRight {
  @apply right-2;
}
.sliderArrowIcon {
  @apply w-6 h-6;
}
.thumbsWrap {
  @apply flex flex-col w-full mt-3 max-w-[420px] gap-1.5;
}
.thumbsRow {
  @apply grid grid-cols-4 w-full gap-1.5;
}
.thumb {
  @apply relative block w-full aspect-[4/3] overflow-hidden rounded-md border bg-gray-100 p-0 opacity-70 cursor-pointer transition-all duration-200;
}
.thumb:hover {
  @apply opacity-100;
}
.thumbActive {
  @apply opacity-100 ring-1 ring-black;
}
.blurredImg {
  @apply blur-md scale-110;
}
.thumbLockWrap {
  @apply absolute inset-0 m-auto w-5 h-5 z-[2];
}
.thumbLockIcon {
  @apply w-5 h-5 text-white/90 drop-shadow;
}
.slideLockBadge {
  @apply absolute inset-0 flex items-center justify-center z-[2] pointer-events-none;
}
.slideLockIcon {
  @apply w-10 h-10 text-white/90 drop-shadow-lg;
}
.thumbImg {
  @apply object-cover absolute top-0 left-0 w-full h-full block z-[1];
}
.fullscreenOverlay {
  @apply fixed inset-0 z-50 flex items-center justify-center bg-black;
  animation: fadeIn 0.2s;
}
.fullscreenContent {
  @apply w-full h-full overflow-auto flex justify-center;
}
.fullscreenImageCanvas {
  @apply flex flex-none items-center justify-center;
}
.fullscreenImg {
  @apply flex-none rounded-xl shadow-2xl bg-[#111] !object-contain;
  box-shadow: 0 0 40px 8px rgba(0,0,0,0.7);
}
.fullscreenCaption {
  @apply absolute bottom-6 left-1/2 -translate-x-1/2 z-10 max-w-[90%] text-center text-white text-sm sm:text-base bg-black bg-opacity-60 rounded-lg px-4 py-2;
}
.fullscreenClose {
  @apply absolute top-6 right-6 z-10 bg-black bg-opacity-60 rounded-full p-2 hover:bg-opacity-90 transition;
}
.fullscreenCloseIcon {
  @apply w-7 h-7;
}
.fullscreenZoomControl {
  @apply absolute top-4 sm:top-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 rounded-full border border-gray-200 bg-white bg-opacity-90 px-4 py-2 shadow-md;
}
.fullscreenZoomRange {
  @apply w-32 sm:w-48 cursor-pointer accent-primary-600;
}
.fullscreenZoomValue {
  @apply w-12 text-right text-sm font-medium text-black tabular-nums;
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
.playIcon {
  @apply absolute left-1/2 top-1/2 pointer-events-none z-10;
  transform: translate(-50%, -50%);
}
.playIcon svg {
  @apply w-20 h-20;
}
.playIconThumb {
  @apply absolute left-1/2 top-1/2 pointer-events-none z-10;
  transform: translate(-50%, -50%);
}
.playIconThumb svg {
  @apply w-7 h-7;
}
</style>
