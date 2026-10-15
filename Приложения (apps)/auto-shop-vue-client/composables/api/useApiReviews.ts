import type Response from "@/types/responses/response"
import type {
  ReviewResponse,
  ReviewCreateFormResponse,
  ReviewFiltersResponse,
} from "@/types/responses/reviews"
import type {
  StoreReviewRequest,
  ReviewIndexRequest,
} from "@/types/requests/reviews"
import { useApiParamTransform } from "@/composables/api/useApiParamTransform"

export function useApiReviews() {
  const { call } = useApiParamTransform()
  const baseUrl = "api/v1/reviews"

  const index = (
    params: ReviewIndexRequest = {},
    opts: { camelize?: boolean, snakeParams?: boolean } = {},
  ) => {
    return call<Response<ReviewResponse[]>>(
      `${baseUrl}`,
      { method: "GET", params },
      { snakeParams: true, ...opts },
    )
  }

  const show = (
    id: number,
    opts: { camelize?: boolean, snakeParams?: boolean } = {},
  ) => {
    return call<Response<ReviewResponse>>(
      `${baseUrl}/${id}`,
      { method: "GET" },
      opts,
    )
  }

  const store = (
    body: StoreReviewRequest,
    opts: { camelize?: boolean, snakeParams?: boolean } = {},
  ) => {
    return call<Response<ReviewResponse>>(
      `${baseUrl}`,
      { method: "POST", body },
      { snakeParams: true, ...opts },
    )
  }

  const updateStatus = (
    id: number,
    status: "accepted" | "rejected",
    opts: { camelize?: boolean, snakeParams?: boolean } = {},
  ) => {
    return call<Response<ReviewResponse>>(
      `${baseUrl}/${id}/status`,
      {
        method: "PUT",
        body: { status },
      },
      opts,
    )
  }

  const destroy = (
    id: number,
    opts: { camelize?: boolean, snakeParams?: boolean } = {},
  ) => {
    return call<Response<null>>(
      `${baseUrl}/${id}`,
      { method: "DELETE" },
      opts,
    )
  }

  const getCreateFormData = (
    orderId: number,
    opts: { camelize?: boolean, snakeParams?: boolean } = {},
  ) => {
    return call<Response<ReviewCreateFormResponse>>(
      `${baseUrl}/create-form/${orderId}`,
      { method: "GET" },
      opts,
    )
  }

  const getFilters = () => {
    return call<Response<ReviewFiltersResponse>>(
      `${baseUrl}/filters`,
      { method: "GET" },
    )
  }

  return {
    index,
    show,
    store,
    updateStatus,
    destroy,
    getCreateFormData,
    getFilters,
  }
}
