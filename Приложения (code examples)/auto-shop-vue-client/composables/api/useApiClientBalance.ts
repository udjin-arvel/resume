import type { ApiListStrictResponse, ApiResponse } from "@/types/responses/response"
import type { ClientBalance } from "@/types/common/client"
import type { ClientBalanceHistoryRequest, ClientBalanceAdjustRequest } from "@/types/requests/client"
import { useApiParamTransform } from "@/composables/api/useApiParamTransform"

export function useApiClientBalance() {
  const { call } = useApiParamTransform()
  const baseUrl = "api/v1/clients"

  const index = (
    clientId: number | string,
    params: ClientBalanceHistoryRequest = {},
    opts: { camelize?: boolean, snakeParams?: boolean } = {},
  ) => call<ApiListStrictResponse<ClientBalance>>(
    `${baseUrl}/${clientId}/balance/history`,
    { method: "GET", params },
    opts,
  )

  const store = (
    clientId: number | string,
    payload: ClientBalanceAdjustRequest,
    opts: { camelize?: boolean, snakeParams?: boolean } = {},
  ) => call<ApiResponse<ClientBalance>>(
    `${baseUrl}/${clientId}/balance/adjust`,
    { method: "POST", body: payload },
    opts,
  )

  return { index, store }
}
