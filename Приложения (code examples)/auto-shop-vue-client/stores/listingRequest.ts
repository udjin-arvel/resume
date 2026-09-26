import { defineStore } from "pinia"
import { ref } from "vue"
import type { ListingRequestBaseInfo, ListingRequestTotals } from "@/types/responses/listingRequest"

export const useListingRequestStore = defineStore("listingRequest", () => {
  const listing = ref<ListingRequestBaseInfo | null>(null)
  const listingTotals = ref<ListingRequestTotals>({ total_video: 0, total_diagnostic: 0, total_compensation: 0, total_booking: 0, total_unread: 0 })
  const currentListingId = ref<number | null>(null)
  const lastFetched = ref<number | null>(null)
  const totals = ref<ListingRequestTotals>({ total_video: 0, total_diagnostic: 0, total_compensation: 0, total_booking: 0, total_unread: 0 })
  const alreadyInitialized = ref(false)
  const totalUnread = ref<number>(0)

  const setListing = (data: ListingRequestBaseInfo | null) => {
    listing.value = data
    lastFetched.value = data ? Date.now() : null
  }

  const setTotalUnread = (count: number) => {
    totalUnread.value = count
  }

  const setListingTotals = (newTotals?: ListingRequestTotals) => {
    if (!newTotals) {
      return
    }

    if (newTotals.total_unread !== undefined) {
      totalUnread.value = newTotals.total_unread
    }

    if (!alreadyInitialized.value) {
      listingTotals.value = { ...newTotals }
      alreadyInitialized.value = true
    }
    else {
      totals.value.total_video += newTotals.total_video - listingTotals.value.total_video
      totals.value.total_diagnostic += newTotals.total_diagnostic - listingTotals.value.total_diagnostic
      totals.value.total_booking += newTotals.total_booking - listingTotals.value.total_booking
      totals.value.total_unread += newTotals.total_unread - listingTotals.value.total_unread

      listingTotals.value = { ...newTotals }
    }

    lastFetched.value = Date.now()
  }

  const setTotals = (newTotals: ListingRequestTotals) => {
    totals.value = { ...newTotals }
  }

  const setAllListingInfo = (data: { listing?: ListingRequestBaseInfo | null, totals?: ListingRequestTotals, listingId?: number }) => {
    listing.value = data.listing ?? listing.value
    if (data.totals) {
      setListingTotals(data.totals)
    }
    currentListingId.value = data.listingId ?? currentListingId.value
    lastFetched.value = data.listing || data.totals || data.listingId ? Date.now() : lastFetched.value
  }

  const reset = () => {
    listing.value = null
    listingTotals.value = { total_video: 0, total_diagnostic: 0, total_compensation: 0, total_booking: 0, total_unread: 0 }
    currentListingId.value = null
    lastFetched.value = null
    totals.value = { total_video: 0, total_diagnostic: 0, total_compensation: 0, total_booking: 0, total_unread: 0 }
    alreadyInitialized.value = false
  }

  return {
    listing,
    listingTotals,
    currentListingId,
    lastFetched,
    setListing,
    setListingTotals,
    setAllListingInfo,
    reset,
    totals,
    setTotals,
    setTotalUnread,
    totalUnread,
  }
})
