import { apiRequest } from '../../api/client'

import type { Substance } from '../substances/api'

export type ModerationCounts = {
  pending: number
  approved: number
  rejected: number
}

export type ModerationQueueItem = {
  id: string
  source: string
  barcode: string
  candidate: Record<string, unknown>
  normalizedKey: string
  status: string
  createdAt: string
  reviewedBy?: string | null
  reviewedAt?: string | null
  rejectReason?: string | null
  resolvedSubstanceId?: string | null
  mergeSuggestion?: Substance | null
}

export type ModerationQueueResponse = {
  counts: ModerationCounts
  items: ModerationQueueItem[]
}

export type ModerationApproveOverrides = {
  code?: string
  name?: string
  aliases?: string[]
  category?: string
  dangerLevel?: 'safe' | 'controversial' | 'dangerous'
  description?: string
  sources?: string[]
  isActive?: boolean
}

export function listModerationQueue(params: {
  status?: string
  limit?: number
  suggestions?: boolean
}) {
  const search = new URLSearchParams()
  if (params.status) {
    search.set('status', params.status)
  }
  if (params.limit) {
    search.set('limit', String(params.limit))
  }
  if (params.suggestions) {
    search.set('suggestions', 'true')
  }
  const qs = search.toString()
  return apiRequest<ModerationQueueResponse>(`/v1/admin/moderation/queue${qs ? `?${qs}` : ''}`)
}

export function approveModerationItem(id: string, overrides?: ModerationApproveOverrides) {
  return apiRequest<Substance>(`/v1/admin/moderation/${id}/approve`, {
    method: 'POST',
    body: overrides && Object.keys(overrides).length > 0 ? JSON.stringify(overrides) : undefined,
  })
}

export function rejectModerationItem(id: string, reason: string) {
  return apiRequest<void>(`/v1/admin/moderation/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })
}

export type SubstanceAuditHistoryRow = {
  id: string
  action: string
  createdAt: string
  diff?: unknown
}

export function listSubstanceAuditHistory(substanceId: string, limit = 30) {
  const params = new URLSearchParams({ limit: String(limit) })
  return apiRequest<{ items: SubstanceAuditHistoryRow[] }>(
    `/v1/admin/substances/${substanceId}/audit-history?${params.toString()}`,
  )
}

export function rollbackSubstance(substanceId: string, auditId: string) {
  return apiRequest<Substance>(`/v1/admin/substances/${substanceId}/rollback`, {
    method: 'POST',
    body: JSON.stringify({ auditId }),
  })
}
