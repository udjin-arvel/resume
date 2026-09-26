import { computed, readonly } from "vue"
import { useAsyncData } from "#app"
import { useListingRequestStore } from "@/stores/listingRequest"
import { useApiListingRequest } from "@/composables/api/useApiListingRequest"
import { useLoadingIndicator } from "#imports"

export function useListingData(listingId: number) {
  const store = useListingRequestStore()
  const { getBaseInfo } = useApiListingRequest()
  const { isLoading, start, finish } = useLoadingIndicator()

  const hasCachedData = computed(() =>
    store.currentListingId === listingId
    && store.lastFetched
    && Date.now() - store.lastFetched < 60000,
  )

  const listing = computed(() => store.listing)
  const totals = computed(() => store.listingTotals)

  const fetchListingData = async () => {
    start()
    try {
      if (hasCachedData.value) {
        return { listing: listing.value, totals: totals.value, error: null }
      }

      const { data, error } = await useAsyncData(`listing-base-info-${listingId}`, () => getBaseInfo(listingId))

      if (data.value && !error.value) {
        store.setAllListingInfo({
          listing: data.value.data,
          totals: data.value.meta.totals,
          listingId,
        })
        return { listing: data.value.data, totals: data.value.meta.totals, error: null }
      }

      return { listing: listing.value, totals: totals.value, error: error.value }
    }
    finally {
      finish()
    }
  }

  const reset = () => {
    store.reset()
  }

  return {
    listing,
    totals,
    fetchListingData,
    hasCachedData,
    reset,
    isLoading: readonly(isLoading),
  }
}
