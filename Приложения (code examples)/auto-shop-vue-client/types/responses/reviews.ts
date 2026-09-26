import type { OptionBase } from "@/types/form/optionType"

export interface ReviewResponse {
  id: number
  orderId: number
  carId: number
  buyerId: number
  sellerId: number
  rating: "good" | "bad"

  liked: string | null
  disliked: string | null

  likedRu: string | null
  likedZh: string | null
  dislikedRu: string | null
  dislikedZh: string | null
  original_locale: "ru" | "zh" | null

  status: "accepted" | "rejected" | "pending"
  createdAt: string
  updatedAt: string

  car?: {
    id: number
    name: string
    brand: string
    model: string
    year: number
    vin: string
    engine: number
    mileage: number
    price: number
    images?: Array<{ url: string }>
  }
  buyer?: {
    id: number
    name: string
    email: string
  }
  seller?: {
    id: number
    name: string
  }
}

export interface ReviewUserData {
  id: number | null
  name: string | null
}

export interface ReviewCarData {
  id: number
  name: string
  brand: string | null
  model: string | null
  year: number | null
  vin: string | null
  engine: string
  mileage: number | null
  images: { url: string }[]
  image: string | null
}

export interface ReviewCreateFormResponse {
  order_id: number
  car: ReviewCarData | null
  seller: ReviewUserData | null
  buyer: ReviewUserData | null
}

export interface ReviewFiltersResponse {
  vins: OptionBase[]
  brands: OptionBase[]
  clients: OptionBase[]
}
