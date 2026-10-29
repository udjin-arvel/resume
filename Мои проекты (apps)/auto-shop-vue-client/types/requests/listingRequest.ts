export interface ListingRequestStore {
  type: string
  text?: string | null
  search_request_id?: number | null
}

export interface ListingRequestSubscribe {
  type: string
  search_request_id?: number | null
}
