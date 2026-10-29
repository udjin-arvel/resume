import { useApiParamTransform } from "@/composables/api/useApiParamTransform"
import type { ApiResponse } from "@/types/responses/response"
import type { DashboardData } from "~/types/responses/dashboard"

export function useApiDashboard() {
  const { call } = useApiParamTransform()
  const baseUrl = "/api/v1/dashboard"

  const show = (
    params = {},
    opts: { camelize?: boolean, snakeParams?: boolean } = {},
  ) => {
    return call<ApiResponse<DashboardData>>(
      baseUrl,
      {
        method: "GET",
        params,
      },
      {
        camelize: true,
        ...opts,
      },
    )
  }

  return {
    show,
  }
}
