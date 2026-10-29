import type Response from "@/types/responses/response"
import type { CityOption, CityStoreBody } from "~/types/responses/city"

export function useApiCities() {
  const $api = useNuxtApp().$api as typeof $fetch

  const baseUrl = "/api/v1/cities"

  const index = (params = {}): Promise<Response<CityOption[]>> => {
    return $api(baseUrl, {
      method: "GET",
      params,
    })
  }

  const store = (data: CityStoreBody): Promise<Response<CityOption>> => {
    return $api(baseUrl, {
      method: "POST",
      body: data,
    })
  }

  const update = (id: number, data: Partial<CityOption>): Promise<Response<CityOption>> => {
    return $api(`${baseUrl}/${id}`, {
      method: "PUT",
      body: data,
    })
  }

  const hide = (id: number): Promise<Response<CityOption>> => {
    return $api(`${baseUrl}/${id}/hide`, {
      method: "PATCH",
    })
  }

  const show = (id: number): Promise<Response<CityOption>> => {
    return $api(`${baseUrl}/${id}/show`, {
      method: "PATCH",
    })
  }

  const updateDeliveryCost = (
    id: number,
    portId: number,
    deliveryCost: number,
  ): Promise<Response<CityOption>> => {
    return $api(`${baseUrl}/${id}/delivery-cost`, {
      method: "PATCH",
      body: { port_id: portId, delivery_cost: deliveryCost },
    })
  }

  const exportExcel = (): Promise<Blob> => {
    return $api(`${baseUrl}/export`, {
      method: "GET",
      responseType: "blob",
    })
  }

  return {
    index,
    store,
    update,
    hide,
    show,
    updateDeliveryCost,
    exportExcel,
  }
}
