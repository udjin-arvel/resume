import { useApiParamTransform } from "@/composables/api/useApiParamTransform"
import type { ApiResponse } from "@/types/responses/response"
import type { SourceCheckStats } from "@/types/responses/sourceChecks"

export function useApiSourceChecks() {
  const { call } = useApiParamTransform()

  const getSourceCheckStats = (hours: number) =>
    call<ApiResponse<SourceCheckStats>>(
      "api/v1/admin/source-checks",
      { method: "GET", params: { hours } },
    )

  return {
    getSourceCheckStats,
  }
}
