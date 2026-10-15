export interface StoreReviewRequest {
  orderId: number
  rating: "good" | "bad"
  liked: string
  disliked: string
}

export interface UpdateReviewStatusRequest {
  status: "accepted" | "rejected"
}

export interface ReviewIndexFilters {
  date_from?: string
  date_to?: string
  status?: string
  vin?: string
  brand_id?: string | number
  client_id?: string | number
}

export interface ReviewIndexRequest {
  page?: number
  limit?: number
  filter?: ReviewIndexFilters
  [key: string]: any
}
