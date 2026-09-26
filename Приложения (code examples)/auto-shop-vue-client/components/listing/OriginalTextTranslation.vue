<template>
  <div
    v-if="originalText && isCurrentText"
    class="mt-2 flex flex-col gap-2 text-xs text-gray-500"
  >
    <div class="flex items-center gap-2">
      <span>{{ t("listing.original_language") }}: {{ t(`common.languages.${originalLocale}`) }}</span>
      <TranslationControl
        :is-showing-original="isShowingOriginal"
        :has-translation="hasTranslation"
        :label="isShowingOriginal ? t('listing.hide_translation') : t('common.show_translation')"
        size="sm"
        @click="toggleTranslation"
      />
    </div>
    <div
      v-if="isShowingOriginal && translatedText"
      class="bg-gray-50 p-2 rounded border border-gray-200 flex flex-col gap-1"
    >
      <span class="font-bold text-violet-600 text-[10px] uppercase tracking-wider">
        {{ t("listing.translation") }}
      </span>
      <span class="whitespace-pre-wrap break-words">{{ translatedText }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, toRef } from "vue"
import { useI18n } from "vue-i18n"
import TranslationControl from "@/components/common/TranslationControl.vue"
import { useTranslatable } from "@/composables/useTranslatable"

const props = defineProps<{
  data: Record<string, any>
  field: "description" | "options"
  current?: string | null
}>()

const { t } = useI18n()

const normalizeText = (text?: string | null) => {
  return (text ?? "").replace(/\r\n/g, "\n").trim()
}

const {
  originalText,
  translatedText,
  originalLocale,
  hasTranslation,
  isShowingOriginal,
  toggleTranslation,
} = useTranslatable(toRef(props, "data"), {
  keys: {
    ru: `${props.field}_ru`,
    zh: `${props.field}_zh`,
    original: "original_locale",
  },
})

const isCurrentText = computed(() => normalizeText(props.current) === normalizeText(originalText.value))
</script>
