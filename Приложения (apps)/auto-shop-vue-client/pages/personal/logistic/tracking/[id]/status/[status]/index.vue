<template>
  <div :class="$style.container">
    <div :class="$style.topRow">
      <div :class="$style.leftGroup">
        <CommonBackButton :to="{ name: 'personal-logistic-tracking-id', params: { id } }" />
        <h1 :class="$style.title">
          {{ t("logistic.tracking_detail.page_title") }}
        </h1>
      </div>
    </div>

    <div :class="$style.box">
      <div :class="$style.boxRow">
        <img
          :src="carImage"
          :alt="t('logistic.tracking_detail.car_image_alt')"
          :class="$style.thumb"
        >
        <div :class="$style.details">
          <NuxtLink
            :to="{ name: 'catalog-id', params: { id: carId } }"
            :class="$style.carLink"
          >
            {{ carName }}
          </NuxtLink>
          <p :class="$style.carMeta">
            {{ carMeta }}
          </p>
        </div>
      </div>
    </div>

    <Select
      v-model="selectedStatus"
      :options="statusOptions"
      :label="t('logistic.tracking_detail.status_label')"
      :class="$style.control"
      :invalid-message="errors.get('status')"
      @update:model-value="() => errors.clear('status')"
    />

    <div :class="$style.control">
      <Textarea
        v-model="comment"
        :label="t('logistic.tracking_detail.comment_label')"
        :rows="4"
        :autoresized="true"
        :invalid-message="errors.get('comment')"
        @update:model-value="() => errors.clear('comment')"
      />
    </div>

    <div :class="$style.control">
      <h3 :class="$style.sectionTitle">
        {{ t("logistic.tracking_detail.media_title") }}
      </h3>
      <InputFile
        v-model:files="mediaFiles"
        :type="InputsTypeEnum.File"
        :multiple="true"
        mode="media"
        accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
        :restrictions-text="t('logistic.tracking_detail.available_media')"
        :loading="isUploadingMedia"
        :disabled="isUploadingMedia || isSubmitting || isLoading"
        :invalid-message="errors.get('media_file_ids')"
        :upload-errors="mediaUploadErrors"
        @input="files => { errors.clear('media_file_ids'); handleMediaInput(files) }"
        @delete="fileId => { errors.clear('media_file_ids'); handleMediaDelete(fileId) }"
        @update:files="() => errors.clear('media_file_ids')"
      />
    </div>

    <div :class="$style.control">
      <h3 :class="$style.sectionTitle">
        {{ t("logistic.tracking_detail.files_title") }}
      </h3>
      <InputFile
        v-model:files="docFiles"
        :type="InputsTypeEnum.File"
        :multiple="true"
        mode="doc"
        accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/jpeg,image/png,image/webp,.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp"
        :restrictions-text="t('logistic.tracking_detail.available_docs')"
        :loading="isUploadingDocument"
        :disabled="isUploadingDocument || isSubmitting || isLoading"
        :invalid-message="errors.get('document_file_ids')"
        :upload-errors="docUploadErrors"
        @input="files => { errors.clear('document_file_ids'); handleDocInput(files) }"
        @delete="fileId => { errors.clear('document_file_ids'); handleDocDelete(fileId) }"
        @update:files="() => errors.clear('document_file_ids')"
      />
    </div>

    <div
      v-if="canEditBuyerDocs"
      :class="$style.control"
    >
      <h3 :class="$style.sectionTitle">
        {{ t("logistic.tracking_detail.buyer_docs_title") }}
      </h3>
      <p :class="$style.sectionHint">
        {{ t("logistic.tracking_detail.buyer_docs_hint") }}
      </p>
      <InputFile
        v-model:files="buyerDocFiles"
        :type="InputsTypeEnum.File"
        :multiple="true"
        mode="doc"
        accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/jpeg,image/png,image/webp,.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp"
        :restrictions-text="t('logistic.tracking_detail.available_docs')"
        :loading="isUploadingBuyerDocument"
        :disabled="isUploadingBuyerDocument || isSubmitting || isLoading"
        :invalid-message="errors.get('buyer_document_file_ids')"
        :upload-errors="buyerDocUploadErrors"
        @input="files => { errors.clear('buyer_document_file_ids'); handleBuyerDocInput(files) }"
        @delete="fileId => { errors.clear('buyer_document_file_ids'); handleBuyerDocDelete(fileId) }"
        @update:files="() => errors.clear('buyer_document_file_ids')"
      />
    </div>

    <div :class="$style.actions">
      <Button
        kind="black"
        size="base"
        :disabled="isSubmitDisabled"
        @click="handleSubmit"
      >
        {{ t("logistic.tracking_detail.submit") }}
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue"
import { storeToRefs } from "pinia"
import Select from "~/components/form/Select.vue"
import Textarea from "~/components/form/Textarea.vue"
import InputFile from "~/components/form/InputFile.vue"
import Button from "~/components/common/Button.vue"
import { InputsTypeEnum } from "~/types/form/inputsTypeEnum"
import type { OptionBase } from "~/types/form/optionType"
import type { FileResponse } from "~/types/form/file"
import { useRoute, useI18n, useRouter } from "#imports"
import { useLogisticOrderTracking } from "~/composables/useLogisticOrderTracking"
import { LogisticOrderStatuses } from "~/constants/orderStatuses"
import type { LogisticOrderStatus } from "~/types/common/logisticOrder"
import type { LogisticOrderTrackingRequest } from "~/types/requests/logisticOrderTracking"
import type { SimpleFile } from "~/types/common/file"
import { carStubImage } from "~/constants/catalog"
import { toSnakeCaseString } from "~/utils/caseTransform"
import { RoleAdmin, RoleLogistic, RoleDirector, RoleEmployee, RoleSellerClient } from "~/constants/roles"
import { useUserStore } from "~/stores/user"

