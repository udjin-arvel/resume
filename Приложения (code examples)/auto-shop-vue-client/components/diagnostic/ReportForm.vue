<template>
  <div>
    <CommonAlert
      v-if="alert"
      :alert="alert"
      :class="$style.alert"
    />

    <div :class="$style.mainBlock">
      <div :class="$style.leftColumn">
        <div :class="$style.topRow">
          <div :class="$style.switchRow">
            <ClientOnly>
              <HeadlessSwitch
                v-model="isVisible"
                :class="$style.switch"
                :disabled="isSaving"
              />
            </ClientOnly>
            <span :class="$style.switchLabel">
              {{ t("listing.report_shown_on_site") }}
            </span>
          </div>

          <Date
            v-model="inspectedAt"
            :label="t('listing.report_inspected_at')"
            :disabled-future-dates="true"
            :disabled="isSaving"
            :class="$style.dateField"
          />
        </div>

        <Textarea
          v-model="description"
          :label="t('listing.report_description')"
          :rows="4"
          :disabled="isSaving || isAnyUploading"
          :class="$style.field"
        />

        <div
          v-if="reportUrl && isVisible"
          :class="$style.linkBlock"
        >
          <span :class="$style.linkLabel">
            {{ t("listing.report_link_label") }}
          </span>
          <div :class="$style.linkRow">
            <a
              :href="reportUrl"
              target="_blank"
              rel="noopener noreferrer"
              :class="$style.linkValue"
            >{{ reportUrl }}</a>
            <CommonButton
              type="button"
              kind="lightgrey"
              size="sm"
              @click="handleCopyLink"
            >
              {{ isLinkCopied ? t("listing.report_link_copied") : t("listing.report_link_copy") }}
            </CommonButton>
          </div>
        </div>

        <CommonButton
          type="button"
          kind="black"
          :class="$style.saveBtn"
          :disabled="isSaving || isAnyUploading"
          @click="handleSave"
        >
          {{ t("listing.report_save") }}
        </CommonButton>
      </div>

      <div :class="$style.rightColumn">
        <MediaUploadSection
          :title="t('listing.report_photos')"
          :title-note="t('listing.report_photos_required')"
          accept="image/jpeg,image/png,image/webp"
          upload-max-filesize="20MB"
          :button-text="t('listing.report_choose_photo')"
          :restrictions-text="t('listing.photo_restrictions')"
          :items="photoItems"
          :disabled="isSaving || photoUpload.isUploading.value"
          :loading="photoUpload.isUploading.value"
          :invalid-message="photosError"
          @input="handlePhotoSelect"
          @remove="item => handleRemove('photos', item)"
          @clear-error="photosError = ''"
        />

        <MediaUploadSection
          :title="t('listing.report_defects')"
          accept="image/jpeg,image/png,image/webp"
          upload-max-filesize="20MB"
          :button-text="t('listing.report_choose_photo')"
          :restrictions-text="t('listing.photo_restrictions')"
          :items="defectItems"
          :disabled="isSaving || defectUpload.isUploading.value"
          :loading="defectUpload.isUploading.value"
          @input="handleDefectSelect"
          @remove="item => handleRemove('defects', item)"
        />

        <MediaUploadSection
          :title="t('listing.report_videos')"
          kind="video"
          accept="video/mp4"
          upload-max-filesize="300MB"
          :button-text="t('listing.report_choose_video')"
          :restrictions-text="t('listing.report_upload_video_hint')"
          :items="videoItems"
          :disabled="isSaving || videoUpload.isUploading.value"
          :loading="videoUpload.isUploading.value"
          @input="handleVideoSelect"
          @remove="item => handleRemove('videos', item)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import { useI18n } from "vue-i18n"
import Date from "@/components/form/Date.vue"
import Textarea from "@/components/form/Textarea.vue"
import MediaUploadSection from "@/components/form/MediaUploadSection.vue"
import { useApiListing } from "@/composables/api/useApiListing"
import { useDraftUpload } from "@/composables/useDraftUpload"
import { useCopyToClipboard } from "@/composables/useCopyToClipboard"
import type { MediaItem } from "@/types/form/file"
import type { DiagnosticReport } from "@/types/responses/diagnosticReport"
import type { Alert } from "@/types/common/alert"
import { AlertTypeEnum } from "@/types/common/alert"

const props = defineProps<{
  listingId: number
  report: DiagnosticReport | null
  listingNumber: string | null
}>()

const emit = defineEmits<{
  (e: "saved", payload: { report: DiagnosticReport, listingNumber: string | null, requestsStayOpen: boolean }): void
}>()

const { t } = useI18n()
const { updateDiagnosticReport } = useApiListing()
const { buildDiagnosticReportUrl } = useDiagnosticReportUrl()
const { copy } = useCopyToClipboard()

const report = ref<DiagnosticReport | null>(props.report)
const isVisible = ref(props.report?.is_visible ?? true)
const inspectedAt = ref<string>(props.report?.inspected_at ?? "")
const description = ref(props.report?.description || "")
const deletedMediaIds = ref<number[]>([])
const photoUpload = useDraftUpload()
const defectUpload = useDraftUpload()
const videoUpload = useDraftUpload()
const isAnyUploading = computed(() =>
  photoUpload.isUploading.value || defectUpload.isUploading.value || videoUpload.isUploading.value,
)
const isSaving = ref(false)
const alert = ref<Alert | null>(null)
const photosError = ref("")
const isLinkCopied = ref(false)

