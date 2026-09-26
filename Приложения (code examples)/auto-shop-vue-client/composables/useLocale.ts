import { useI18n } from "vue-i18n"
import { useLanguageStore } from "~/stores/language"

export const useLocale = () => {
  const { locale, setLocale } = useI18n()
  const languageStore = useLanguageStore()

  watch(
    () => languageStore.selectedLanguage,
    async (lang) => {
      if (locale.value !== lang) {
        if (setLocale) {
          await setLocale(lang)
        }
        else {
          locale.value = lang
        }
      }
    },
    { immediate: true },
  )

  return { locale }
}
