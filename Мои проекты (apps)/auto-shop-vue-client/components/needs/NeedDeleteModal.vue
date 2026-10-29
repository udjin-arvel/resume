<template>
  <Modal
    v-model="show"
    size="sm"
    :overflow-hidden="true"
  >
    <template #body>
      <h2 class="text-xl font-bold mb-4">
        {{ t('needs.modal.delete_title') }}
      </h2>
      <p class="text-base text-gray-600 mb-4">
        {{ t('needs.modal.delete_description') }}
      </p>
    </template>

    <template #footer>
      <div class="flex justify-between gap-4">
        <Button
          kind="primary"
          size="base"
          type="button"
          :disabled="submitting"
          class="w-full"
          @click="onSubmit"
        >
          {{ t('common.delete') }}
        </Button>
        <Button
          kind="lightgrey"
          size="base"
          type="button"
          :disabled="submitting"
          class="w-full"
          @click="show = false"
        >
          {{ t('common.cancel') }}
        </Button>
      </div>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n"
import Modal from "@/components/common/Modal.vue"
import Button from "@/components/common/Button.vue"

defineProps<{
  submitting?: boolean
}>()

const emit = defineEmits<{
  (e: "update:show", v: boolean): void
  (e: "confirm"): void
}>()

const { t } = useI18n()
const show = defineModel<boolean>("show", { default: false })

function onSubmit() {
  emit("confirm")
}
</script>
