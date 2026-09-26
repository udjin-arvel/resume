import { useApiParamTransform } from "@/composables/api/useApiParamTransform"
import type { ApiResponse } from "@/types/responses/response"
import type { CarModel, CarCompletion, CarFilterOption } from "~/types/common/adminCars"
import type { BrandIndexRequest } from "@/types/requests/admin/cars"
import type { CompletionMeta } from "@/types/responses/admin/cars"

export function useApiAdminCar() {
  const { call } = useApiParamTransform()
  const baseUrl = "api/v1/admin/cars"

  const indexBrands = (
    params: BrandIndexRequest = {},
    opts: { camelize?: boolean, snakeParams?: boolean } = {},
  ) =>
    call<ApiResponse<CarModel[]>>(
      baseUrl,
      { method: "GET", params },
      opts,
    )

  const modelFilter = (
    brandId: number | string,
    opts: { camelize?: boolean, snakeParams?: boolean } = {},
  ) =>
    call<ApiResponse<CarFilterOption[]>>(
      `${baseUrl}/${brandId}/models`,
      { method: "GET" },
      opts,
    )

  const brandFilter = (
    opts: { camelize?: boolean, snakeParams?: boolean } = {},
  ) =>
    call<ApiResponse<CarFilterOption[]>>(
      `${baseUrl}/filter`,
      { method: "GET" },
      opts,
    )

  const completions = (
    id: number | string,
    opts: { camelize?: boolean, snakeParams?: boolean } = {},
  ) =>
    call<ApiResponse<CarCompletion[], CompletionMeta>>(
      `${baseUrl}/models/${id}`,
      { method: "GET" },
      opts,
    )

  const activate = (
    ids: (number | string)[],
    opts: { camelize?: boolean, snakeParams?: boolean } = {},
  ) =>
    call<ApiResponse<number[]>>(
      `${baseUrl}/activate`,
      {
        method: "PATCH",
        body: { ids },
      },
      opts,
    )

  const deactivate = (
    ids: (number | string)[],
    opts: { camelize?: boolean, snakeParams?: boolean } = {},
  ) =>
    call<ApiResponse<number[]>>(
      `${baseUrl}/deactivate`,
      {
        method: "PATCH",
        body: { ids },
      },
      opts,
    )

  const updateName = (
    id: number | string,
    name: string,
    opts: { camelize?: boolean, snakeParams?: boolean } = {},
  ) =>
    call<ApiResponse<any>>(
      `${baseUrl}/${id}/name`,
      {
        method: "PATCH",
        body: { name },
      },
      opts,
    )

  const exportCars = (
    opts: { camelize?: boolean, snakeParams?: boolean } = {},
  ) =>
    call<any>(
      `${baseUrl}/export`,
      {
        method: "GET",
        responseType: "blob",
      },
      { ...opts, camelize: false },
    )

  return {
    indexBrands,
    modelFilter,
    brandFilter,
    completions,
    activate,
    deactivate,
    updateName,
    exportCars,
  }
}
