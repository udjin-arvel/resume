import type Response from "@/types/responses/response"
import type { Client } from "@/types/responses/client"
import type { ClientStore, ClientUpdate } from "@/types/requests/user/client"
import type { PasswordUpdate } from "@/types/requests/user/password"

export function useApiClient() {
  const $api = useNuxtApp().$api as typeof $fetch

  const baseUrl = "/api/v1/clients"

  const index = (params = {}): Promise<Response<Client[]>> => {
    return $api(`${baseUrl}`, {
      method: "GET",
      params,
    })
  }

  const show = (id: number): Promise<Response<Client>> => {
    return $api(`${baseUrl}/${id}`, {
      method: "GET",
    })
  }

  const accept = (id: number): Promise<Response<Client>> => {
    return $api(`${baseUrl}/${id}/accept`, { method: "PATCH" })
  }

  const reject = (id: number): Promise<Response<Client>> => {
    return $api(`${baseUrl}/${id}/reject`, { method: "PATCH" })
  }

  const block = (id: number): Promise<Response<Client>> => {
    return $api(`${baseUrl}/${id}/block`, { method: "PATCH" })
  }

  const unblock = (id: number): Promise<Response<Client>> => {
    return $api(`${baseUrl}/${id}/unblock`, { method: "PATCH" })
  }

  const pending = (id: number): Promise<Response<Client>> => {
    return $api(`${baseUrl}/${id}/pending`, { method: "PATCH" })
  }

  const destroy = (id: number): Promise<Response<any>> => {
    return $api(`${baseUrl}/${id}`, { method: "DELETE" })
  }

  const update = (id: number, body: ClientUpdate): Promise<Response<Client>> => {
    return $api(`${baseUrl}/${id}`, {
      method: "PUT",
      body,
    })
  }

  const store = (body: ClientStore): Promise<Response<Client>> => {
    return $api(`${baseUrl}`, {
      method: "POST",
      body,
    })
  }

  const changePassword = (id: number, body: PasswordUpdate): Promise<Response<any>> => {
    return $api(`${baseUrl}/${id}/password`, {
      method: "PUT",
      body,
    })
  }

  return {
    index,
    show,
    accept,
    reject,
    block,
    unblock,
    pending,
    destroy,
    update,
    store,
    changePassword,
  }
}
