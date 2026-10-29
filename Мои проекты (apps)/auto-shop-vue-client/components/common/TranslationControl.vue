<template>
  <button
    v-if="hasTranslation"
    type="button"
    :class="[
      'flex items-center justify-center rounded transition-all shadow-sm',
      sizeClasses,
      activeClasses,
    ]"
    :title="title"
    @click="$emit('click')"
  >
    <LanguageIcon class="w-4 h-4" />
  </button>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { LanguageIcon } from "@heroicons/vue/24/outline"
import { useI18n } from "vue-i18n"

const props = defineProps<{
  isShowingOriginal: boolean
  hasTranslation: boolean
  size?: "sm" | "md"
  label?: string
}>()

defineEmits(["click"])

const { t } = useI18n()

const sizeClasses = computed(() => props.size === "sm" ? "p-1 w-6 h-6" : "p-1.5 w-8 h-8")

const activeClasses = computed(() => {
  if (props.isShowingOriginal) {
    return "border border-violet-200 bg-violet-50 text-violet-600 hover:bg-violet-100 hover:border-violet-300"
  }
  return "border border-gray-300 bg-white text-gray-600 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-400"
})

const title = computed(() => {
  if (props.label) {
    return props.label
  }
  return props.isShowingOriginal
    ? t("common.show_translation")
    : t("common.show_original")
})
</script>
