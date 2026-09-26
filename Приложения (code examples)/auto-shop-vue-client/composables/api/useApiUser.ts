import type Response from "@/types/responses/response"
import type { User as UserResponses } from "@/types/responses/user"
import type { PasswordUpdate as PasswordUpdateRequest } from "@/types/requests/user/password"
import type { UserStore as UserStoreRequest, UserUpdate as UserUpdateRequest } from "@/types/requests/user/user"

export function useApiUser() {
  const $api = useNuxtApp().$api as typeof $fetch

  const index = (params: Record<string, any> = {}): Promise<Response<UserResponses[]>> => {
    return $api<Response<UserResponses[]>>("api/v1/users", { method: "get", params })
  }

  const show = (id: number): Promise<Response<UserResponses>> => {
    return $api<Response<UserResponses>>("api/v1/users/" + String(id), { method: "get" })
  }

  const store = (body: UserStoreRequest): Promise<Response<any>> => {
    return $api<Response<any>>("api/v1/users/", { body, method: "post" })
  }

  const update = (id: number, body: UserUpdateRequest): Promise<Response<any>> => {
    return $api<Response<any>>("api/v1/users/" + String(id), { body, method: "put" })
  }

  const updatePassword = (id: number, body: PasswordUpdateRequest): Promise<Response<any>> => {
    return $api<Response<any>>(`api/v1/users/${id}/update-password`, { body, method: "patch" })
  }

  const block = (id: number): Promise<Response<any>> => {
    return $api<Response<any>>(`api/v1/users/${id}/block`, { method: "patch" })
  }

  const unblock = (id: number): Promise<Response<any>> => {
    return $api<Response<any>>(`api/v1/users/${id}/unblock`, { method: "patch" })
  }

  const destroy = (id: number): Promise<Response<any>> => {
    return $api<Response<any>>(`api/v1/users/${id}`, { method: "delete" })
  }

  const setLanguage = (language: string): Promise<Response<void>> => {
    return $api<Response<void>>("api/v1/user/set-language", {
      method: "post",
      body: { language },
    })
  }

  const updateNotificationSettings = (id: number, settings: string[]): Promise<Response<any>> => {
    return $api<Response<any>>(`api/v1/users/${id}/notification-settings`, {
      method: "patch",
      body: { settings },
    })
  }

  return {
    index,
    show,
    store,
    update,
    updatePassword,
    block,
    unblock,
    destroy,
    setLanguage,
    updateNotificationSettings,
  }
}
