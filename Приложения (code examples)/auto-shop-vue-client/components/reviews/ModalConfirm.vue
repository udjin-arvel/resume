<template>
  <Modal
    :model-value="isOpen"
    size="sm"
    :overflow-hidden="false"
    @update:model-value="onClose"
  >
    <template #body>
      <div :class="$style.body">
        <div
          v-if="icon"
          :class="[$style.iconWrapper, iconClass]"
        >
          <component
            :is="icon"
            class="w-6 h-6"
          />
        </div>
        <div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
          <h3
            class="text-base font-semibold leading-6 text-gray-900"
          >
            {{ title }}
          </h3>
          <div class="mt-2">
            <p class="text-sm text-gray-500">
              {{ description }}
            </p>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div :class="$style.footer">
        <Button
          :kind="confirmKind"
          size="base"
          @click="onConfirm"
        >
          {{ confirmText || t('common.confirm') }}
        </Button>
        <Button
          kind="white"
          size="base"
          @click="onClose"
        >
          {{ cancelText || t('common.cancel') }}
        </Button>
      </div>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { ExclamationTriangleIcon, CheckCircleIcon } from "@heroicons/vue/24/outline"
import Modal from "@/components/common/Modal.vue"
import Button from "@/components/common/Button.vue"

const { t } = useI18n()

const props = withDefaults(defineProps<{
  isOpen: boolean
  title: string
  description: string
  confirmKind?: "primary" | "green" | "blue" | "black"
  confirmText?: string
  cancelText?: string
}>(), {
  confirmKind: "primary",
  confirmText: "",
  cancelText: "",
})

const emit = defineEmits<{
  (e: "close" | "confirm"): void
}>()

const onClose = () => emit("close")
const onConfirm = () => emit("confirm")

const icon = computed(() => {
  if (props.confirmKind === "primary") {
    return ExclamationTriangleIcon
  }
  if (props.confirmKind === "green") {
    return CheckCircleIcon
  }
  return null
})

const iconClass = computed(() => {
  if (props.confirmKind === "primary") {
    return "bg-red-100 text-red-600"
  }
  if (props.confirmKind === "green") {
    return "bg-green-100 text-green-600"
  }
  return "bg-gray-100 text-gray-600"
})
</script>

<style module>
.body {
    @apply sm:flex sm:items-start;
}

.iconWrapper {
    @apply mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full sm:mx-0 sm:h-10 sm:w-10;
}

.footer {
    @apply sm:flex sm:flex-row-reverse sm:gap-2;
}
</style>
