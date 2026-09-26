import Request from "./request"
import type { OptionBase } from "@/types/form/optionType"
import type { FileResponse } from "@/types/form/file"
import type { DiagnosticFormat } from "@/types/responses/diagnosticReport"

export class ListingStore extends Request {
  carId?: number
  brand_id: number | undefined = undefined
  series_id: number | undefined = undefined
  model_id: number | undefined = undefined
  vin = ""
  internalNumber = ""
  manualInternalNumber = false
  externalUrl = ""
  sellerContactName = ""
  sellerPhone = ""
  comment = ""
  city?: OptionBase
  year?: OptionBase
  month = ""
  mileage?: number
  price?: number
  condition = ""
  options = ""
  bodyColor: string | OptionBase = ""
  original_paint?: boolean
  accessOption: "all" | "link" = "all"
  shownOnSite = false
  diagnostic_created_at: string | null = null
  diagnostic_changed_at: string | null = null
  diagnostic_format?: DiagnosticFormat
  isActive = true
  diagnosticLink = ""
  diagnosticComment = ""
  numberOfKeys?: number
  brand?: OptionBase
  series?: OptionBase
  model?: OptionBase
  engineType = ""
  engine = ""
  power?: number
  transmission = ""
  drive = ""
  bodyType = ""
  total_diagnostic = 0
  total_compensation = 0
  total_video = 0
  photoFiles: FileResponse[] = []
  videoFiles: FileResponse[] = []
  nameplateFiles: FileResponse[] = []
  defectFiles: FileResponse[] = []
  selectedInfoRequest: OptionBase[] = []
  selectedOption = ""
  chinaCity?: OptionBase
  complectation?: OptionBase
  photo_ids?: number[] = []
  video_ids?: number[] = []
  nameplate_ids?: number[] = []
  defect_ids?: number[] = []
  userId: number = 0
  releaseYear?: number
  hasCompensation?: boolean
  carLinkId: number | null = null
}

export class ListingUpdate extends ListingStore {
  id?: number
}

export interface BindRequestsRequest {
  search_request_ids: number[]
}

export interface ShareListingRequest {
  settings: {
    show_photos: boolean
    show_videos: boolean
    show_diagnostics: boolean
    show_compensation: boolean
    show_price: boolean
  }
  duration: string
}

export interface ImportFromUrlRequest {
  url: string
  with_photos?: boolean
}
