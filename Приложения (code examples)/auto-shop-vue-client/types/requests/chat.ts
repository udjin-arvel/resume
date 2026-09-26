import type { ListQueryRequest } from "@/types/requests/request"

export type ChatMessagesRequest = ListQueryRequest & {
  minId?: number
}

export interface ChatListRequest extends ListQueryRequest {
  subject?: string
  chatType?: string
  questionType?: string
  sellerId?: string | number
  buyerId?: string | number
  brandId?: string | number
  modelId?: string | number
  vin?: string
  siteNumber?: string
  search?: string
  listingId?: string | number
}

export interface GetBuyerSellerRequest {
  listingId: number
  buyerId: number
  sellerId?: number
}

export interface GetSearchRequestChatRequest {
  searchRequestId: number
}

export interface GetAdminUserRequest {
  userId: number
}

export type FilterOptions = {
  brands: FilterOption[]
  series: FilterOption[]
  clients: FilterOption[]
  sellers: FilterOption[]
  users: FilterOptions[]
}

export type FilterOption = {
  id: number
  name: string
}
