import { defineStore } from "pinia"
import { russian, chinese } from "~/constants/lang"
import type { Language } from "@/types/common/lang"

export const useLanguageStore = defineStore("language", {
  state: () => ({
    selectedLanguage: russian as Language,
  }),

  actions: {
    setLanguage(lang: Language) {
      this.selectedLanguage = lang

      if (import.meta.client) {
        localStorage.setItem("preferred-language", lang)
      }

      const cookie = useCookie("preferred_lang", { maxAge: 365 * 24 * 60 * 60 * 1000, path: "/" })
      cookie.value = lang
    },

    initialize() {
      const cookieLang = useCookie("preferred_lang").value
      let savedLang = null

      if (import.meta.client) {
        savedLang = localStorage.getItem("preferred-language")
      }

      const lang: Language = (cookieLang || savedLang) === chinese ? chinese : russian

      this.selectedLanguage = lang
    },
  },
})
