import { apiRequest } from '../../api/client'

export type AdminAuditEntry = {
  id: string
  adminEmail?: string | null
  action: string
  entityType?: string | null
  entityId?: string | null
  diff?: unknown
  ip?: string | null
  userAgent?: string | null
  createdAt: string
}

export type AdminAuditPage = {
  items: AdminAuditEntry[]
  nextCursor: string
}

export function listAdminAudit(params: {
  limit?: number
  adminUserId?: string
  entityType?: string
  entityId?: string
  from?: string
  to?: string
  cursor?: string
}) {
  const search = new URLSearchParams()
  if (params.limit) {
    search.set('limit', String(params.limit))
  }
  if (params.adminUserId) {
    search.set('adminUserId', params.adminUserId)
  }
  if (params.entityType) {
    search.set('entityType', params.entityType)
  }
  if (params.entityId) {
    search.set('entityId', params.entityId)
  }
  if (params.from) {
    search.set('from', params.from)
  }
  if (params.to) {
    search.set('to', params.to)
  }
  if (params.cursor) {
    search.set('cursor', params.cursor)
  }
  const qs = search.toString()
  return apiRequest<AdminAuditPage>(`/v1/admin/audit${qs ? `?${qs}` : ''}`)
}
