import { apiRequest } from '../../api/client'

export type AdminLoginRequest = {
  email: string
  password: string
}

export type AdminLoginResponse = {
  accessToken: string
  expiresAt: string
  role: string
}

export function loginAdmin(payload: AdminLoginRequest) {
  return apiRequest<AdminLoginResponse>('/v1/admin/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
