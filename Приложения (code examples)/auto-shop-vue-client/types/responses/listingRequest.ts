export interface ListingRequest {
  id: number
  type: string
  client_id: number
  user_id: number
  text: string | null
  status: string
  cancellation_reason?: string | null
  changed_by: number | null
  read_at: string | null
  listing_id: number | null
  listing_user_id: number | null
  source?: string
  search_request_id?: number
  search_request_title?: string | null
  car_link_id?: number
  car_link_url?: string | null
  car_link_wish?: string | null
  customer_interest?: string | null
  actor_name?: string | null
  assignee_id?: number | null
  event_status?: string
  old_price?: string | number | null
  new_price?: string | number | null
  listing_price?: string | number | null
  external_url?: string | null
  listing_year: number | null
  listing_vin: string | null
  listing_sale_status: string | null
  listing_gearbox: string | null
  listing_name: string | null
  client_name: string | null
  client_fio: string | null
  employee_name?: string | null
  listing_brand: string | null
  listing_model: string | null
  has_paid_diagnostic?: boolean
  logistic_order_id?: number | null
  queue_position?: number
  created_at: string
  updated_at: string
}

export interface ListingRequestBaseInfo {
  name: string
  engine: string
  year: number
  mileage: number
  image: string
  thumb?: string | null
  sale_status?: string | null
  user_id?: number | null
  created_by?: number | null
}

export interface ListingRequestTotals {
  total_video: number
  total_diagnostic: number
  total_compensation: number
  total_booking: number
  total_unread: number
}

export interface BookingClient {
  id: number
  user_id: number
  name: string
  has_paid_diagnostic: boolean
  has_paid_compensation: boolean
}
