<template>
  <Modal
    v-model="show"
    size="lg"
    :overflow-hidden="true"
  >
    <template #body>
      <h2 class="text-xl font-bold mb-4">
        {{ t('needs.modal.reject_title') }}
      </h2>
      <p class="text-base text-gray-600 mb-4">
        {{ t('needs.modal.reject_hint') }}
      </p>

      <Textarea
        v-model="reason"
        :label="t('needs.modal.reject_reason_label')"
        :rows="4"
        :limit="500"
        :show-limit="false"
        :invalid-message="reasonError"
        required
        @update:model-value="reasonError = ''"
      />

      <div class="mt-4">
        <div
          v-if="uploadedDrafts.length"
          :class="$style.photoGrid"
        >
          <div
            v-for="(draft, i) in uploadedDrafts"
            :key="draft.id || i"
            :class="$style.photoItem"
          >
            <img
              :src="draft.url"
              :alt="t('listing.photo_alt')"
              :class="$style.photoImage"
              @click="openFullscreen(draft.url)"
            >
            <Button
              type="button"
              kind="white"
              size="sm"
              class="absolute bottom-2 right-2 p-0 flex items-center justify-center rounded-md z-10"
              :disabled="isUploading"
              @click="removeDraft(draft.id)"
            >
              <TrashIcon class="w-4 h-4" />
            </Button>
          </div>
        </div>

        <InputFile
          :max-files="5"
          :upload-max-filesize="'20MB'"
          :accept="'image/jpeg,image/png,image/webp'"
          :type="InputsTypeEnum.File"
          :disabled="isUploading"
          :loading="isUploading"
          :is-invalid="!!photoError"
          :invalid-message="photoError"
          :restrictions-text="t('listing.photo_restrictions')"
          :button-text="t('listing.choose_photo')"
          multiple
          @input="handleFilesInput"
          @update:model-value="photoError = ''"
        />

        <Teleport to="body">
          <transition name="fade">
            <div
              v-if="fullscreenImage"
              :class="$style.fullscreenPhoto"
              @click.self.stop="closeFullscreen"
            >
              <Button
                kind="unset"
                size="unset"
                :class="$style.closeFullscreenBtn"
                :aria-label="t('common.close')"
                @click.stop="closeFullscreen"
              >
                <XMarkIcon class="w-7 h-7 text-white" />
              </Button>
              <img
                :src="fullscreenImage"
                :alt="t('listing.photo_alt')"
                :class="$style.fullscreenImage"
                @click.stop
              >
            </div>
          </transition>
        </Teleport>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-between">
        <Button
          kind="black"
          size="base"
          type="button"
          :disabled="submitting || isUploading || !reason.trim()"
          @click="onSubmit"
        >
          {{ t('common.send') }}
        </Button>
        <Button
          kind="lightgrey"
          size="base"
          type="button"
          :disabled="submitting"
          @click="show = false"
        >
          {{ t('needs.modal.back') }}
        </Button>
      </div>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { useI18n } from "vue-i18n"
import { XMarkIcon, TrashIcon } from "@heroicons/vue/24/outline"
import { InputsTypeEnum } from "~/types/form/inputsTypeEnum"
import Modal from "@/components/common/Modal.vue"
import Button from "@/components/common/Button.vue"
import Textarea from "@/components/form/Textarea.vue"
import InputFile from "@/components/form/InputFile.vue"
import { useDraftUpload } from "@/composables/useDraftUpload"

interface Emits {
  (e: "update:show", v: boolean): void
  (e: "submit", reason: string, draftMediaIds: number[]): void
}

defineProps<{ submitting?: boolean }>()
const emit = defineEmits<Emits>()
const { t } = useI18n()
const { uploadedDrafts, isUploading, uploadFiles, removeDraft } = useDraftUpload()

const show = defineModel<boolean>("show", { default: false })
const reason = ref("")
const reasonError = ref("")
const photoError = ref("")
const fullscreenImage = ref<string | null>(null)

const handleFilesInput = async (files: FileList) => {
  photoError.value = ""
  const error = await uploadFiles(files, "rejection_photo", 5)
  if (error === "limit_exceeded") {
    photoError.value = t("needs.modal.reject_photos_limit")
  }
  else if (error === "upload_failed") {
    photoError.value = t("files.upload_error")
  }
}

const openFullscreen = (url: string) => {
  fullscreenImage.value = url
}
const closeFullscreen = () => {
  fullscreenImage.value = null
}

function onSubmit() {
  reasonError.value = ""
  photoError.value = ""

  if (!reason.value?.trim()) {
    reasonError.value = t("needs.modal.reject_error_required")
    return
  }
  if (reason.value.length < 10) {
    reasonError.value = t("needs.modal.reject_error_min_length")
    return
  }

  emit("submit", reason.value.trim(), uploadedDrafts.value.map(d => d.id))
}
</script>

<style module>
.photoGrid {
  @apply grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4;
}

.photoItem {
  @apply relative w-full h-32;
}

.photoImage {
  @apply w-full h-32 object-cover rounded-lg border border-gray-200 cursor-zoom-in;
}

.inputFileWrapper {
  @apply relative;
}

.fullscreenPhoto {
  @apply fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-90;
}

.closeFullscreenBtn {
  @apply absolute top-6 right-6 z-10 bg-black bg-opacity-60 rounded-full p-2 hover:bg-opacity-90 transition;
}

.fullscreenImage {
  @apply max-w-full max-h-full rounded-xl shadow-2xl bg-[#111] object-contain;
}
</style>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  @apply transition-opacity duration-200;
}
.fade-enter-from,
.fade-leave-to {
  @apply opacity-0;
}
</style>
