<template>
  <HeadlessTransitionRoot
    as="template"
    :show="modelValue"
  >
    <HeadlessDialog
      :class="$style.dialog"
      @close="$emit('update:modelValue', !modelValue)"
    >
      <HeadlessTransitionChild
        as="template"
        enter="ease-out duration-300"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="ease-in duration-200"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div :class="$style.dialogOverlay" />
      </HeadlessTransitionChild>

      <div :class="$style.dialogPanelWrapper">
        <div :class="$style.dialogPanelContent">
          <HeadlessTransitionChild
            as="template"
            enter="ease-out duration-300"
            enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enter-to="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leave-from="opacity-100 translate-y-0 sm:scale-100"
            leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <HeadlessDialogPanel :class="$style[size]">
              <div class="absolute top-0 right-0 pt-4 pr-4">
                <Button
                  kind="white"
                  size="xs"
                  @click="$emit('update:modelValue', !modelValue)"
                >
                  <XMarkIcon
                    class="h-5 w-5"
                    aria-hidden="true"
                  />
                </Button>
              </div>
              <div :class="$style.dialogPanelBody">
                <slot name="body">
                  {{ t("common.undefined") }}
                </slot>
              </div>
              <div :class="$style.dialogPanelFooter">
                <slot name="footer">
                  <Button
                    ref="cancelButtonRef"
                    kind="white"
                    size="base"
                    type="submit"
                    @click="$emit('update:modelValue', !modelValue)"
                  >
                    {{ t("common.cancel") }}
                  </Button>
                </slot>
              </div>
            </HeadlessDialogPanel>
          </HeadlessTransitionChild>
        </div>
      </div>
    </HeadlessDialog>
  </HeadlessTransitionRoot>
</template>

<script setup lang="ts">
import { XMarkIcon } from "@heroicons/vue/24/outline"
import { useI18n } from "vue-i18n"
import Button from "@/components/common/Button.vue"

withDefaults(
  defineProps<{
    modelValue: boolean
    size?: "sm" | "lg" | "xl3" | "xl7"
  }>(),
  {
    size: "lg",
  },
)

defineEmits(["update:modelValue"])

const { t } = useI18n()
</script>

<style module>
.dialog {
  @apply relative z-50;
}

.dialogOverlay {
  @apply fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity;
}

.dialogPanelWrapper {
  @apply fixed inset-0 z-10 w-screen overflow-y-auto;
}

.dialogPanelContent {
  @apply flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0;
}

.dialogPanel {
  @apply relative transform rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full;
}

.sm {
  @apply dialogPanel sm:max-w-sm;
}

.lg {
  @apply dialogPanel sm:max-w-lg;
}

.xl3 {
  @apply dialogPanel sm:max-w-3xl;
}

.xl7 {
  @apply dialogPanel sm:max-w-7xl;
}

.dialogPanelBody {
  @apply bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4 rounded-lg;
}

.dialogPanelFooter {
  @apply bg-transparent px-4 py-3 sm:px-6;
}
</style>
