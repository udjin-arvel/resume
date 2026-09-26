import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ru from "./ru.json";
import en from "./en.json";
import pt from "./pt.json";

export function initI18n() {
  if (i18n.isInitialized) return i18n;

  void i18n.use(initReactI18next).init({
    resources: {
      ru: { translation: ru },
      en: { translation: en },
      pt: { translation: pt },
    },
    lng: "ru",
    fallbackLng: {
      pt: ["en", "ru"],
      default: ["ru"],
    },
    interpolation: { escapeValue: false },
  });

  return i18n;
}

export { i18n };
export default i18n;
