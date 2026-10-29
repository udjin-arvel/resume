<template>
  <Modal
    v-model="show"
    size="lg"
    :overflow-hidden="true"
  >
    <template #body>
      <h2 class="text-xl font-bold mb-4">
        {{ isCancel ? t('needs.modal.cancel_title') : t('needs.modal.complete_title') }}
      </h2>
      <p
        v-if="isCancel"
        class="text-base text-gray-600 mb-4 whitespace-pre-line"
      >
        {{ t('needs.modal.cancel_description') }}
      </p>
      <p
        v-else
        class="text-base text-gray-600 mb-4"
      >
        {{ t('needs.modal.complete_description') }}
      </p>

      <Textarea
        v-if="isCancel"
        v-model="reason"
        :label="t('needs.modal.reason_label_required')"
        :rows="4"
        :limit="500"
        :show-limit="false"
        :invalid-message="reasonError"
        @update:model-value="reasonError = ''"
      />
      <p
        v-if="isCancel"
        class="mt-2 text-xs text-gray-500 whitespace-pre-line"
      >
        {{ t('needs.modal.admin_note') }}
      </p>
    </template>

    <template #footer>
      <div class="flex justify-between">
        <Button
          :kind="isCancel ? 'primary' : 'black'"
          size="base"
          type="button"
          :disabled="submitting"
          @click="onSubmit"
        >
          {{ t('common.confirm') }}
        </Button>
        <Button
          kind="lightgrey"
          size="base"
          type="button"
          :disabled="submitting"
          @click="show = false"
        >
          {{ t('common.back') }}
        </Button>
      </div>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed } from "vue"
import { useI18n } from "vue-i18n"
import Modal from "@/components/common/Modal.vue"
import Button from "@/components/common/Button.vue"
import Textarea from "@/components/form/Textarea.vue"

interface Emits {
  (e: "update:show", v: boolean): void
  (e: "submit", payload: { reason?: string }): void
}

const props = defineProps<{
  mode: "cancel" | "complete"
  submitting?: boolean
}>()

const emit = defineEmits<Emits>()
const { t } = useI18n()

const show = defineModel<boolean>("show", { default: false })
const isCancel = computed(() => props.mode === "cancel")

const reason = ref<string>("")
const reasonError = ref<string>("")

function onSubmit() {
  if (isCancel.value) {
    if (!reason.value?.trim()) {
      reasonError.value = t("validation.required")
      return
    }
    emit("submit", { reason: reason.value.trim() })
  }
  else {
    emit("submit", {})
  }
}
</script>
