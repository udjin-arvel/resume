<template>
  <form
    class="space-y-4"
    @submit.prevent="handleSubmit"
  >
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">
        {{ t('needs.modal.cancel_reason_label') }} <span class="text-red-500">*</span>
      </label>
      <textarea
        v-model="reason"
        rows="4"
        class="input"
        :placeholder="t('needs.modal.cancel_reason_placeholder')"
        required
      />
    </div>

    <div class="flex justify-end gap-3 pt-4 border-t">
      <Button
        kind="white"
        type="button"
        @click="$emit('cancel')"
      >
        {{ t('needs.modal.back') }}
      </Button>
      <Button
        kind="blue"
        type="submit"
      >
        {{ t('needs.modal.cancel_submit') }}
      </Button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { useI18n } from "vue-i18n"
import Button from "@/components/common/Button.vue"

const { t } = useI18n()

const emit = defineEmits<{
  submit: [reason: string]
  cancel: []
}>()

const reason = ref("")

function handleSubmit() {
  if (!reason.value.trim()) {
    return
  }
  emit("submit", reason.value)
}
</script>

<style scoped>
.input {
  @apply w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent;
}
</style>
