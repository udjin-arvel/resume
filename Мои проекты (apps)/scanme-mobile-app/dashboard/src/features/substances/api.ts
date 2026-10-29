import { apiRequest } from '../../api/client'

export type DangerLevel = 'safe' | 'controversial' | 'dangerous'

export type Substance = {
  id: string
  code?: string
  name: string
  aliases: string[]
  category: string
  dangerLevel: DangerLevel
  description: string
  sources: string[]
  isActive: boolean
  version: number
  createdAt: string
  updatedAt: string
}

export type SubstancePayload = {
  code: string
  name: string
  aliases: string[]
  category: string
  dangerLevel: DangerLevel
  description: string
  sources: string[]
  isActive: boolean
}

export type SubstanceListResponse = {
  items: Substance[]
  nextVersion: number
}

export type SubstanceFilters = {
  q?: string
  category?: string
  dangerLevel?: string
  isActive?: string
}

export function listAdminSubstances(filters: SubstanceFilters) {
  const params = new URLSearchParams({ limit: '100' })
  for (const [key, value] of Object.entries(filters)) {
    if (value) {
      params.set(key, value)
    }
  }

  return apiRequest<SubstanceListResponse>(`/v1/admin/substances?${params.toString()}`)
}

export function createSubstance(payload: SubstancePayload) {
  return apiRequest<Substance>('/v1/admin/substances', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateSubstance(id: string, payload: SubstancePayload) {
  return apiRequest<Substance>(`/v1/admin/substances/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function deleteSubstance(id: string) {
  return apiRequest<void>(`/v1/admin/substances/${id}`, {
    method: 'DELETE',
  })
}

export function importSubstances(payload: SubstancePayload[]) {
  return apiRequest<Substance[]>('/v1/admin/substances/import', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function exportSubstances() {
  return apiRequest<Substance[]>('/v1/admin/substances/export')
}
