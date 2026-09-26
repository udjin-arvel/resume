import type Response from "@/types/responses/response"
import type { PasswordUpdate as PasswordUpdateRequest } from "@/types/requests/profile/password"
import type { ProfileUpdate as ProfileUpdateRequest } from "@/types/requests/profile/profile"
import type { User as UserResponses } from "@/types/responses/user"

export function useApiProfile() {
  const $api = useNuxtApp().$api as typeof $fetch
  const baseUrl: string = "api/v1/profile"

  const profile = (): Promise<Response<UserResponses>> => {
    return $api<Response<UserResponses>>(`${baseUrl}`, { method: "get" })
  }

  const update = (body: ProfileUpdateRequest): Promise<Response<any>> => {
    return $api<Response<any>>(`${baseUrl}`, { body, method: "patch" })
  }

  const updatePassword = (body: PasswordUpdateRequest): Promise<Response<any>> => {
    return $api<Response<any>>(`${baseUrl}/password`, { body, method: "patch" })
  }

  const getTelegramBindToken = (): Promise<Response<{ token: string }>> => {
    return $api<Response<{ token: string }>>(`${baseUrl}/telegram/bind-token`, { method: "get" })
  }

  const unbindTelegram = (): Promise<Response<any>> => {
    return $api<Response<any>>(`${baseUrl}/telegram/unbind`, { method: "delete" })
  }

  const updateTelegramNotifications = (enabled: boolean): Promise<Response<UserResponses>> => {
    return $api<Response<UserResponses>>(`${baseUrl}/telegram/notifications`, { body: { enabled }, method: "patch" })
  }

  return {
    profile,
    update,
    updatePassword,
    getTelegramBindToken,
    unbindTelegram,
    updateTelegramNotifications,
  }
}
