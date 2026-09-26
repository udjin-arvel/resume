<template>
  <div :class="$style.wrapper">
    <div
      :class="$style.media"
      role="button"
      tabindex="0"
      @click="openFullscreen"
      @keydown.enter.prevent="openFullscreen"
      @keydown.space.prevent="openFullscreen"
    >
      <img
        v-if="type === 'image'"
        :src="thumb || src"
        alt=""
        :class="$style.mediaImg"
      >
      <template v-else>
        <img
          v-if="thumb"
          :src="thumb"
          alt=""
          :class="$style.mediaImg"
        >
        <video
          v-else
          :src="src"
          :class="$style.mediaImg"
          preload="metadata"
          :controls="false"
          @play.prevent
        />
        <PlayIcon
          :class="$style.playIcon"
          :size="48"
        />
      </template>
    </div>

    <transition name="fade">
      <div
        v-if="fullscreen"
        :class="$style.fullscreenOverlay"
        @click.self="closeFullscreen"
      >
        <button
          type="button"
          :class="$style.fullscreenClose"
          :aria-label="t('actions.close')"
          @click="closeFullscreen"
        >
          <XMarkIcon :class="$style.fullscreenCloseIcon" />
        </button>

        <button
          v-if="hasGallery"
          type="button"
          :class="$style.fullscreenArrowLeft"
          :aria-label="t('common.previous')"
          @click.stop="prev"
        >
          <ChevronLeftIcon :class="$style.sliderArrowIcon" />
        </button>

        <div :class="$style.contentWrapper">
          <img
            v-if="activeType === 'image'"
            :key="activeSrc"
            :src="activeSrc"
            alt=""
            :class="$style.fullscreenImg"
          >
          <video
            v-else
            :key="`vid-${activeSrc}`"
            :src="activeSrc"
            :class="$style.fullscreenImg"
            controls
            autoplay
          />
        </div>

        <button
          v-if="hasGallery"
          type="button"
          :class="$style.fullscreenArrowRight"
          :aria-label="t('common.next')"
          @click.stop="next"
        >
          <ChevronRightIcon :class="$style.sliderArrowIcon" />
        </button>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted, type PropType } from "vue"
import { useI18n } from "vue-i18n"
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from "@heroicons/vue/24/outline"
import PlayIcon from "@/components/icon/Play.vue"

type GalleryItem = {
  url: string
  type: "image" | "video"
}

const props = defineProps({
  type: {
    type: String as PropType<"image" | "video">,
    required: true,
  },
  src: {
    type: String,
    required: true,
  },
  thumb: {
    type: String,
    default: "",
  },
  items: {
    type: Array as PropType<(string | GalleryItem)[]>,
    default: () => [],
  },
  index: {
    type: Number,
    default: 0,
  },
})

const { t } = useI18n()
const fullscreen = ref(false)
const activeIndex = ref(0)

const hasGallery = computed(() => props.items && props.items.length > 1)

const currentItem = computed(() => {
  if (!hasGallery.value || !props.items[activeIndex.value]) {
    return { url: props.src, type: props.type }
  }

  const item = props.items[activeIndex.value]

  if (typeof item === "string") {
    return { url: item, type: "image" }
  }

  return item
})

const activeSrc = computed(() => currentItem.value.url)
const activeType = computed(() => currentItem.value.type)

function openFullscreen() {
  activeIndex.value = props.index
  fullscreen.value = true
  document.body.style.overflow = "hidden"
  window.addEventListener("keydown", handleKeydown)
}

function closeFullscreen() {
  fullscreen.value = false
  document.body.style.overflow = ""
  window.removeEventListener("keydown", handleKeydown)
}

function next() {
  if (!hasGallery.value) {
    return
  }
  if (activeIndex.value < props.items.length - 1) {
    activeIndex.value++
  }
  else {
    activeIndex.value = 0
  }
}

function prev() {
  if (!hasGallery.value) {
    return
  }
  if (activeIndex.value > 0) {
    activeIndex.value--
  }
  else {
    activeIndex.value = props.items.length - 1
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === "Escape") {
    closeFullscreen()
  }
  if (e.key === "ArrowRight") {
    next()
  }
  if (e.key === "ArrowLeft") {
    prev()
  }
}

onUnmounted(() => {
  if (fullscreen.value) {
    document.body.style.overflow = ""
    window.removeEventListener("keydown", handleKeydown)
  }
})
</script>

<style module>
.wrapper {
  @apply w-full h-full;
}
.media {
  @apply relative w-full h-full cursor-zoom-in overflow-hidden bg-gray-100 rounded;
}
.mediaImg {
  @apply w-full h-full object-cover block;
}
.fullscreenOverlay {
  @apply fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-95;
  animation: fadeIn 0.2s;
}
.contentWrapper {
  @apply relative flex items-center justify-center w-full h-full p-4 md:p-12;
}
.fullscreenImg {
  @apply max-w-full max-h-full rounded-xl shadow-2xl bg-[#111] object-contain;
  box-shadow: 0 0 40px 8px rgba(0,0,0,0.7);
}
.fullscreenClose {
  @apply absolute top-6 right-6 z-20 bg-black bg-opacity-60 rounded-full p-2 hover:bg-opacity-90 transition cursor-pointer;
}
.fullscreenCloseIcon {
  @apply w-7 h-7 text-white;
}
.playIcon {
  @apply absolute left-1/2 top-1/2 pointer-events-none z-10;
  transform: translate(-50%, -50%);
}
.playIcon svg {
  @apply w-12 h-12;
}

.fullscreenArrowLeft,
.fullscreenArrowRight {
  @apply absolute top-1/2 z-20 bg-white bg-opacity-80 rounded-full p-2 shadow-md border border-gray-200 transition hover:bg-primary-600 hover:text-white flex items-center justify-center w-10 h-10 cursor-pointer;
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

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

:global(.fade-enter-active),
:global(.fade-leave-active) {
  transition: opacity 0.3s ease;
}
:global(.fade-enter-from),
:global(.fade-leave-to) {
  opacity: 0;
}
</style>
