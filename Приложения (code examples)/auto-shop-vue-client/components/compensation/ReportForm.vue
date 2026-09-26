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
          :autoresized="true"
          :label="t('listing.report_description')"
          :rows="4"
          :disabled="isSaving"
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
          :disabled="isSaving || isUploadingDocuments || photoUpload.isUploading.value"
          @click="handleSave"
        >
          {{ t("listing.report_save") }}
        </CommonButton>
      </div>

      <div :class="$style.rightColumn">
        <MediaUploadSection
          :title="t('listing.document_photos')"
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

        <div :class="$style.documentSection">
          <div :class="$style.sectionHeader">
            <MinusIcon class="h-5 w-5 mr-2" />
            <span :class="$style.sectionTitle">
              {{ t("listing.documents") }}
            </span>
          </div>

          <InputFile
            v-model:files="documents"
            :label="t('files.uploadLabelMultiple')"
            :max-files="5"
            :upload-max-filesize="'20MB'"
            :multiple="true"
            mode="doc"
            accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.pdf,.doc,.docx,.xls,.xlsx"
            :restrictions-text="t('listing.compensation_report_document_available_files')"
            :type="InputsTypeEnum.File"
            :loading="isUploadingDocuments"
            :disabled="isSaving || isUploadingDocuments"
            :invalid-message="documentsError"
            :upload-errors="documentUploadErrors"
            @input="handleDocumentSelect"
            @delete="handleDocumentDelete"
            @update:files="documentsError = ''"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import { useI18n } from "vue-i18n"
import { MinusIcon } from "@heroicons/vue/24/outline"
import Date from "@/components/form/Date.vue"
import Textarea from "@/components/form/Textarea.vue"
import { useApiListing } from "@/composables/api/useApiListing"
import type { DraftFileData } from "@/composables/api/useApiUpload"
import { useDraftUpload } from "@/composables/useDraftUpload"
import { useBatchDraftUpload } from "@/composables/useBatchDraftUpload"
import { useCopyToClipboard } from "@/composables/useCopyToClipboard"
import type { FileResponse, MediaItem } from "@/types/form/file"
import type { CompensationReport } from "@/types/responses/compensationReport"
import type { Alert } from "@/types/common/alert"
import { AlertTypeEnum } from "@/types/common/alert"
import InputFile from "~/components/form/InputFile.vue"
import { InputsTypeEnum } from "~/types/form/inputsTypeEnum"
import MediaUploadSection from "~/components/form/MediaUploadSection.vue"

const props = defineProps<{
  listingId: number
  report: CompensationReport | null
  listingNumber: string | null
}>()

const emit = defineEmits<{
  (e: "saved", payload: { report: CompensationReport, listingNumber: string | null, requestsStayOpen: boolean }): void
}>()

const { t } = useI18n()
const { updateCompensationReport } = useApiListing()
const { uploadBatch } = useBatchDraftUpload()
const { buildCompensationReportUrl } = useCompensationReportUrl()
const { copy } = useCopyToClipboard()

const report = ref<CompensationReport | null>(props.report)
const isVisible = ref(props.report?.is_visible ?? true)
const inspectedAt = ref<string>(props.report?.inspected_at ?? "")
const description = ref(props.report?.description || "")
const deletedMediaIds = ref<number[]>([])
const photoUpload = useDraftUpload()
const uploadedDocumentIds = ref<number[]>([])
const isUploadingDocuments = ref(false)
const isSaving = ref(false)
const alert = ref<Alert | null>(null)
const documentsError = ref("")
const photosError = ref("")
const documentUploadErrors = ref<{ name: string, message: string }[]>([])
const isLinkCopied = ref(false)
const MAX_DOCUMENTS = 5

function toFileResponse(document: { id: number, url: string, name?: string, mime_type?: string | null }): FileResponse {
  return {
    id: document.id,
    uuid: "",
    name: document.name || decodeURIComponent(document.url.split("/").pop()?.split("?")[0] || `document-${document.id}`),
    size: 0,
    mime_type: document.mime_type || "application/octet-stream",
    url: document.url,
    show_url: document.url,
    collection: "compensation_report_document",
  }
}

