<template>
  <div>
    <div :class="$style.header">
      <div :class="$style.titleRow">
        <CommonBackButton :to="{ name: 'personal-logistic-tracking-id', params: { id: orderId } }" />
        <div>
          <h1 :class="$style.title">
            {{ t('logistic.payment_docs.title') }}
          </h1>
        </div>
      </div>
    </div>

    <div :class="$style.wrapper">
      <div :class="$style.container">
        <UiWarningBlock kind="info">
          {{ t('logistic.payment_docs.helper') }}
        </UiWarningBlock>
        <div :class="$style.section">
          <InputFile
            v-model:files="docsForView"
            mode="doc"
            :max-files="5"
            :accept="'image/jpeg,image/png,application/pdf'"
            :upload-max-filesize="'50MB'"
            :type="InputsTypeEnum.File"
            :disabled="isSaving || isUploading"
            :loading="isUploading"
            :multiple="true"
            :button-text="t('logistic.payment_docs.add_button')"
            :restrictions-text="t('logistic.payment_docs.doc_restrictions')"
            :upload-errors="uploadErrors"
            @input="handleFileInput"
            @delete="handleDeleteFile"
          />
        </div>

        <Button
          kind="black"
          :disabled="isSaving || isUploading || fileIds.length === 0"
          @click="handleSave"
        >
          {{ t('common.save') }}
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { useI18n } from "vue-i18n"
import { useRoute, useRouter } from "vue-router"
import InputFile from "@/components/form/InputFile.vue"
import InputsTypeEnum from "@/types/form/inputsTypeEnum"
import Button from "@/components/common/Button.vue"
import UiWarningBlock from "@/components/ui/UiWarningBlock.vue"
import { useLogistic } from "~/composables/useLogistic"
import { RoleEmployee, RoleDirector, RoleAdmin, RoleLogistic } from "~/constants/roles"

definePageMeta({
  auth: true,
  roles: [RoleEmployee, RoleDirector, RoleAdmin, RoleLogistic],
  layout: "personal",
  hideTitle: true,
})

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const orderId = computed(() => Number(route.params.id))

const {
  paymentDocs: docsForView,
  paymentFileIds: fileIds,
  isUploadingPayment: isUploading,
  isSavingPayment: isSaving,
  loadPaymentDocs,
  uploadPaymentFiles,
  removePaymentFile,
  submitPaymentDocs,
} = useLogistic()

const uploadErrors = ref<{ name: string, message: string }[]>([])

async function handleFileInput(fileList: FileList | null | undefined) {
  if (!fileList?.length) {
    return
  }

  uploadErrors.value = []

  const result = await uploadPaymentFiles(fileList)
  uploadErrors.value = result.failed.map(({ file, message }) => ({ name: file.name, message }))
}

function handleDeleteFile(id: number) {
  removePaymentFile(id)
}

async function handleSave() {
  if (isUploading.value || fileIds.value.length === 0) {
    return
  }
  await submitPaymentDocs(orderId.value)
  router.push({ name: "personal-logistic" })
}

onMounted(() => loadPaymentDocs(orderId.value))
</script>

<style module>
.header {
  @apply flex items-start justify-between gap-4 mb-6;
}
.title {
  @apply text-3xl font-bold leading-tight;
}
.titleRow {
  @apply flex items-center gap-3;
}
.wrapper {
  @apply flex flex-col lg:flex-row gap-4;
}
.container {
  @apply w-full lg:w-1/2 pr-4;
}
.section {
  @apply mb-8 bg-white rounded-lg border border-gray-200 p-6 flex flex-col gap-y-6;
}
</style>
