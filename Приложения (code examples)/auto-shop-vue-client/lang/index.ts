import ru from "./ru"
import zh from "./zh"

export default defineI18nConfig(() => ({
  legacy: false,
  globalInjection: true,
  locale: "ru",
  availableLocales: ["ru", "zh"],
  messages: {
    ru,
    zh,
  },
  pluralRules: {
    ru: pluralizationRu,
  },
}))
