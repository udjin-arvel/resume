<template>
  <div>
    <div
      v-if="mode === 'media' && mediaFiles.length"
      class="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4"
    >
      <div
        v-for="(file, i) in mediaFiles"
        :key="i"
        class="relative w-full h-32 mb-3"
      >
        <template v-if="isImage(file.mime_type)">
          <img
            :src="file.url"
            :alt="file.name"
            class="w-full h-32 object-cover rounded-lg border border-gray-200 cursor-zoom-in"
            @click="openFullscreen(file.url, file.mime_type)"
          >
        </template>
        <template v-else-if="isVideo(file.mime_type)">
          <video
            :src="file.url"
            class="w-full h-32 object-cover rounded-lg border border-gray-200 bg-black pointer-events-none"
            preload="metadata"
            :controls="false"
          />
          <PlayIcon
            class="absolute left-1/2 top-1/2 z-10 pointer-events-none"
            style="transform: translate(-50%, -50%);"
            :size="64"
          />
        </template>
        <CommonButton
          type="button"
          kind="white"
          size="xs"
          :class="$style.removeBtn"
          :disabled="disabled"
          @click.stop="$emit('delete', file.id)"
        >
          <TrashIcon class="w-3 h-3" />
        </CommonButton>
      </div>
    </div>

    <div
      v-if="mode === 'doc' && files.length"
      class="bg-white border border-gray-300 rounded-lg p-3 mb-4"
    >
      <div class="space-y-2">
        <div
          v-for="(file, i) in files"
          :key="i"
          class="flex items-center border border-gray-300 rounded-md px-3 py-1.5 bg-white w-fit max-w-full"
        >
          <span class="text-sm text-gray-700 mr-2 min-w-0 flex-1 truncate">
            {{ file.name }}
          </span>
          <button
            type="button"
            class="p-1 text-gray-500 hover:text-red-500 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="disabled"
            @click="$emit('delete', file.id)"
          >
            <XMarkIcon class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <transition name="fade">
      <div
        v-if="fullscreenMedia"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90"
        @click.self="closeFullscreen"
      >
        <button
          type="button"
          class="absolute top-6 right-6 z-10 bg-black bg-opacity-60 rounded-full p-2 hover:bg-opacity-90 transition"
          aria-label="Закрыть"
          @click="closeFullscreen"
        >
          <XMarkIcon class="w-7 h-7 text-white" />
        </button>
        <template v-if="fullscreenMediaType && isImage(fullscreenMediaType)">
          <img
            :src="fullscreenMedia"
            :alt="fullscreenMedia"
            class="max-w-full max-h-full rounded-xl shadow-2xl bg-[#111] object-contain"
          >
        </template>
        <template v-else-if="fullscreenMediaType && isVideo(fullscreenMediaType)">
          <video
            :src="fullscreenMedia"
            controls
            autoplay
            class="max-w-full max-h-full rounded-xl shadow-2xl bg-[#111] object-contain"
          />
        </template>
      </div>
    </transition>

    <div
      :class="[
        $style.wrapper,
        isInvalid && $style.wrapperIsInvalid,
        isDragging && $style.wrapperIsDragging,
      ]"
      @dragenter.prevent="onDragEnter"
      @dragover.prevent="onDragOver"
      @dragleave.prevent="onDragLeave"
      @drop.prevent="onDrop"
    >
      <div :class="$style.spacer">
        <div :class="$style.text">
          <label :for="uuid">
            <CommonButton
              type="button"
              kind="lightgrey"
              :disabled="disabled"
              class="pointer-events-none"
            >
              <PlusIcon class="w-4 h-4 mr-2" />
              {{ buttonText || t('files.upload_file') }}
            </CommonButton>
            <input
              :id="uuid"
              ref="fileInput"
              :name="name"
              type="file"
              :accept="accept"
              class="sr-only"
              :disabled="disabled"
              :multiple="multiple"
              @change="handleFileInputChange"
            >
          </label>
        </div>
        <p :class="$style.restrictions">
          {{ isDragging ? t('files.drop_here') : t('files.drag') }}
        </p>
        <p :class="$style.restrictions">
          {{ restrictionsText || '' }}
        </p>
      </div>

      <div
        class="absolute inset-0 cursor-pointer"
        @click="triggerFileInput"
      />
    </div>
    <div
      v-if="multiple && uploadErrors && uploadErrors.length > 0"
      class="mt-3 space-y-2"
    >
      <div
        v-for="(err, idx) in uploadErrors"
        :key="idx"
        class="flex items-start gap-2 text-sm text-red-600 bg-red-50 p-2 rounded border border-red-100"
      >
        <XCircleIcon class="w-5 h-5 flex-shrink-0" />
        <div class="flex flex-col min-w-0">
          <span class="font-medium break-all">{{ err.name }}</span>
          <span class="text-xs opacity-80 break-words">{{ err.message }}</span>
        </div>
      </div>
    </div>
    <div
      v-if="selectionError"
      class="mt-2 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800"
    >
      {{ selectionError }}
    </div>
    <div
      v-if="loading"
      class="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800"
    >
      {{ t("files.loading") }}
    </div>
    <div
      v-else-if="isInvalid"
      class="mt-2 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800"
    >
      {{ invalidMessage }}
    </div>
    <div
      v-else-if="visibleStatus"
      class="mt-2 p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-800"
    >
      {{ visibleStatus }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from "vue"
import { useI18n } from "vue-i18n"
import { TrashIcon, XMarkIcon, PlusIcon, XCircleIcon } from "@heroicons/vue/24/outline"
import type { FileResponse } from "~/types/form/file"
import type { FileInput } from "~/types/form/inputsType"
import { useFormElements } from "~/composables/useFormElements"
import CommonButton from "~/components/common/Button.vue"
import PlayIcon from "~/components/icon/Play.vue"

const emit = defineEmits(["input", "update:files", "delete"])

const props = defineProps<FileInput & {
  mode?: "media" | "doc"
  invalidMessage?: string
  clientId?: number
  buttonText?: string
  restrictionsText?: string
  loading?: boolean
  statusMessage?: string
  autoDismissMs?: number
  multiple?: boolean
  currentFilesCount?: number
  uploadErrors?: Array<{ name: string, message: string }>
}>()

const { isInvalid, uuid } = useFormElements(props)

const files = defineModel<FileResponse[]>("files", { default: [] })

const { t } = useI18n()
const fullscreenMedia = ref<string | null>(null)
const fullscreenMediaType = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const selectionError = ref("")
const mediaFiles = computed(() => files.value.filter(file => isImage(file.mime_type) || isVideo(file.mime_type)))

const isImage = (mimeType: string | null): boolean => mimeType?.startsWith("image/") ?? false
const isVideo = (mimeType: string | null): boolean => mimeType?.startsWith("video/") ?? false

const accept = computed(() => props.accept || "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png,video/mp4")

const visibleStatus = ref<string | null>(null)
let hideTimer: number | null = null

const scheduleHide = () => {
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
  const delay = props.autoDismissMs ?? 3000
  if (delay > 0 && visibleStatus.value) {
    hideTimer = window.setTimeout(() => {
      visibleStatus.value = null
      hideTimer = null
    }, delay) as unknown as number
  }
}

watch(
  () => props.statusMessage,
  (val) => {
    if (val) {
      visibleStatus.value = val
      scheduleHide()
    }
    else {
      visibleStatus.value = null
      if (hideTimer) {
        clearTimeout(hideTimer)
        hideTimer = null
      }
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
})

const openFullscreen = (url: string, mimeType: string) => {
  fullscreenMedia.value = url
  fullscreenMediaType.value = mimeType
}

const closeFullscreen = () => {
  fullscreenMedia.value = null
  fullscreenMediaType.value = null
}

const triggerFileInput = () => {
  if (fileInput.value && !props.disabled) {
    fileInput.value.click()
  }
}

const onDragEnter = (e: DragEvent) => {
  if (props.disabled) {
    return
  }
  isDragging.value = true
}

const onDragOver = (e: DragEvent) => {
  if (props.disabled) {
    return
  }
  isDragging.value = true
}

const onDragLeave = (e: DragEvent) => {
  if (props.disabled) {
    return
  }
  isDragging.value = false
}

const onDrop = (e: DragEvent) => {
  if (props.disabled) {
    return
  }
  isDragging.value = false
  const droppedFiles = e.dataTransfer?.files
  if (droppedFiles && droppedFiles.length > 0) {
    emitSelectedFiles(droppedFiles)
  }
}

const emitSelectedFiles = (selectedFiles: FileList) => {
  const maxFiles = props.maxFiles
  const currentFilesCount = props.currentFilesCount ?? files.value.length

  if (maxFiles && currentFilesCount + selectedFiles.length > maxFiles) {
    selectionError.value = t("files.limit_is_max", { n: maxFiles })
    return
  }

  selectionError.value = ""
  emit("input", selectedFiles)
}

const handleFileInputChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files) {
    emitSelectedFiles(target.files)
    target.value = ""
  }
}
</script>

<script lang="ts">
export default {
  inheritAttrs: false,
}
</script>

<style module>
.wrapper {
  @apply flex justify-center rounded-md border-2 border-dashed border-gray-300 px-6 pt-5 pb-6 transition-colors duration-200 relative;
  background-color: #f5f5f5;
  margin-top: 1rem;
}
.wrapperIsInvalid {
  @apply border-red-600;
}
.wrapperIsDragging {
  @apply border-blue-500 bg-blue-50;
}
.spacer {
  @apply space-y-1 text-center pointer-events-none;
  position: relative;
  z-index: 10;
}
.text {
  @apply flex text-sm text-gray-600 justify-center;
}
.restrictions {
  @apply text-xs text-gray-500;
}
.removeBtn {
  @apply absolute top-1.5 right-1.5 z-10 flex items-center justify-center !p-0 !min-w-0 !h-7 !w-7 rounded-full shadow-sm bg-white/95 hover:bg-white hover:border-red-300 hover:text-red-600;
}
.invalidMessage {
  @apply mt-2 text-sm text-red-600;
}
</style>
