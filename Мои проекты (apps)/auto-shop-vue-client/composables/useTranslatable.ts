import { computed, ref, unref } from "vue"
import { useI18n } from "vue-i18n"
import type { Ref } from "vue"
import { russian, chinese } from "~/constants/lang"

export interface TranslatableConfig {
  keys?: {
    ru?: string
    zh?: string
    original?: string
  }
}

export function useTranslatable(
  data: Ref<Record<string, any>> | Record<string, any>,
  config: TranslatableConfig = {},
) {
  const { locale } = useI18n()

  const keys = {
    ru: config.keys?.ru ?? "text_ru",
    zh: config.keys?.zh ?? "text_zh",
    original: config.keys?.original ?? "original_locale",
  }

  const item = computed(() => unref(data))

  const textRu = computed(() => item.value?.[keys.ru] || "")
  const textZh = computed(() => item.value?.[keys.zh] || "")

  const textFor = (lang: string) => {
    return lang === chinese ? textZh.value : textRu.value
  }

  const originalLocale = computed(() => {
    const declared = item.value?.[keys.original] === chinese ? chinese : russian
    const other = declared === chinese ? russian : chinese
    return textFor(declared) || !textFor(other) ? declared : other
  })

  const hasTranslation = computed(() => {
    return Boolean(textRu.value && textZh.value)
  })

  const originalText = computed(() => textFor(originalLocale.value))

  const translatedText = computed(() => textFor(originalLocale.value === chinese ? russian : chinese))

  const userLocaleText = computed(() => {
    return textFor(locale.value === chinese ? chinese : russian) || originalText.value
  })

  const isShowingOriginal = ref(false)

  const displayedText = computed(() => {
    if (isShowingOriginal.value && translatedText.value) {
      return translatedText.value
    }
    return userLocaleText.value
  })

  const secondaryText = computed(() => {
    if (isShowingOriginal.value) {
      return originalText.value
    }
    return null
  })

  const toggleTranslation = () => {
    isShowingOriginal.value = !isShowingOriginal.value
  }

  return {
    displayedText,
    secondaryText,
    originalText,
    translatedText,
    originalLocale,
    hasTranslation,
    isShowingOriginal,
    toggleTranslation,
  }
}
