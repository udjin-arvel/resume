import type Response from "@/types/responses/response"
import type { ApiListResponse } from "@/types/responses/response"
import type {
  ListingStore,
  ListingUpdate,
  BindRequestsRequest,
  ShareListingRequest,
  ImportFromUrlRequest,
} from "@/types/requests/listing"
import type {
  ApiResponse,
  Listing,
  ListingFull,
  ListingBaseInfo,
  ListingPreview,
  ShareListingResponse,
  ImportFromUrlResponse,
} from "@/types/responses/listing"
import type { DiagnosticReport, DiagnosticReportResponse, DiagnosticReportUpdate } from "@/types/responses/diagnosticReport"
import type { CompensationReport, CompensationReportResponse, CompensationReportUpdate } from "~/types/responses/compensationReport"

export function useApiListing() {
  const $api = useNuxtApp().$api as typeof $fetch

  const baseUrl = "/api/v1/listings"

  const index = (params: Record<string, any> = {}): Promise<ApiResponse> => {
    return $api(baseUrl, {
      method: "GET",
      params,
    })
  }

  const store = (body: ListingStore): Promise<Response<Listing>> => {
    return $api(`${baseUrl}`, {
      method: "POST",
      body: body,
    })
  }

  const update = (
    id: number,
    body: ListingUpdate,
  ): Promise<Response<Listing>> => {
    return $api(`${baseUrl}/${id}`, {
      method: "PUT",
      body: body,
    })
  }

  const show = (id: number): Promise<Response<Listing>> => {
    return $api(`${baseUrl}/${id}`, {
      method: "GET",
    })
  }

  const baseInfo = (): Promise<Response<ListingBaseInfo>> => {
    return $api(`${baseUrl}/base-info`, {
      method: "GET",
    })
  }

  const checkVin = (vin: string): Promise<Response<{ exists: boolean }>> => {
    return $api(`${baseUrl}/check-vin`, {
      method: "GET",
      params: { vin },
    })
  }

  const showPublic = (id: number): Promise<Response<Listing>> => {
    return $api(`${baseUrl}/${id}/public`, {
      method: "GET",
    })
  }

  const addFavorite = (id: number): Promise<Response<{ listing_id: number, is_favorited: boolean }>> => {
    return $api(`${baseUrl}/${id}/favorite`, {
      method: "POST",
    })
  }

  const removeFavorite = (id: number): Promise<Response<{ listing_id: number, is_favorited: boolean }>> => {
    return $api(`${baseUrl}/${id}/favorite`, {
      method: "DELETE",
    })
  }

  const hide = (id: number): Promise<Response<Listing>> => {
    return $api(`${baseUrl}/${id}/hide`, {
      method: "PATCH",
    })
  }

  const unhide = (id: number): Promise<Response<Listing>> => {
    return $api(`${baseUrl}/${id}/unhide`, {
      method: "PATCH",
    })
  }

  const restore = (id: number): Promise<Response<Listing>> => {
    return $api(`${baseUrl}/${id}/restore`, {
      method: "PATCH",
    })
  }

  const destroy = (id: number): Promise<Response<{ message: string }>> => {
    return $api(`${baseUrl}/${id}`, {
      method: "DELETE",
    })
  }

  const withdraw = (id: number): Promise<Response<Listing>> => {
    return $api(`${baseUrl}/${id}/withdraw`, {
      method: "PATCH",
    })
  }

  const returnToSale = (
    id: number,
    body: { shown_on_site?: boolean } = {},
  ): Promise<Response<Listing>> => {
    return $api(`${baseUrl}/${id}/return-to-sale`, {
      method: "PATCH",
      body,
    })
  }

  const republish = (
    id: number,
    body: ListingUpdate,
  ): Promise<Response<Listing>> => {
    return $api(`${baseUrl}/${id}/republish`, {
      method: "PUT",
      body,
    })
  }

  const bindRequests = (
    id: number,
    requestIds: number[],
  ): Promise<Response<number[]>> => {
    const body: BindRequestsRequest = {
      search_request_ids: requestIds,
    }

    return $api(`${baseUrl}/${id}/bind-requests`, {
      method: "PATCH",
      body,
    })
  }

  const share = (
    id: number,
    body: ShareListingRequest,
  ): Promise<ShareListingResponse> => {
    return $api(`${baseUrl}/${id}/share`, {
      method: "POST",
      body,
    })
  }

  const showShared = (code: string): Promise<Response<ListingFull>> => {
    return $api(`${baseUrl}/share/${code}`, {
      method: "GET",
    })
  }

  const importFromUrl = (
    body: ImportFromUrlRequest,
  ): Promise<ImportFromUrlResponse> => {
    return $api(`${baseUrl}/import-from-url`, {
      method: "POST",
      body,
    })
  }

  const cancelImport = (jobId: string): Promise<{ message: string }> => {
    return $api(`${baseUrl}/import/cancel`, {
      method: "POST",
      body: { job_id: jobId },
    })
  }

  const parseDiagnosticFromUrl = (body: { url: string }): Promise<{ message: string, job_id: string }> => {
    return $api(`${baseUrl}/parse-diagnostic`, {
      method: "POST",
      body,
    })
  }

  const getDiagnosticPhotos = (jobId: string): Promise<{ files: Array<{ id: number, url: string, name: string, size: number, mime_type: string, descriptions: Record<string, string> }> }> => {
    return $api(`${baseUrl}/diagnostic-photos/${jobId}`, {
      method: "GET",
    })
  }

  const getAvailableListings = async (
    requestId: number,
    params: { query?: string, offset?: number, limit?: number } = {},
  ): Promise<ApiListResponse<ListingPreview>> => {
    return await $api(`${baseUrl}/available-for-request/${requestId}`, {
      method: "GET",
      params,
    })
  }

  const getDiagnosticReport = (id: number): Promise<DiagnosticReportResponse<DiagnosticReport | null>> => {
    return $api(`${baseUrl}/${id}/diagnostic-report`, { method: "GET" })
  }

  const getCompensationReport = (id: number): Promise<CompensationReportResponse<CompensationReport | null>> => {
    return $api(`${baseUrl}/${id}/compensation-report`, { method: "GET" })
  }

  const updateDiagnosticReport = (
    id: number,
    body: DiagnosticReportUpdate,
  ): Promise<DiagnosticReportResponse<DiagnosticReport>> => {
    return $api(`${baseUrl}/${id}/diagnostic-report`, { method: "PUT", body })
  }

  const updateCompensationReport = (
    id: number,
    body: CompensationReportUpdate,
  ): Promise<CompensationReportResponse<CompensationReport>> => {
    return $api(`${baseUrl}/${id}/compensation-report`, { method: "PUT", body })
  }

  const getPublicDiagnosticReport = (code: string): Promise<DiagnosticReportResponse<DiagnosticReport>> => {
    return $api(`/api/v1/diagnostic/${code}`, { method: "GET" })
  }

  const getPublicCompensationReport = (code: string): Promise<CompensationReportResponse<CompensationReport>> => {
    return $api(`/api/v1/compensation/${code}`, { method: "GET" })
  }

  const getPublicListingsCount = (): Promise<Response<{ total: number }>> => {
    return $api(`${baseUrl}/count`, { method: "GET" })
  }

  return {
    index,
    store,
    update,
    show,
    showPublic,
    addFavorite,
    removeFavorite,
    hide,
    destroy,
    unhide,
    bindRequests,
    baseInfo,
    checkVin,
    restore,
    withdraw,
    returnToSale,
    republish,
    share,
    showShared,
    importFromUrl,
    cancelImport,
    parseDiagnosticFromUrl,
    getDiagnosticPhotos,
    getAvailableListings,
    getDiagnosticReport,
    getCompensationReport,
    updateDiagnosticReport,
    updateCompensationReport,
    getPublicDiagnosticReport,
    getPublicCompensationReport,
    getPublicListingsCount,
  }
}
