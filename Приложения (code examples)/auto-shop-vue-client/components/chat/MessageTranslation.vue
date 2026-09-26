<template>
  <div :class="$style.translationWrapper">
    <div :class="$style.translationHeader">
      <div :class="$style.headerLeft">
        <LanguageIcon class="w-3 h-3" />
        <span>{{ label }}</span>
      </div>

      <button
        :class="$style.copyBtn"
        :title="t('chat.copy_original')"
        @click="$emit('copy')"
      >
        <ClipboardDocumentIcon class="w-3 h-3" />
      </button>
    </div>
    <div :class="$style.translationText">
      {{ text }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { LanguageIcon, ClipboardDocumentIcon } from "@heroicons/vue/24/outline"

defineProps<{
  text: string
  label?: string
}>()

defineEmits<{
  (e: "copy"): void
}>()

const { t } = useI18n()
</script>

<style module>
.translationWrapper {
  @apply mb-2 border border-gray-200 rounded bg-white;
}

.translationHeader {
  @apply flex items-center justify-between px-2 pt-1 pb-1 border-b border-gray-100;
}

.headerLeft {
  @apply flex items-center gap-1 text-[#5b22b6] text-[11px] font-medium;
}

.translationText {
  @apply text-gray-600 text-xs px-2 py-1.5 leading-relaxed;
}

.copyBtn {
  @apply text-gray-400 hover:text-blue-600 transition-colors p-0.5 rounded hover:bg-gray-50 cursor-pointer;
}
</style>
