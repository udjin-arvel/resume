import { useApiParamTransform } from "@/composables/api/useApiParamTransform"
import type { ApiResponse } from "@/types/responses/response"
import type { AutoAssignManager, AutoAssignSettings } from "@/types/responses/autoAssign"

export function useApiAutoAssign() {
  const { call } = useApiParamTransform()
  const baseUrl = "api/v1/admin/auto-assign"

  const get = (
    opts: { camelize?: boolean, snakeParams?: boolean } = {},
  ) =>
    call<ApiResponse<AutoAssignSettings>>(
      baseUrl,
      { method: "GET" },
      opts,
    )

  const setEnabled = (
    enabled: boolean,
    opts: { camelize?: boolean, snakeParams?: boolean } = {},
  ) =>
    call<ApiResponse<{ enabled: boolean }>>(
      baseUrl,
      {
        method: "PATCH",
        body: { enabled },
      },
      opts,
    )

  const setManager = (
    id: number | string,
    autoAssign: boolean,
    opts: { camelize?: boolean, snakeParams?: boolean } = {},
  ) =>
    call<ApiResponse<Pick<AutoAssignManager, "id" | "autoAssign">>>(
      `${baseUrl}/managers/${id}`,
      {
        method: "PATCH",
        body: { autoAssign },
      },
      { ...opts, snakeParams: true },
    )

  return {
    get,
    setEnabled,
    setManager,
  }
}
