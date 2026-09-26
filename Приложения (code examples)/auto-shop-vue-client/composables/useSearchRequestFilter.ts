import { ref, readonly } from "vue"
import pkg from "lodash"
import { useI18n } from "vue-i18n"
import { useApiSearchRequests } from "@/composables/api/useApiSearchRequests"
import { useNotificationsStore } from "@/stores/notifications"
import { useLoadingIndicator } from "#imports"
import type { NeedsFilterState, SavedNeedsFilter, SavedNeedsFilterPayload } from "@/types/needs/filter"

const { debounce } = pkg

export default function useSearchRequestFilter() {
  const { saveFilter: _saveFilter, getSavedFilters: _getSavedFilters } = useApiSearchRequests()
  const { isLoading, start, finish } = useLoadingIndicator()
  const { errorNotify } = useNotificationsStore()
  const { t } = useI18n()

  const filterName = ref("")
  const showFilterInput = ref(false)
  const savedFilters = ref<SavedNeedsFilter[]>([])

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

  async function saveFilter(filters: NeedsFilterState) {
    if (!filterName.value.trim()) {
      return
    }
    start()
    try {
      const payload: SavedNeedsFilterPayload = { filters }

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
    apply: (filters: NeedsFilterState) => Promise<void>,
  ) {
    const filter = savedFilters.value.find(f => f.id === filterId)
    if (!filter) {
      errorNotify(t("catalog.filter.not_found"))
      return
    }

    try {
      const parsedBody = typeof filter.body === "string"
        ? JSON.parse(filter.body)
        : filter.body

      const filtersToApply: NeedsFilterState = "filters" in parsedBody
        ? parsedBody.filters
        : parsedBody as NeedsFilterState

      await apply(filtersToApply)
    }
    catch {
      errorNotify(t("catalog.filter.load_error"))
    }
  }

  function closeFilterInput() {
    showFilterInput.value = false
    filterName.value = ""
  }

  return {
    filterName,
    showFilterInput,
    savedFilters: readonly(savedFilters),
    isLoading: readonly(isLoading),
    saveFilter,
    loadSavedFilter,
    fetchSavedFilters: debouncedFetchSavedFilters,
    closeFilterInput,
  }
}