definePageMeta({
  auth: true,
  layout: "personal",
  hideTitle: true,
  roles: [RoleAdmin, RoleLogistic, RoleDirector, RoleEmployee, RoleSellerClient],
})

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const id = computed(() => String(route.params.id))
const trackingId = computed(() => Number(route.params.status || 0))

const userStore = useUserStore()
const { isBuyer, isAdmin, isLogist } = storeToRefs(userStore)

const {
  isLoading,
  isUploadingMedia,
  isUploadingDocument,
  isUploadingBuyerDocument,
  errors: errorsRef,
  fetchTracking,
  uploadPhotos,
  uploadDocuments,
  uploadBuyerDocuments,
  createTracking,
  updateTracking,
  trackingMeta,
  fetchListing,
  items,
  fetchTrackings,
  meta,
} = useLogisticOrderTracking({
  logisticOrderId: id.value,
})

const allStatuses = Object.values(LogisticOrderStatuses) as LogisticOrderStatus[]

const logisticianRestrictedStatuses = new Set<LogisticOrderStatus>([
  LogisticOrderStatuses.AwaitingBuyerData,
  LogisticOrderStatuses.AddedBuyerData,
  LogisticOrderStatuses.InvoiceIssued,
  LogisticOrderStatuses.PaymentDocsUploaded,
  LogisticOrderStatuses.AttachDispatchData,
])

const existingTrackingStatus = ref<LogisticOrderStatus | null>(null)

const hasBuyerCompletedInitialFlow = computed(() => {
  if (items.value.some(tr => tr.status === LogisticOrderStatuses.PaymentDocsUploaded)) {
    return true
  }

  if (currentOrderStatus.value && currentOrderStatus.value !== LogisticOrderStatuses.Incident) {
    const currentIndex = allStatuses.indexOf(currentOrderStatus.value)
    const paymentIndex = allStatuses.indexOf(LogisticOrderStatuses.PaymentDocsUploaded)

    if (currentIndex > paymentIndex) {
      return true
    }
  }

  return false
})

const currentOrderStatus = computed<LogisticOrderStatus | null>(() => {
  return meta.value?.order?.status ?? null
})

