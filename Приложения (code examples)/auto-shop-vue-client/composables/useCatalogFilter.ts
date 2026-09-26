import { ref, readonly } from "vue"
import pkg from "lodash"
import { useI18n } from "vue-i18n"
import { useApiCatalogFilter } from "@/composables/api/useApiCatalogFilter"
import { useNotificationsStore } from "@/stores/notifications"
import { useLoadingIndicator } from "#imports"
import type { Filters, SavedFilter, SavedFilterPayload } from "@/types/catalog/filter"

const { debounce } = pkg

const warningDebounceTimer: Record<string, NodeJS.Timeout | undefined> = {}

export default function useCatalogFilter() {
  const { saveFilter: _saveFilter, getSavedFilters: _getSavedFilters } = useApiCatalogFilter()
  const { isLoading, start, finish } = useLoadingIndicator()
  const { errorNotify, warningNotify } = useNotificationsStore()
  const { t } = useI18n()

  const filterName = ref("")
  const showFilterInput = ref(false)
  const savedFilters = ref<SavedFilter[]>([])

  const showWarningOnce = (message: string) => {
    if (warningDebounceTimer[message]) {
      clearTimeout(warningDebounceTimer[message]!)
    }

    warningDebounceTimer[message] = setTimeout(() => {
      warningNotify(message)
      warningDebounceTimer[message] = undefined
    }, 100)
  }

  const debouncedFetchSavedFilters = debounce(async () => {
    start()
    try {
      const response = await _getSavedFilters()
      savedFilters.value = response.data || []
    }
    catch {
      savedFilters.value = []
    }
    finally {
      finish()
    }
  }, 300)

  async function saveFilter(filters: Filters, tabIndex: number = 0) {
    if (!filterName.value.trim()) {
      return
    }
    start()
    try {
      const payload: SavedFilterPayload = {
        filters,
        tab: tabIndex,
      }

      await _saveFilter({
        name: filterName.value.trim(),
        body: JSON.stringify(payload),
      })
      filterName.value = ""
      showFilterInput.value = false
      await debouncedFetchSavedFilters()
    }
    finally {
      finish()
    }
  }

  async function loadSavedFilter(
    filterId: number,
    filters: Filters,
    applyFilters: () => void,
    validateOptions: (savedFilters: Filters) => Promise<{ filters: Filters, wasModified: boolean }>,
    onTabChange?: (tab: number) => void,
  ) {
    const filter = savedFilters.value.find(f => f.id === filterId)
    if (!filter) {
      errorNotify(t("catalog.filter.not_found"))
      return
    }

    try {
      const parsedBody = JSON.parse(filter.body)

      let filtersToValidate: Filters
      let tabIndex = 0

      if ("filters" in parsedBody && "tab" in parsedBody) {
        filtersToValidate = parsedBody.filters
        tabIndex = parsedBody.tab
      }
      else {
        filtersToValidate = parsedBody as Filters
      }

      const { filters: validatedFilters, wasModified } = await validateOptions(filtersToValidate)

      if (onTabChange && typeof tabIndex === "number") {
        onTabChange(tabIndex)
      }

      Object.assign(filters, validatedFilters)
      applyFilters()

      if (wasModified) {
        showWarningOnce(t("catalog.filter.to_old"))
      }
    }
    catch {
      errorNotify(t("catalog.filter.load_error"))
    }
  }

  return {
    filterName,
    showFilterInput,
    savedFilters: readonly(savedFilters),
    isLoading: readonly(isLoading),
    saveFilter,
    loadSavedFilter,
    fetchSavedFilters: debouncedFetchSavedFilters,
  }
}
