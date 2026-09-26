import { computed, reactive, watch } from "vue"
import { sanitizeInvoiceLatinField } from "@/utils/transliterateToLatin"

export function useTransliteratedField() {
  const state = reactive({
    ru: "",
    savedLatin: "",
    manualLatin: "",
  })

  const latin = computed(() => {
    const manual = sanitizeInvoiceLatinField(state.manualLatin)
    if (manual) {
      return manual
    }

    const fromRu = sanitizeInvoiceLatinField(state.ru)
    return fromRu || state.savedLatin
  })

  watch(
    () => state.ru,
    () => {
      state.manualLatin = ""
    },
  )

  function initFromSaved(value: string | null | undefined) {
    state.savedLatin = value ?? ""
    state.ru = ""
    state.manualLatin = ""
  }

  return { state, latin, initFromSaved }
}
