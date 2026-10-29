<template>
  <div :class="$style.sectionBlock">
    <div :class="$style.sectionHeader">
      <MinusIcon class="h-5 w-5 mr-2" />
      <span :class="$style.sectionTitle">
        {{ title }}<span v-if="required"> *</span>
        <span
          v-if="titleNote"
          :class="$style.titleNote"
        >
          {{ titleNote }}
        </span>
      </span>
    </div>

    <slot name="header-extra" />

    <div
      v-if="items.length"
      :class="isVideo ? $style.videoGrid : $style.photoGrid"
    >
      <div
        v-for="(item, i) in items"
        :key="item.id || i"
        :class="isVideo ? $style.videoItem : $style.photoItem"
        :draggable="draggable"
        @dragstart="$emit('dragstart', item)"
        @dragend="$emit('dragend')"
        @click="isVideo ? openFullscreenVideo(item.url) : undefined"
      >
        <template v-if="isVideo">
          <video
            :src="item.url"
            :class="$style.videoElement"
            preload="metadata"
            :controls="false"
          />
          <PlayIcon
            :class="$style.playIcon"
            style="transform: translate(-50%, -50%)"
            :size="64"
          />
        </template>
        <CarPreviewImage
          v-else
          :src="item.thumb || item.url"
          :alt="title"
          :image-class="$style.photoImage"
          @click="openFullscreenPhoto(item.url, item.descriptions)"
        />
        <CommonButton
          type="button"
          kind="white"
          size="xs"
          :class="$style.removeBtn"
          :disabled="disabled"
          @click.stop="$emit('remove', item)"
        >
          <TrashIcon class="w-3 h-3" />
        </CommonButton>
        <div
          v-if="draggable"
          :class="$style.dragHandle"
        >
          <ArrowsUpDownIcon class="w-4 h-4" />
        </div>
      </div>
    </div>

    <div
      :class="$style.inputFileWrapper"
      @drop.prevent="$emit('drop')"
    >
      <InputFile
        :type="InputsTypeEnum.File"
        :accept="accept"
        :upload-max-filesize="uploadMaxFilesize"
        :disabled="disabled"
        :loading="loading"
        :status-message="statusMessage"
        :is-invalid="!!invalidMessage"
        :invalid-message="invalidMessage"
        :button-text="buttonText"
        :restrictions-text="restrictionsText"
        multiple
        @input="$emit('input', $event)"
        @update:model-value="$emit('clear-error')"
      />
    </div>

    <transition name="fade">
      <div
        v-if="fullscreenPhoto"
        :class="$style.fullscreenPhoto"
        @click.self="closeFullscreenPhoto"
      >
        <button
          type="button"
          :class="$style.closeFullscreenBtn"
          :aria-label="t('listing.close')"
          @click="closeFullscreenPhoto"
        >
          <XMarkIcon class="w-7 h-7 text-white" />
        </button>
        <img
          :src="fullscreenPhoto"
          :alt="title"
          :class="$style.fullscreenImage"
        >
        <div
          v-if="fullscreenCaption"
          :class="$style.fullscreenCaption"
        >
          {{ fullscreenCaption }}
        </div>
      </div>
    </transition>

    <transition name="fade">
      <div
        v-if="fullscreenVideo"
        :class="$style.fullscreenVideo"
        @click.self="closeFullscreenVideo"
      >
        <button
          type="button"
          :class="$style.closeFullscreenBtn"
          :aria-label="t('listing.close')"
          @click="closeFullscreenVideo"
        >
          <XMarkIcon class="w-7 h-7 text-white" />
        </button>
        <video
          :src="fullscreenVideo"
          controls
          autoplay
          :class="$style.fullscreenVideoElement"
        />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import { useI18n } from "vue-i18n"
import { ArrowsUpDownIcon, MinusIcon, TrashIcon, XMarkIcon } from "@heroicons/vue/24/outline"
import CommonButton from "@/components/common/Button.vue"
import CarPreviewImage from "@/components/common/CarPreviewImage.vue"
import InputFile from "@/components/form/InputFile.vue"
import PlayIcon from "@/components/icon/Play.vue"
import { InputsTypeEnum } from "@/types/form/inputsTypeEnum"
import type { MediaItem } from "@/types/form/file"

