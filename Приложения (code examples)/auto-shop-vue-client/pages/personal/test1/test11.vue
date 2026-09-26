<template>
  <div>
    <Form>
      <InputFile
        v-model:files="files"
        :label="t('files.uploadLabel')"
        :max-files="5"
        :upload-max-filesize="'10MB'"
        :accept="'image/jpeg,image/png,application/pdf'"
        :type="InputsTypeEnum.File"
      />
    </Form>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { useI18n } from "vue-i18n"
import InputFile from "@/components/form/InputFile.vue"
import { InputsTypeEnum } from "~/types/form/inputsTypeEnum"
import type { FileResponse } from "~/types/form/file"

definePageMeta({
  layout: "personal",
  auth: true,
})

const { t } = useI18n()
const files = ref<FileResponse[]>([])
</script>

<style module></style>
