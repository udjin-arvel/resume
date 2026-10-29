import type Response from "@/types/responses/response"
import type { SearchRequestStore, SearchRequestUpdate, RejectProposalRequest } from "@/types/requests/searchRequest"
import type { SearchRequestParams, SearchRequestsResponse, SearchRequest, SearchRequestDetail, OpenRequestsResponse } from "~/types/responses/searchRequest"
import type { SavedNeedsFilter } from "@/types/needs/filter"
import type { SearchRequestTransferOptionsResponse } from "@/types/responses/searchRequestForListingRequest"
import type { ApiFetchOptions } from "@/types/common/api"

export const useApiSearchRequests = () => {
  const $api = useNuxtApp().$api as typeof $fetch
  const baseUrl = "/api/v1/search-requests"

  const index = async (params: SearchRequestParams = {}): Promise<SearchRequestsResponse> => {
    return await $api(`${baseUrl}`, {
      method: "GET",
      query: params,
    })
  }

  const show = async (id: number): Promise<{ data: SearchRequestDetail }> => {
    return await $api(`${baseUrl}/${id}`, {
      method: "GET",
    })
  }

  const getListingRequestTransferOptions = (
    sourceId: number,
    listingRequestId: number,
    query: { query?: string, offset?: number, limit?: number } = {},
  ): Promise<SearchRequestTransferOptionsResponse> => {
    return $api(`${baseUrl}/${sourceId}/listing-requests/${listingRequestId}/transfer-options`, {
      method: "GET",
      query,
    })
  }

  const transferListingRequest = (
    sourceId: number,
    listingRequestId: number,
    targetSearchRequestId: number,
  ): Promise<{ message: string, data: { id: number, search_request_id: number } }> => {
    const options: ApiFetchOptions = { skipValidationNotify: true }
    return $api(`${baseUrl}/${sourceId}/listing-requests/${listingRequestId}/transfer`, {
      ...options,
      method: "PATCH",
      body: { target_search_request_id: targetSearchRequestId },
    })
  }

  const store = (body: SearchRequestStore): Promise<Response<SearchRequest>> => {
    return $api(`${baseUrl}`, {
      method: "POST",
      body: body,
    })
  }

  const update = (id: number, body: SearchRequestUpdate): Promise<Response<SearchRequest>> => {
    return $api(`${baseUrl}/${id}`, {
      method: "PUT",
      body: body,
    })
  }

  const updateStatus = async (
    id: number,
    status: string,
    opts: { cancellation_reason?: string } = {},
  ): Promise<{ message: string }> => {
    const body: Record<string, unknown> = { status }
    if (opts.cancellation_reason && opts.cancellation_reason.trim()) {
      body.cancellation_reason = opts.cancellation_reason.trim()
    }
    return await $api(`${baseUrl}/${id}/status`, { method: "PATCH", body })
  }

  const acknowledgeChanges = async (id: number): Promise<Response<SearchRequest>> => {
    return await $api(`${baseUrl}/${id}/acknowledge`, {
      method: "POST",
    })
  }

  const destroy = async (id: number): Promise<{ message: string }> => {
    return await $api(`${baseUrl}/${id}`, {
      method: "DELETE",
    })
  }

  const getFilterOptions = async (query?: Record<string, unknown>) =>
    $api(`${baseUrl}/filter-options`, { method: "GET", query: query ?? {} })

  const getSeriesByBrand = async (brandId: string | number, query?: Record<string, unknown>) =>
    $api(`${baseUrl}/series-by-brand`, { method: "GET", query: { brand_id: brandId, ...(query ?? {}) } })

  const assignExecutor = async (searchRequestId: number, data: { executor_id: number }) => {
    return await $api(`${baseUrl}/${searchRequestId}/assign-executor`, {
      method: "POST",
      body: data,
    })
  }

  const getMatchingListings = async (searchRequestId: number) => {
    return await $api(`${baseUrl}/${searchRequestId}/matching-listings`)
  }

  const requestMoreVariants = async (searchRequestId: number) => {
    return await $api(`${baseUrl}/${searchRequestId}/request-more`, {
      method: "POST",
    })
  }

  const cancelMoreVariants = async (searchRequestId: number) => {
    return await $api(`${baseUrl}/${searchRequestId}/cancel-more`, {
      method: "POST",
    })
  }

  const rejectProposal = async (
    searchRequestId: number,
    data: RejectProposalRequest,
  ) => {
    return await $api(`${baseUrl}/${searchRequestId}/reject-proposal`, {
      method: "POST",
      body: data,
    })
  }

  const getSellers = async () => {
    return await $api(`${baseUrl}/sellers`)
  }

  const getOpenRequests = (): Promise<OpenRequestsResponse> => {
    return $api(`${baseUrl}/open`, {
      method: "GET",
    })
  }

  const getBuyers = async () => {
    return $api(`${baseUrl}/buyers`, {
      method: "GET",
    })
  }

  const bindListingsToRequest = async (requestId: number, listingIds: number[]): Promise<Response<{ bound_count: number }>> => {
    return await $api(`${baseUrl}/${requestId}/bind-listings`, {
      method: "POST",
      body: { listing_ids: listingIds },
    })
  }

  const duplicate = async (id: number): Promise<Response<SearchRequest>> => {
    return await $api(`${baseUrl}/${id}/duplicate`, {
      method: "POST",
    })
  }

  const saveFilter = (data: { name: string, body: string }): Promise<Response<SavedNeedsFilter>> => {
    return $api<Response<SavedNeedsFilter>>(`${baseUrl}/filters`, {
      method: "POST",
      body: data,
    })
  }

  const getSavedFilters = (): Promise<Response<SavedNeedsFilter[]>> => {
    return $api<Response<SavedNeedsFilter[]>>(`${baseUrl}/filters`, { method: "GET" })
  }

  const readEvent = async (eventId: number): Promise<Response<unknown>> => {
    return await $api(`/api/v1/search-request-events/${eventId}/read`, {
      method: "POST",
    })
  }

  return {
    index,
    show,
    getListingRequestTransferOptions,
    transferListingRequest,
    store,
    update,
    updateStatus,
    acknowledgeChanges,
    destroy,
    getFilterOptions,
    getSeriesByBrand,
    assignExecutor,
    getMatchingListings,
    requestMoreVariants,
    cancelMoreVariants,
    rejectProposal,
    getSellers,
    getOpenRequests,
    getBuyers,
    bindListingsToRequest,
    duplicate,
    saveFilter,
    getSavedFilters,
    readEvent,
  }
}
