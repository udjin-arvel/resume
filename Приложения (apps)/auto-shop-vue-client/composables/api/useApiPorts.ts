import type Response from "@/types/responses/response"
import type { Port, PortStoreBody, PortUpdateBody } from "@/types/responses/port"

export function useApiPorts() {
  const $api = useNuxtApp().$api as typeof $fetch

  const baseUrl = "/api/v1/ports"

  const index = (): Promise<Response<Port[]>> => {
    return $api(`${baseUrl}`, {
      method: "GET",
    })
  }

  const adminIndex = (): Promise<Response<Port[]>> => {
    return $api(`${baseUrl}/admin`, {
      method: "GET",
    })
  }

  const store = (data: PortStoreBody): Promise<Response<Port>> => {
    return $api(`${baseUrl}`, {
      method: "POST",
      body: data,
    })
  }

  const update = (id: number, data: PortUpdateBody): Promise<Response<Port>> => {
    return $api(`${baseUrl}/${id}`, {
      method: "PUT",
      body: data,
    })
  }

  const destroy = (id: number): Promise<Response<Port>> => {
    return $api(`${baseUrl}/${id}`, {
      method: "DELETE",
    })
  }

  return {
    index,
    adminIndex,
    store,
    update,
    destroy,
  }
}
