import type Response from "@/types/responses/response"

export interface CompensationReportMedia {
  id: number
  url: string
}

export interface CompensationReport {
  id: number
  code: string
  description: string | null
  inspected_at: string
  is_visible: boolean
  is_visible_on_site: boolean
  is_expired: boolean
  listing_id: number
  photos: CompensationReportMedia[]
  documents: CompensationReportMedia[]
}

export type CompensationReportResponse<T> = Response<T> & {
  listing_number?: string | null
  listing_name?: string | null
}

export interface CompensationReportUpdate {
  description?: string | null
  inspected_at: string
  is_visible: boolean
  photo_ids?: number[]
  document_ids?: number[]
  deleted_media_ids?: number[]
}
