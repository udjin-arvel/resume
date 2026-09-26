import type { OptionBase } from "@/types/form/optionType"
import type {
  RequestStatusDraft,
  RequestStatusNew,
  RequestStatusInWork,
  RequestStatusOnBooking,
  RequestStatusCompleted,
  RequestStatusCancelled,
} from "@/constants/statuses"

export type SearchRequestStatusType =
  | typeof RequestStatusDraft
  | typeof RequestStatusNew
  | typeof RequestStatusInWork
  | typeof RequestStatusOnBooking
  | typeof RequestStatusCompleted
  | typeof RequestStatusCancelled

export interface SearchRequestVariantDetail {
  id: number
  priority: number
  condition: "new" | "used"
  year_from?: number | null
  year_to?: number | null
  price_to?: number | string | null
  mileage_to?: number | null
  body_colors?: string[] | null
  original_paint?: boolean
  description?: string | null
  description_ru?: string | null
  description_zh?: string | null
  description_original_locale?: string | null
  brand?: { id: number, name?: string } | null
  series?: { id: number, name?: string } | null
  engine_type?: string | null
  engine?: string | number | null
  horse_power?: number | string | null
  transmission?: string | null
  drive?: string | null
  body_type?: string | null
  cars?: {
    car_id: number
    name?: string
    img?: string | null
    brand_id?: number | null
    series_id?: number | null
    model_id?: number | null
  }[]
}

export interface SearchRequestsResponse {
  status: string
  data: SearchRequest[]
  meta: {
    currentPage: number
    lastPage: number
    limit: number
    offset: number
    total: number
  }
}

export interface SearchRequest {
  id: number
  user_id: number
  user_name: string
  company_id?: number | null
  company_name?: string | null
  brand: { id: number, name?: string } | string | null
  series: { id: number, name?: string } | string | null
  model: string | { id: number }
  year_range: string
  price_to?: string | null
  mileage_to: number
  client_name?: string
  status: SearchRequestStatusType
  find_more_requested: boolean
  find_more_requested_at?: string | null
  condition: "new" | "used"
  original_paint?: boolean
  changed_at?: string | null
  acknowledged_at?: string | null
  description: string
  found: number
  created_at: string
  updated_at: string
  engine_type?: string | null
  engine?: string | number | null
  horse_power?: number | string | null
  transmission?: string | null
  drive?: string | null
  proposals_count?: number | null
  chat_id?: number | null
  chat_unread?: number
  diagnostic_requests_count?: number
  compensation_requests_count?: number
  variants?: SearchRequestVariantDetail[]
  executor?: {
    id: number
    name: string
  } | null
  user?: {
    id?: number
    name?: string
  } | null
}

export interface SearchRequestParams {
  offset?: number
  limit?: number
  query?: string
  sortKey?: string
  sortDirection?: string
  filter?: {
    client_name?: string
    client_id?: number
    user_name?: string
    user_id?: number
    buyer_id?: number
    executor_id?: number
    executor_ids?: Array<number | string>
    executor_scope?: "mine" | "my_pending" | string
    status?: string
    statuses?: string[]
    brand_id?: string | number
    brand_ids?: number[]
    series_id?: string | number
    series_ids?: number[]
    date_from?: string
    date_to?: string
    search?: string
    id?: number
    id_like?: string
  }
}

export interface FilterOptions {
  clients: OptionBase[]
  users: OptionBase[]
  companies?: OptionBase[]
  brands: OptionBase[]
  series?: OptionBase[]
  sellers?: OptionBase[]
}

export interface SearchRequestChange {
  changed_at: string
  changed_by: number | null
  user_name?: string | null
  payload?: Record<string, any> | null
}

export interface SearchRequestListingRequest {
  id: number
  type: "diagnostic" | "compensation"
  status: string
  created_at: string | null
  can_transfer?: boolean
  transfer_blocked_reason?: "not_owner" | "source_not_active" | "source_invoiced" | "unsupported_request" | null
  listing: {
    id: number
    name: string
  } | null
}

export interface SearchRequestDetail extends SearchRequest {
  listing_requests: SearchRequestListingRequest[]
  brand: {
    id: number
    name?: string
  } | null
  series: {
    id: number
    name?: string
  } | null
  cancellation_reason?: string | null
  condition: "new" | "used"
  body_colors?: string | null
  year_from?: number | null
  year_to?: number | null
  changes?: SearchRequestChange[]
  cars?: {
    car_id: number
    name?: string
    img?: string | null
    brand_id?: number | null
    series_id?: number | null
    model_id?: number | null
  }[]
  variants?: SearchRequestVariantDetail[]
}

export interface OpenRequestRaw {
  id: number
  value: number
  request_id: number
  created_at: string | null
  cars_info: string[]
  client_name: string | null
  status: SearchRequestStatusType
  disabled: boolean
  disabled_reason?: "booking_pending" | null
}

export interface OpenRequestsResponse {
  data: OpenRequestRaw[]
}

export interface RequestOption {
  id: number
  value: number
  name: string
  searchText?: string
  disabled: boolean
  status: SearchRequestStatusType
  disabled_reason?: "booking_pending" | null
}
