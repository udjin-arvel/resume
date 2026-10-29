import { apiRequest } from '../../api/client'

export type AdminUser = {
  id: string
  deviceId: string
  email?: string | null
  isPremiumUntil?: string | null
  createdAt: string
}

export type AdminUsersPage = {
  items: AdminUser[]
  nextCursor: string
}

export function listAdminUsers(params: {
  limit?: number
  premium?: string
  cursor?: string
}) {
  const search = new URLSearchParams()
  if (params.limit) {
    search.set('limit', String(params.limit))
  }
  if (params.premium && params.premium !== 'all') {
    search.set('premium', params.premium)
  }
  if (params.cursor) {
    search.set('cursor', params.cursor)
  }
  const qs = search.toString()
  return apiRequest<AdminUsersPage>(`/v1/admin/users${qs ? `?${qs}` : ''}`)
}

export function patchAdminUser(id: string, body: { isPremiumUntil: string | null }) {
  return apiRequest<AdminUser>(`/v1/admin/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}
