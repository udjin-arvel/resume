export type SimpleFile = {
  id: number
  name: string
  uuid: string
  url: string
  mimeType: string
  size: number
  thumb: string | null
  downloadUrl?: string | null
  collection?: string | null
  showUrl?: string | null
}
