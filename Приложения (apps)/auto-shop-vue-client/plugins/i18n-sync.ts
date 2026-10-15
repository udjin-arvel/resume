import { useUserStore } from "~/stores/user"
import { useLanguageStore } from "~/stores/language"

export default defineNuxtPlugin(() => {
  const languageStore = useLanguageStore()
  const userStore = useUserStore()

  languageStore.initialize()

  const cookie = useCookie("preferred_lang")
  if (!cookie.value && languageStore.selectedLanguage) {
    cookie.value = languageStore.selectedLanguage
  }

  if (import.meta.client) {
    watch(() => userStore.user, () => {
      languageStore.initialize()
    }, { deep: true })
  }
})