const allowedStatuses = computed<LogisticOrderStatus[]>(() => {
  let statuses: LogisticOrderStatus[] = []

  if (isBuyer.value) {
    statuses = [LogisticOrderStatuses.AttachDispatchData]
  }
  else if (
    (isAdmin.value || isLogist.value)
    && currentOrderStatus.value === LogisticOrderStatuses.PreparedForRuDispatch
  ) {
    statuses = [LogisticOrderStatuses.AttachDispatchData, LogisticOrderStatuses.Incident]
  }
  else if (
    !hasBuyerCompletedInitialFlow.value
    || currentOrderStatus.value === LogisticOrderStatuses.PreparedForRuDispatch
  ) {
    statuses = [LogisticOrderStatuses.Incident]
  }
  else {
    statuses = allStatuses.filter(status => !logisticianRestrictedStatuses.has(status))
  }

  if (existingTrackingStatus.value && !statuses.includes(existingTrackingStatus.value)) {
    statuses = [existingTrackingStatus.value, ...statuses]
  }

  return statuses
})

const statusOptions = computed<OptionBase[]>(() =>
  allowedStatuses.value.map((value, index) => ({
    id: index + 1,
    value,
    name: t(`order_status.default.${value}`),
    disabled: false,
  })),
)

const selectedStatus = ref<string>("")

watch(
  statusOptions,
  (options) => {
    const values = options.map(o => String(o.value))
    if (!values.includes(selectedStatus.value)) {
      selectedStatus.value = ""
    }
  },
  { immediate: true },
)

const comment = ref<string>("")
const mediaFiles = ref<FileResponse[]>([])
const docFiles = ref<FileResponse[]>([])
const buyerDocFiles = ref<FileResponse[]>([])

const canEditBuyerDocs = computed(
  () =>
    (isAdmin.value || isLogist.value)
    && selectedStatus.value === LogisticOrderStatuses.PreparedForRuDispatch,
)

const errors = computed(() => errorsRef.value)

const carImage = computed(() => trackingMeta.value?.image || carStubImage)
const carName = computed(() => trackingMeta.value?.name || "")
const carId = computed<number | null>(() => trackingMeta.value?.id ?? null)

const carMeta = computed(() => {
  const meta = trackingMeta.value
  if (!meta) {
    return ""
  }

  const parts: string[] = []

  if (meta.shortPowerType) {
    parts.push(t(`cars.power_type.${toSnakeCaseString(meta.shortPowerType)}`))
  }
  if (meta.shortGearbox) {
    parts.push(t(`cars.gearbox.${toSnakeCaseString(meta.shortGearbox)}`))
  }
  if (meta.shortDriveType) {
    parts.push(t(`cars.drive_type.${toSnakeCaseString(meta.shortDriveType)}`))
  }
  if (meta.year) {
    parts.push(String(meta.year))
  }

  return parts.join(", ")
})

function simpleFileToFileResponse(file: SimpleFile): FileResponse {
  return {
    id: file.id,
    name: file.name,
    url: file.url,
    mime_type: file.mimeType,
  } as unknown as FileResponse
}

function simpleFilesToFileResponses(files: SimpleFile[]): FileResponse[] {
  return files.map(simpleFileToFileResponse)
}

onMounted(async () => {
  await fetchTrackings()

  if (trackingId.value !== 0) {
    const tracking = await fetchTracking(trackingId.value)
    if (tracking) {
      existingTrackingStatus.value = tracking.status as LogisticOrderStatus
      selectedStatus.value = tracking.status as string
      comment.value = tracking.comment || ""
      mediaFiles.value = simpleFilesToFileResponses(tracking.media)
      docFiles.value = simpleFilesToFileResponses(tracking.documents)
      buyerDocFiles.value = simpleFilesToFileResponses(tracking.buyerDocuments ?? [])
    }
  }
  else {
    await fetchListing()
  }
})

const isSubmitting = ref(false)

const isSubmitDisabled = computed(
  () =>
    isSubmitting.value
    || isLoading.value
    || isUploadingMedia.value
    || isUploadingDocument.value
    || isUploadingBuyerDocument.value,
)

const mediaUploadErrors = ref<{ name: string, message: string }[]>([])

async function handleMediaInput(filesList: FileList | null | undefined) {
  if (!filesList || !filesList.length) {
    return
  }

  mediaUploadErrors.value = []

  const result = await uploadPhotos(filesList)
  result?.uploaded.forEach(({ value }) => mediaFiles.value.push(simpleFileToFileResponse(value)))
  mediaUploadErrors.value = result?.failed.map(({ file, message }) => ({ name: file.name, message })) ?? []
}

