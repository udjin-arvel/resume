<template>
  <div
    v-if="files && files.length"
    :class="[
      $style.wrapper,
      !hasText ? $style.noBorder : '',
    ]"
  >
    <template
      v-for="(file, i) in files"
      :key="file.id ?? i"
    >
      <button
        v-if="isImage(file)"
        type="button"
        :class="$style.thumbButton"
        :title="file.name"
        @click="openFullscreen(file)"
      >
        <img
          :src="file.thumb || file.url"
          :alt="file.name"
          loading="lazy"
          :class="$style.thumb"
        >
      </button>
      <a
        v-else
        :href="file.url"
        target="_blank"
        rel="noopener"
        :class="$style.link"
        :title="file.name"
      >
        {{ truncated(file.name) }}
      </a>
    </template>
  </div>

  <Teleport to="body">
    <transition name="fade">
      <div
        v-if="fullscreenUrl"
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
        <img
          :src="fullscreenUrl"
          :alt="fullscreenName"
          :class="$style.fullscreenImage"
        >
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
import { onUnmounted, ref } from "vue"
import { useI18n } from "vue-i18n"
import { XMarkIcon } from "@heroicons/vue/24/outline"
import type { ChatFile } from "@/types/common/chat"

const IMAGE_EXT = /\.(png|jpe?g|webp|gif)$/i

const props = defineProps<{
  files: ChatFile[]
  nameLimit?: number
  hasText?: boolean
}>()

const { t } = useI18n()
const fullscreenUrl = ref<string | null>(null)
const fullscreenName = ref("")

function truncated(name: string) {
  const limit = props.nameLimit ?? 15
  return name.length <= limit ? name : name.slice(0, limit) + "…"
}

function isImage(file: ChatFile) {
  if (file.mimeType?.startsWith("image/")) {
    return true
  }
  return IMAGE_EXT.test(file.name ?? "")
}

function openFullscreen(file: ChatFile) {
  fullscreenUrl.value = file.url
  fullscreenName.value = file.name
  document.body.style.overflow = "hidden"
  window.addEventListener("keydown", handleKeydown)
}

function closeFullscreen() {
  fullscreenUrl.value = null
  fullscreenName.value = ""
  document.body.style.overflow = ""
  window.removeEventListener("keydown", handleKeydown)
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === "Escape") {
    closeFullscreen()
  }
}

onUnmounted(() => {
  if (fullscreenUrl.value) {
    closeFullscreen()
  }
})
</script>

<style module>
.wrapper {
  @apply flex flex-wrap items-start gap-3 pb-2 border-b border-gray-300 mb-2;
}
.noBorder {
  @apply border-none pb-0 mb-0;
}
.link {
  @apply text-blue-600 hover:underline truncate max-w-[14rem] self-center;
}
.thumbButton {
  @apply p-0 border-0 bg-transparent cursor-zoom-in;
}
.thumb {
  @apply max-w-[220px] max-h-[180px] object-contain rounded-lg border border-gray-200 bg-gray-50 block;
}
.fullscreenOverlay {
  @apply fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-90;
}
.fullscreenClose {
  @apply absolute top-6 right-6 z-10 bg-black bg-opacity-60 rounded-full p-2 hover:bg-opacity-90 transition cursor-pointer;
}
.fullscreenCloseIcon {
  @apply w-7 h-7 text-white;
}
.fullscreenImage {
  @apply max-w-full max-h-[90vh] rounded-xl shadow-2xl bg-[#111] object-contain;
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
