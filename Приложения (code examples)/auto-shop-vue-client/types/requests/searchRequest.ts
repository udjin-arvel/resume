import Request from "./request"
import type { OptionBase } from "@/types/form/optionType"

export interface SearchRequestCar {
  car_id: number
  brand_id: number | null
  series_id: number | null
  model_id: number | null
}

export interface SearchRequestVariantPayload {
  id?: number
  priority: number
  condition: "new" | "used"
  year_from: number | null
  year_to: number | null
  price_to: number | null
  mileage_to: number | null
  body_colors: string[] | null
  original_paint: boolean
  description: string
  cars: SearchRequestCar[]
}

export interface NeedVariantFormState {
  localId: string
  id?: number
  priority: number
  condition: "new" | "used"
  brand?: OptionBase
  series?: OptionBase
  models: OptionBase[]
  yearFrom: number | null
  yearTo: number | null
  priceTo: number | null
  mileageTo: number | null
  bodyColors?: OptionBase[]
  originalPaint: boolean
  description: string
  filters: {
    engineType?: string
    engine?: string
    power?: number
    transmission?: string
    drive?: string
    bodyType?: string
  }
}

export class SearchRequestStore extends Request {
  clientName = ""
  condition: "new" | "used" = "used"
  brand?: OptionBase
  series?: OptionBase
  models: OptionBase[] = []
  yearFrom: number | null = null
  yearTo: number | null = null
  priceTo: number | null = null
  mileageTo: number | null = null
  bodyColors?: OptionBase[]
  originalPaint?: boolean
  description = ""
  status = ""
  cars?: SearchRequestCar[]
  variants?: NeedVariantFormState[]
}

export class SearchRequestUpdate extends SearchRequestStore {
  id?: number
}

export interface RejectProposalRequest {
  listing_id: number
  rejection_reason: string
  draft_media_ids?: number[]
}
