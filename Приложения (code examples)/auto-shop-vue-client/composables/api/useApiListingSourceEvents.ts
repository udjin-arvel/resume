import { useApiParamTransform } from "@/composables/api/useApiParamTransform"
import type { ApiResponse } from "@/types/responses/response"
import type { ListingRequest } from "@/types/responses/listingRequest"

export function useApiListingSourceEvents() {
  const { call } = useApiParamTransform()
  const baseUrl = "api/v1/listing-source-events"

  const readEvent = (eventId: number) =>
    call<ApiResponse<ListingRequest>>(
      `${baseUrl}/${eventId}/read`,
      { method: "POST" },
    )

  const confirmEvent = (eventId: number) =>
    call<ApiResponse<ListingRequest>>(
      `${baseUrl}/${eventId}/confirm`,
      { method: "POST" },
    )

  const declineEvent = (eventId: number) =>
    call<ApiResponse<ListingRequest>>(
      `${baseUrl}/${eventId}/decline`,
      { method: "POST" },
    )

  return {
    readEvent,
    confirmEvent,
    declineEvent,
  }
}
