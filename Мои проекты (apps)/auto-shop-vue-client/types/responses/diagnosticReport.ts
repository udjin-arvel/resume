import type Response from "@/types/responses/response"

export type DiagnosticFormat = "url" | "own"

export interface DiagnosticReportMedia {
  id: number
  url: string
  poster?: string | null
}

export interface DiagnosticReport {
  id: number
  code: string
  description: string | null
  inspected_at: string
  is_visible: boolean
  is_visible_on_site: boolean
  is_expired: boolean
  listing_id: number
  photos: DiagnosticReportMedia[]
  defects: DiagnosticReportMedia[]
  videos: DiagnosticReportMedia[]
}

export type DiagnosticReportResponse<T> = Response<T> & {
  listing_number?: string | null
  listing_name?: string | null
}

export interface DiagnosticReportUpdate {
  description?: string | null
  inspected_at: string
  is_visible: boolean
  photo_ids?: number[]
  defect_ids?: number[]
  video_ids?: number[]
  deleted_media_ids?: number[]
}
