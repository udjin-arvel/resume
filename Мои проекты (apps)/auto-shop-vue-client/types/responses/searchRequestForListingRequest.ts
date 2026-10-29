export interface SearchRequestForListingRequestOption {
  id: number
  has_listing: boolean
  status: "new" | "in_work" | "on_booking"
  brand: string | null
  series: string | null
  year_from: number | null
  year_to: number | null
  engine_type: string | null
  engine: string | null
  horse_power: number | null
  price_to: number | null
  client_name: string | null
}

export interface SearchRequestForListingRequestResponse {
  data: SearchRequestForListingRequestOption[]
  meta: {
    total: number
    offset: number
    limit: number
    default_option: SearchRequestForListingRequestOption | null
  }
}

export interface SearchRequestTransferOptionsResponse {
  data: SearchRequestForListingRequestOption[]
  meta: {
    total: number
    offset: number
    limit: number
    default_option?: null
  }
}