const docUploadErrors = ref<{ name: string, message: string }[]>([])

async function handleDocInput(filesList: FileList | null | undefined) {
  if (!filesList || !filesList.length) {
    return
  }

  docUploadErrors.value = []

  const result = await uploadDocuments(filesList)
  result?.uploaded.forEach(({ value }) => docFiles.value.push(simpleFileToFileResponse(value)))
  docUploadErrors.value = result?.failed.map(({ file, message }) => ({ name: file.name, message })) ?? []
}

const buyerDocUploadErrors = ref<{ name: string, message: string }[]>([])

async function handleBuyerDocInput(filesList: FileList | null | undefined) {
  if (!filesList || !filesList.length) {
    return
  }

  buyerDocUploadErrors.value = []

  const result = await uploadBuyerDocuments(filesList)
  result?.uploaded.forEach(({ value }) => buyerDocFiles.value.push(simpleFileToFileResponse(value)))
  buyerDocUploadErrors.value = result?.failed.map(({ file, message }) => ({ name: file.name, message })) ?? []
}

function handleMediaDelete(fileId: number) {
  mediaFiles.value = mediaFiles.value.filter(file => file.id !== fileId)
}

function handleDocDelete(fileId: number) {
  docFiles.value = docFiles.value.filter(file => file.id !== fileId)
}

function handleBuyerDocDelete(fileId: number) {
  buyerDocFiles.value = buyerDocFiles.value.filter(file => file.id !== fileId)
}

async function handleSubmit() {
  if (!selectedStatus.value) {
    return
  }

  if (isUploadingMedia.value || isUploadingDocument.value) {
    return
  }

  const selected = selectedStatus.value as LogisticOrderStatus
  if (!allowedStatuses.value.includes(selected)) {
    return
  }

  isSubmitting.value = true
  errorsRef.value.clear()

  try {
    const mediaFileIds = mediaFiles.value
      .map(file => file.id)
      .filter((id): id is number => Boolean(id))

    const documentFileIds = docFiles.value
      .map(file => file.id)
      .filter((id): id is number => Boolean(id))

    const buyerDocumentFileIds = canEditBuyerDocs.value
      ? buyerDocFiles.value
          .map(file => file.id)
          .filter((id): id is number => Boolean(id))
      : undefined

    const payload: LogisticOrderTrackingRequest = {
      status: selected,
      comment: comment.value || null,
      mediaFileIds,
      documentFileIds,
      buyerDocumentFileIds,
    }

    const result = trackingId.value === 0
      ? await createTracking(payload)
      : await updateTracking(trackingId.value, payload)

    if (result?.id) {
      await router.push({
        name: "personal-logistic-tracking-id",
        params: { id: id.value },
      })
    }
  }
  finally {
    isSubmitting.value = false
  }
}
</script>

<style module>
.container {
  @apply w-full;
}
@media (min-width: 1024px) {
  .container {
    width: 66.666667%;
  }
}
.topRow {
  @apply flex items-center justify-between;
}
.leftGroup {
  @apply flex items-center gap-3;
}
.title {
  font-size: 2.5rem;
  @apply font-bold leading-tight;
}
.box {
  @apply w-full bg-white rounded-md mt-6;
}
.boxRow {
  @apply flex flex-wrap items-center gap-6 py-4 pr-4 pl-0;
}
.thumb {
  @apply w-48 h-32 object-cover rounded border border-gray-200 flex-shrink-0;
}
.details {
  @apply flex flex-col min-w-0;
}
.carLink {
  @apply text-blue-600 hover:text-blue-700 font-medium truncate;
}
.carMeta {
  @apply text-gray-500;
}
.control {
  @apply mt-6;
}
.sectionTitle {
  @apply block text-sm font-medium text-gray-700 mb-2;
}
.sectionHint {
  @apply text-sm text-gray-500 mb-2 -mt-1;
}
.actions {
  @apply mt-8;
}
@media (max-width: 767px) {
  .boxRow {
    @apply flex-col items-stretch gap-4 pr-4 pl-0 py-4;
  }
}
</style>
