import type Response from "@/types/responses/response"
import type { BookingClient, ListingRequest, ListingRequestTotals, ListingRequestBaseInfo } from "@/types/responses/listingRequest"
import type { ListingRequestStore, ListingRequestSubscribe } from "@/types/requests/listingRequest"
import type { ApiFetchOptions } from "@/types/common/api"

export function useApiListingRequest() {
  const $api = useNuxtApp().$api as typeof $fetch

  const baseUrl = "/api/v1/listings"

  const index = (query: Record<string, any> = {}): Promise<Response<ListingRequest[]>> => {
    return $api(`${baseUrl}/requests`, {
      method: "GET",
      query,
    })
  }

  const store = (listingId: number, body: ListingRequestStore): Promise<Response<ListingRequest>> => {
    return $api(`${baseUrl}/${listingId}/requests`, {
      method: "POST",
      body,
    })
  }

  const subscribe = (listingId: number, body: ListingRequestSubscribe, options: Omit<ApiFetchOptions, "method"> = {}): Promise<Response<ListingRequest>> => {
    return $api(`${baseUrl}/${listingId}/requests/subscribe`, {
      method: "POST",
      body,
      ...options,
    })
  }

  const confirm = (listingId: number, requestId: number): Promise<Response<ListingRequest>> => {
    return $api(`${baseUrl}/${listingId}/requests/${requestId}/confirm`, {
      method: "POST",
    })
  }

  const decline = (listingId: number, requestId: number): Promise<Response<ListingRequest>> => {
    return $api(`${baseUrl}/${listingId}/requests/${requestId}/decline`, {
      method: "POST",
    })
  }

  const reopen = (listingId: number, requestId: number): Promise<Response<ListingRequest>> => {
    return $api(`${baseUrl}/${listingId}/requests/${requestId}/reopen`, {
      method: "POST",
    })
  }

  const read = (listingId: number, requestId: number): Promise<Response<ListingRequest>> => {
    return $api(`${baseUrl}/${listingId}/requests/${requestId}/read`, {
      method: "POST",
    })
  }

  const close = (listingId: number, requestId: number): Promise<Response<ListingRequest>> => {
    return $api(`${baseUrl}/${listingId}/requests/${requestId}/close`, {
      method: "POST",
    })
  }

  const getFilterOptions = (): Promise<Response<{ client_options: { id: number, name: string }[], brand_options: { id: number, name: string, image: string }[], series_options: { id: number, name: string }[], employee_options: { id: number, name: string }[] }>> => {
    return $api(`${baseUrl}/requests/filter-options`, {
      method: "GET",
    })
  }

  const getListingRequests = (listingId: number, query: Record<string, any> = {}): Promise<Response<ListingRequest[]>> => {
    return $api(`${baseUrl}/${listingId}/requests`, {
      method: "GET",
      query,
    })
  }

  const getBaseInfo = (listingId: number): Promise<Response<ListingRequestBaseInfo> & { meta: { totals: ListingRequestTotals } }> => {
    return $api(`${baseUrl}/${listingId}/base-card-info`, {
      method: "GET",
    })
  }

  const getCurrentUserBooking = (listingId: number): Promise<Response<ListingRequest | null>> => {
    return $api(`${baseUrl}/${listingId}/current-booking`, {
      method: "GET",
    })
  }

  const cancelBooking = (listingId: number, requestId: number): Promise<Response<ListingRequest>> => {
    return decline(listingId, requestId)
  }

  const getBookingClients = (listingId: number): Promise<Response<BookingClient[]>> => {
    return $api(`${baseUrl}/${listingId}/booking-clients`, {
      method: "GET",
    })
  }

  return {
    index,
    store,
    confirm,
    decline,
    reopen,
    close,
    getFilterOptions,
    getListingRequests,
    getBaseInfo,
    subscribe,
    getCurrentUserBooking,
    cancelBooking,
    getBookingClients,
    read,
  }
}