const props = withDefaults(defineProps<{
  title: string
  titleNote?: string
  required?: boolean
  items: MediaItem[]
  kind?: "photo" | "video"
  accept: string
  uploadMaxFilesize: string
  buttonText: string
  restrictionsText: string
  disabled?: boolean
  loading?: boolean
  statusMessage?: string
  invalidMessage?: string
  draggable?: boolean
}>(), {
  kind: "photo",
})

defineEmits<{
  (e: "input", files: FileList): void
  (e: "remove" | "dragstart", item: MediaItem): void
  (e: "dragend" | "drop" | "clear-error"): void
}>()

const { t, locale } = useI18n()

const isVideo = computed(() => props.kind === "video")

const fullscreenPhoto = ref<string | null>(null)
const fullscreenPhotoDescriptions = ref<Record<string, string> | null>(null)
const fullscreenVideo = ref<string | null>(null)

// Picks the caption for the current locale, falling back to any available variant.
const fullscreenCaption = computed(() => {
  const descriptions = fullscreenPhotoDescriptions.value
  if (!descriptions) {
    return ""
  }
  return descriptions[locale.value] ?? descriptions.ru ?? descriptions.zh ?? Object.values(descriptions)[0] ?? ""
})

function openFullscreenPhoto(img: string, descriptions?: Record<string, string> | null) {
  fullscreenPhoto.value = img
  fullscreenPhotoDescriptions.value = descriptions || null
}
function closeFullscreenPhoto() {
  fullscreenPhoto.value = null
  fullscreenPhotoDescriptions.value = null
}
function openFullscreenVideo(video: string) {
  fullscreenVideo.value = video
}
function closeFullscreenVideo() {
  fullscreenVideo.value = null
}
</script>

<style module>
.sectionBlock {
  @apply border border-gray-200 rounded-xl bg-white p-4 mb-4;
}

.sectionHeader {
  @apply flex items-center mb-2;
}

.sectionTitle {
  @apply text-sm font-medium;
}

.titleNote {
  @apply text-gray-500 font-normal ml-1;
}

.photoGrid {
  @apply grid grid-cols-2 sm:grid-cols-3 gap-4;
}

.photoItem {
  @apply relative w-full h-32;
}

.photoImage {
  @apply w-full h-32 object-cover rounded-lg border border-gray-200 cursor-zoom-in;
}

.videoGrid {
  @apply grid grid-cols-1 sm:grid-cols-2 gap-4;
}

.videoItem {
  @apply relative w-full h-32 cursor-pointer;
}

.videoElement {
  @apply w-full h-32 object-cover rounded-lg border border-gray-200 bg-black pointer-events-none;
}

.playIcon {
  @apply absolute left-1/2 top-1/2 z-10 pointer-events-none;
}

.removeBtn {
  @apply absolute top-1.5 right-1.5 z-10 flex items-center justify-center !p-0 !min-w-0 !h-7 !w-7 rounded-full shadow-sm bg-white/95 hover:bg-white hover:border-red-300 hover:text-red-600;
}

.dragHandle {
  @apply absolute top-2 left-2 p-1 text-white bg-black bg-opacity-50 rounded cursor-move opacity-0 hover:opacity-100 transition-opacity;
}

.photoItem:hover .dragHandle,
.videoItem:hover .dragHandle {
  @apply opacity-100;
}

.inputFileWrapper {
  @apply relative mt-4;
}

.fullscreenPhoto {
  @apply fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 p-4 bg-black bg-opacity-90;
}

.closeFullscreenBtn {
  @apply absolute top-6 right-6 z-10 bg-black bg-opacity-60 rounded-full p-2 hover:bg-opacity-90 transition;
}

.fullscreenImage {
  @apply max-w-full max-h-[85vh] rounded-xl shadow-2xl bg-[#111] object-contain;
}

.fullscreenCaption {
  @apply max-w-2xl text-center text-white text-sm sm:text-base bg-black bg-opacity-60 rounded-lg px-4 py-2;
}

.fullscreenVideo {
  @apply fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90;
}

.fullscreenVideoElement {
  @apply max-w-full max-h-full rounded-xl shadow-2xl bg-[#111] object-contain;
}
</style>