const visiblePhotos = computed(() =>
  (report.value?.photos ?? []).filter(m => !deletedMediaIds.value.includes(m.id)),
)
const visibleDefects = computed(() =>
  (report.value?.defects ?? []).filter(m => !deletedMediaIds.value.includes(m.id)),
)
const visibleVideos = computed(() =>
  (report.value?.videos ?? []).filter(m => !deletedMediaIds.value.includes(m.id)),
)

// Сохранённые media и черновики показываются одним списком плиток.
const photoItems = computed<MediaItem[]>(() => [...visiblePhotos.value, ...photoUpload.uploadedDrafts.value])
const defectItems = computed<MediaItem[]>(() => [...visibleDefects.value, ...defectUpload.uploadedDrafts.value])
const videoItems = computed<MediaItem[]>(() => [...visibleVideos.value, ...videoUpload.uploadedDrafts.value])

const hasPhotos = computed(() =>
  visiblePhotos.value.length > 0 || photoUpload.uploadedDrafts.value.length > 0,
)

const reportUrl = computed(() => buildDiagnosticReportUrl(report.value?.code))

// Черновик просто убирается из списка, сохранённое media — помечается на удаление при сохранении.
function handleRemove(collection: "photos" | "defects" | "videos", item: MediaItem) {
  const upload = { photos: photoUpload, defects: defectUpload, videos: videoUpload }[collection]

  if (upload.uploadedDrafts.value.some(draft => draft.id === item.id)) {
    upload.removeDraft(item.id)
    return
  }

  if (!deletedMediaIds.value.includes(item.id)) {
    deletedMediaIds.value.push(item.id)
  }
}

async function handleUploadSelect(
  files: FileList,
  upload: ReturnType<typeof useDraftUpload>,
  collection: string,
) {
  alert.value = null
  const result = await upload.uploadFiles(files, collection)
  if (result === "upload_failed") {
    alert.value = {
      type: AlertTypeEnum.Error,
      subtitle: t("navigation.error"),
      text: t("files.errors.upload"),
    }
  }
}

function handlePhotoSelect(files: FileList) {
  photosError.value = ""
  handleUploadSelect(files, photoUpload, "diagnostic_report_photo")
}

function handleDefectSelect(files: FileList) {
  handleUploadSelect(files, defectUpload, "diagnostic_report_defect")
}

function handleVideoSelect(files: FileList) {
  handleUploadSelect(files, videoUpload, "diagnostic_report_video")
}

async function handleCopyLink() {
  if (!reportUrl.value) {
    return
  }
  if (await copy(reportUrl.value)) {
    isLinkCopied.value = true
    window.setTimeout(() => {
      isLinkCopied.value = false
    }, 2000)
  }
}

async function handleSave() {
  if (isAnyUploading.value) {
    return
  }

  alert.value = null
  photosError.value = ""

  if (!hasPhotos.value) {
    photosError.value = t("listing.report_photos_error")
    return
  }

  isSaving.value = true
  try {
    const response = await updateDiagnosticReport(props.listingId, {
      description: description.value || null,
      inspected_at: inspectedAt.value,
      is_visible: isVisible.value,
      photo_ids: photoUpload.uploadedDrafts.value.map(d => d.id),
      defect_ids: defectUpload.uploadedDrafts.value.map(d => d.id),
      video_ids: videoUpload.uploadedDrafts.value.map(d => d.id),
      deleted_media_ids: deletedMediaIds.value,
    })
    report.value = response.data ?? null
    photoUpload.reset()
    defectUpload.reset()
    videoUpload.reset()
    deletedMediaIds.value = []

    if (report.value) {
      emit("saved", {
        report: report.value,
        listingNumber: response.listing_number ?? props.listingNumber,
        requestsStayOpen: response.message === "diagnostic_report.saved_requests_open",
      })
    }
  }
  catch (error: any) {
    if (error.status === 422 && error.data?.errors) {
      const messages = Object.values(error.data.errors).flat() as string[]
      alert.value = {
        type: AlertTypeEnum.Error,
        subtitle: t("navigation.error"),
        text: messages.join(", "),
      }
    }
    else {
      alert.value = {
        type: AlertTypeEnum.Error,
        subtitle: t("navigation.error"),
      }
    }
  }
  finally {
    isSaving.value = false
  }
}
</script>

<style module>
.alert {
  @apply mb-4;
}

.mainBlock {
  @apply flex flex-col lg:flex-row w-full gap-6;
}

.leftColumn {
  @apply w-full lg:w-1/2 border border-gray-200 rounded-xl bg-white p-4 h-fit;
}

.rightColumn {
  @apply w-full lg:w-1/2;
}

.topRow {
  @apply flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 mb-4;
}

.switchRow {
  @apply flex items-center sm:pt-7;
}

.dateField {
  @apply w-full sm:w-72;
}

.switch {
  @apply relative inline-flex h-6 w-11 items-center rounded-full bg-white border border-gray-400 transition-colors;
}

.switch[aria-checked="true"] {
  @apply bg-blue-600 border-blue-600;
}

.switch::after {
  @apply absolute h-4 w-4 rounded-full bg-gray-400 transition-transform;
  content: "";
  transform: translateX(2px);
}

.switch[aria-checked="true"]::after {
  @apply bg-white translate-x-6;
}

.switchLabel {
  @apply text-sm text-black ml-3;
}

.field {
  @apply mb-4;
}

.linkBlock {
  @apply mb-4 p-4 rounded-lg border border-gray-200 bg-gray-50;
}

.linkLabel {
  @apply block text-sm font-medium text-gray-700 mb-2;
}

.linkRow {
  @apply flex items-center gap-3;
}

.linkValue {
  @apply text-sm text-blue-600 hover:underline break-all flex-1;
}

.saveBtn {
  @apply mt-2;
}
</style>