function draftToFileResponse(draft: DraftFileData, source: File): FileResponse {
  return toFileResponse({
    id: draft.id,
    url: draft.url || "",
    name: draft.name || source.name,
    mime_type: draft.mimeType || source.type,
  })
}

const documents = ref<FileResponse[]>((props.report?.documents ?? []).map(toFileResponse))
const visiblePhotos = computed(() =>
  (report.value?.photos ?? []).filter(photo => !deletedMediaIds.value.includes(photo.id)),
)
const photoItems = computed<MediaItem[]>(() => [...visiblePhotos.value, ...photoUpload.uploadedDrafts.value])
const hasPhotos = computed(() => photoItems.value.length > 0)

const reportUrl = computed(() => buildCompensationReportUrl(report.value?.code))

function handleRemove(_collection: "photos", item: MediaItem) {
  if (photoUpload.uploadedDrafts.value.some(draft => draft.id === item.id)) {
    photoUpload.removeDraft(item.id)
    return
  }

  if (!deletedMediaIds.value.includes(item.id)) {
    deletedMediaIds.value.push(item.id)
  }
}

async function handlePhotoSelect(files: FileList) {
  alert.value = null
  photosError.value = ""

  const result = await photoUpload.uploadFiles(files, "compensation_report_photo")
  if (result === "upload_failed") {
    alert.value = {
      type: AlertTypeEnum.Error,
      subtitle: t("navigation.error"),
      text: t("files.errors.upload"),
    }
  }
}

async function handleDocumentSelect(files: FileList | null | undefined) {
  if (!files?.length) {
    return
  }

  alert.value = null
  documentsError.value = ""
  documentUploadErrors.value = []

  const availableSlots = MAX_DOCUMENTS - documents.value.length
  const selectedFiles = Array.from(files)
  if (selectedFiles.length > availableSlots) {
    selectedFiles.slice(Math.max(availableSlots, 0)).forEach((file) => {
      documentUploadErrors.value.push({
        name: file.name,
        message: t("files.errors.maxFiles", { max: MAX_DOCUMENTS }),
      })
    })
  }

  isUploadingDocuments.value = true
  try {
    const result = await uploadBatch(
      selectedFiles.slice(0, Math.max(availableSlots, 0)),
      "compensation_report_document",
    )
    result.uploaded.forEach(({ file, draft }) => {
      documents.value.push(draftToFileResponse(draft, file))
      uploadedDocumentIds.value.push(draft.id)
    })
    documentUploadErrors.value.push(...result.failed.map(({ file }) => ({
      name: file.name,
      message: t("files.errors.upload"),
    })))
  }
  finally {
    isUploadingDocuments.value = false
  }
}

function handleDocumentDelete(fileId: number) {
  documents.value = documents.value.filter(file => file.id !== fileId)

  if (uploadedDocumentIds.value.includes(fileId)) {
    uploadedDocumentIds.value = uploadedDocumentIds.value.filter(id => id !== fileId)
  }
  else if (!deletedMediaIds.value.includes(fileId)) {
    deletedMediaIds.value.push(fileId)
  }
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
  if (isUploadingDocuments.value || photoUpload.isUploading.value) {
    return
  }

  alert.value = null
  photosError.value = ""

  if (!hasPhotos.value) {
    photosError.value = t("listing.compensation_report_photos_error")
    return
  }

  isSaving.value = true
  try {
    const response = await updateCompensationReport(props.listingId, {
      description: description.value || null,
      inspected_at: inspectedAt.value,
      is_visible: isVisible.value,
      photo_ids: photoUpload.uploadedDrafts.value.map(photo => photo.id),
      document_ids: uploadedDocumentIds.value,
      deleted_media_ids: deletedMediaIds.value,
    })
    report.value = response.data ?? null
    photoUpload.reset()
    documents.value = (report.value?.documents ?? []).map(toFileResponse)
    uploadedDocumentIds.value = []
    deletedMediaIds.value = []

    if (report.value) {
      emit("saved", {
        report: report.value,
        listingNumber: response.listing_number ?? props.listingNumber,
        requestsStayOpen: response.message === "compensation_report.saved_requests_open",
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

.documentSection {
  @apply border border-gray-200 rounded-xl bg-white p-4 mb-4;
}

.sectionHeader {
  @apply flex items-center mb-2;
}

.sectionTitle {
  @apply text-sm font-medium;
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
