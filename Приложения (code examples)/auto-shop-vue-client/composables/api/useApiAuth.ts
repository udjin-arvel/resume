import type Response from "@/types/responses/response"
import type { SigIn as SigInRequest, EmailPhonePayload } from "@/types/requests/auth/sigIn"
import type { SigUp as SigUpRequest } from "@/types/requests/auth/sigUp"
import type { LoginCodeRequest } from "@/types/requests/auth/loginCode"
import type { SigIn as SigInResponses } from "@/types/responses/sigIn"
import type { SigUp as SigUpResponses } from "@/types/responses/sigUp"
import type { User as UserResponses } from "@/types/responses/user"
import type { Reset as ResetRequest } from "@/types/requests/auth/reset"
import type { VerifyEmail as VerifyEmailRequest } from "@/types/requests/auth/verifyEmail"
import type { ForgotSendCode, ForgotResetWithCode } from "@/types/requests/auth/forgot"
import type { ApiFetchOptions } from "@/types/common/api"

export function useApiAuth() {
  const $api = useNuxtApp().$api as typeof $fetch

  const baseUrl: string = "api/v1/auth"

  const login = (body: SigInRequest) => {
    return $api<Response<SigInResponses>>(`${baseUrl}/login`, { body, method: "post" })
  }

  const register = (body: SigUpRequest) => {
    return $api<Response<SigUpResponses>>(`${baseUrl}/register`, { body, method: "post" })
  }

  const logout = (): Promise<Response<any>> => {
    return $api<Response<any>>(`${baseUrl}/logout`, { method: "post" })
  }

  const refresh = (): Promise<Response<SigInResponses>> => {
    return $api<Response<SigInResponses>>(`${baseUrl}/refresh`, { method: "post" })
  }

  const verifyEmail = (id: string, hash: string, query: VerifyEmailRequest): Promise<Response<any>> => {
    return $api<Response<any>>(`${baseUrl}/verify-email/${id}/${hash}`, {
      method: "get",
      query,
    })
  }

  const resendEmailVerification = (): Promise<Response<any>> => {
    return $api<Response<UserResponses>>(`${baseUrl}/email/verification-notification`, { method: "post" })
  }

  const resetPassword = (body: ResetRequest) => {
    return $api<Response<UserResponses>>(`${baseUrl}/reset-password`, { body, method: "post" })
  }

  const requestCode = (body: EmailPhonePayload) => {
    return $api<Response<any>>(`${baseUrl}/request-code`, { body, method: "post" })
  }

  const loginWithCode = (body: LoginCodeRequest) => {
    return $api<Response<SigInResponses>>(`${baseUrl}/login-code`, { body, method: "post" })
  }

  const sendResetCode = (body: ForgotSendCode) => {
    const options: Pick<ApiFetchOptions, "skipValidationNotify"> = {
      skipValidationNotify: true,
    }
    return $api<Response<any>>(`${baseUrl}/forgot-password`, {
      body,
      method: "post",
      ...options,
    })
  }

  const resetWithCode = (body: ForgotResetWithCode) => {
    return $api<Response<any>>(`${baseUrl}/reset-password-code`, { body, method: "post" })
  }

  return {
    login,
    register,
    refresh,
    logout,
    verifyEmail,
    resendEmailVerification,
    resetPassword,
    requestCode,
    loginWithCode,
    sendResetCode,
    resetWithCode,
  }
}
