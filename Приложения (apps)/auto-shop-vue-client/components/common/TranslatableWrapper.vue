<template>
  <div class="relative group w-full">
    <div :class="controlClass">
      <TranslationControl
        :is-showing-original="isShowingOriginal"
        :has-translation="hasTranslation"
        size="sm"
        @click="toggleTranslation"
      />
    </div>
    <div
      v-if="secondaryText"
      class="mb-2 text-xs text-gray-500 bg-gray-50 p-2 rounded border border-gray-200 flex flex-col gap-1"
    >
      <span class="font-bold text-violet-600 text-[10px] uppercase tracking-wider">
        {{ t('common.original_message') }}
      </span>
      <span class="break-words">{{ secondaryText }}</span>
    </div>
    <slot
      :displayed-text="displayedText"
      :original-text="originalText"
      :is-showing-original="isShowingOriginal"
    >
      <div class="whitespace-pre-wrap break-words">
        {{ displayedText }}
      </div>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { toRefs } from "vue"
import { useI18n } from "vue-i18n"
import TranslationControl from "./TranslationControl.vue"
import { useTranslatable, type TranslatableConfig } from "@/composables/useTranslatable"

const props = withDefaults(defineProps<{
  data: Record<string, any>
  config?: TranslatableConfig
  controlClass?: string
}>(), {
  controlClass: "absolute top-0 right-0 z-10 translate-x-full pl-2",
})

const { t } = useI18n()
const { data, config } = toRefs(props)

const {
  displayedText,
  secondaryText,
  originalText,
  hasTranslation,
  isShowingOriginal,
  toggleTranslation,
} = useTranslatable(data, config.value)
</script>
