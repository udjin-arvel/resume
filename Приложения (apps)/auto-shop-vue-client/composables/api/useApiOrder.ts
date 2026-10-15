import { useApiParamTransform } from "@/composables/api/useApiParamTransform"
import type { OrderApiListStrictResponse } from "@/types/responses/logisticOrder"
import type { LogisticOrderListItemData } from "~/types/common/logisticOrder"
import type { OrderListRequest } from "@/types/requests/logisticOrder"

export function useApiOrder() {
  const { call } = useApiParamTransform()
  const baseUrl = "api/v1/"
  const ordersBaseUrl = `${baseUrl}logistics/orders`

  const index = (
    params: Partial<OrderListRequest> = {},
    opts: { camelize?: boolean, snakeParams?: boolean } = {},
  ) =>
    call<OrderApiListStrictResponse<LogisticOrderListItemData>>(
      ordersBaseUrl,
      { method: "GET", params },
      opts,
    )

  return {
    index,
  }
}
