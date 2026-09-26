import type { ApiResponse } from "@/types/responses/response"
import { useApiParamTransform } from "@/composables/api/useApiParamTransform"

export const useApiFeedback = () => {
  const { call } = useApiParamTransform()
  const baseUrl = "api/v1"

  const sendFeedback = (payload: { name: string, phone: string, city: string }) =>
    call<ApiResponse<any>>(
      `${baseUrl}/feedback`,
      { method: "POST", body: payload },
      { snakeParams: true, camelize: true },
    )

  return {
    sendFeedback,
  }
}
