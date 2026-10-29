export interface UploadedDraft {
  id: number
  url: string
}

/**
 * Минимум, нужный блоку загрузки медиа для показа плитки: `FileResponse`
 * подходит как есть, черновики и media отчёта нормализуются к этому виду.
 */
export interface MediaItem {
  id: number
  url: string
  thumb?: string
  descriptions?: Record<string, string>
}

export interface RawFilePayload {
  id: number
  name?: string
  file_name?: string
  mime_type?: string | null
  url?: string | null
}

export interface FileResponse {
  id: number
  uuid: string
  name: string
  size: number
  mime_type: string
  url: string
  poster?: string | null
  show_url: string | null
  collection: string
  isPreview?: boolean
  thumb?: string
  small?: string
  medium?: string
  descriptions?: Record<string, string>
}
