import { useApiParamTransform } from "@/composables/api/useApiParamTransform"
import type { ApiResponse, ApiListStrictResponse } from "@/types/responses/response"
import type {
  CarLinkStoreRequest,
  CarLinkIndexRequest,
  CarLinkAssignRequest,
  CarLinkReplyRequest,
  CarLinkInterestRequest,
  CarLinkAttachListingRequest,
  CarLinkCancelRequest,
  CarLinkInternalNoteRequest,
} from "@/types/requests/carLink"
import type { CarLinkData } from "@/types/common/carLink"
import type { AssigneeData } from "@/types/common/user"

export function useApiCarLink() {
  const { call } = useApiParamTransform()
  const baseUrl = "api/v1/car-links"

  const index = (
    params: CarLinkIndexRequest = {},
    opts: { camelize?: boolean, snakeParams?: boolean } = {},
  ) =>
    call<ApiListStrictResponse<CarLinkData>>(
      baseUrl,
      { method: "GET", params },
      opts,
    )

  const show = (
    id: number | string,
    opts: { camelize?: boolean, snakeParams?: boolean } = {},
  ) =>
    call<ApiResponse<CarLinkData>>(
      `${baseUrl}/${id}`,
      { method: "GET" },
      opts,
    )

  const store = (
    payload: CarLinkStoreRequest,
    opts: { camelize?: boolean, snakeParams?: boolean } = {},
  ) =>
    call<ApiResponse<CarLinkData>>(
      baseUrl,
      { method: "POST", body: payload },
      opts,
    )

  const assign = (
    id: number | string,
    payload: CarLinkAssignRequest,
    opts: { camelize?: boolean, snakeParams?: boolean } = {},
  ) =>
    call<ApiResponse<CarLinkData>>(
      `${baseUrl}/${id}/assign`,
      { method: "POST", body: payload },
      opts,
    )

  const reply = (
    id: number | string,
    payload: CarLinkReplyRequest,
    opts: { camelize?: boolean, snakeParams?: boolean } = {},
  ) =>
    call<ApiResponse<CarLinkData>>(
      `${baseUrl}/${id}/reply`,
      { method: "POST", body: payload },
      opts,
    )

  const interest = (
    id: number | string,
    payload: CarLinkInterestRequest,
    opts: { camelize?: boolean, snakeParams?: boolean } = {},
  ) =>
    call<ApiResponse<CarLinkData>>(
      `${baseUrl}/${id}/interest`,
      { method: "POST", body: payload },
      opts,
    )

  const attachListing = (
    id: number | string,
    payload: CarLinkAttachListingRequest,
    opts: { camelize?: boolean, snakeParams?: boolean } = {},
  ) =>
    call<ApiResponse<CarLinkData>>(
      `${baseUrl}/${id}/attach-listing`,
      { method: "POST", body: payload },
      opts,
    )

  const reopen = (
    id: number | string,
    opts: { camelize?: boolean, snakeParams?: boolean } = {},
  ) =>
    call<ApiResponse<CarLinkData>>(
      `${baseUrl}/${id}/reopen`,
      { method: "POST" },
      opts,
    )

  const cancel = (
    id: number | string,
    payload: CarLinkCancelRequest,
    opts: { camelize?: boolean, snakeParams?: boolean } = {},
  ) =>
    call<ApiResponse<CarLinkData>>(
      `${baseUrl}/${id}/cancel`,
      { method: "POST", body: payload },
      opts,
    )

  const updateInternalNote = (
    id: number | string,
    payload: CarLinkInternalNoteRequest,
    opts: { camelize?: boolean, snakeParams?: boolean } = {},
  ) =>
    call<ApiResponse<CarLinkData>>(
      `${baseUrl}/${id}/internal-note`,
      { method: "POST", body: payload },
      opts,
    )

  const assignees = (
    opts: { camelize?: boolean, snakeParams?: boolean } = {},
  ) =>
    call<ApiResponse<AssigneeData[]>>(
      `${baseUrl}/assignees`,
      { method: "GET" },
      opts,
    )

  const readEvent = (eventId: number) =>
    call<ApiResponse<unknown>>(
      `api/v1/car-link-events/${eventId}/read`,
      { method: "POST" },
    )

  return {
    index,
    show,
    store,
    assign,
    reply,
    interest,
    attachListing,
    reopen,
    cancel,
    updateInternalNote,
    assignees,
    readEvent,
  }
}
