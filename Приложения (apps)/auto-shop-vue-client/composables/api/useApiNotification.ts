import { useApiParamTransform } from "@/composables/api/useApiParamTransform"
import type { ApiListStrictResponse, ApiResponse } from "@/types/responses/response"

export function useApiNotification() {
  const { call } = useApiParamTransform()
  const baseUrl = "api/v1/notifications"

  const index = (
    params: { page?: number, limit?: number } = {},
    opts: { camelize?: boolean } = {},
  ) =>
    call<ApiListStrictResponse<any>>(
      baseUrl,
      { method: "GET", params },
      { ...opts, snakeParams: true },
    )

  const markRead = (payload: { id?: string } = {}) =>
    call<ApiResponse<void>>(
      `${baseUrl}/read`,
      { method: "POST", body: payload },
    )

  return { index, markRead }
}
