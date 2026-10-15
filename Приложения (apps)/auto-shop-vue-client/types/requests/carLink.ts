import type { ListQueryRequest } from "./request"
import type { CarCondition, CarLinkStatus, CustomerInterest } from "@/constants/carLink"

export interface CarLinkStoreRequest {
  url: string
  condition: CarCondition
  wish?: string | null
}

export interface CarLinkIndexRequest extends Omit<ListQueryRequest, "filter"> {
  filter?: {
    status?: CarLinkStatus | CarLinkStatus[]
  }
}

export interface CarLinkAssignRequest {
  assigneeId: number
}

export interface CarLinkReplyRequest {
  reply: string
  listingUrl?: string | null
}

export interface CarLinkInterestRequest {
  interest: CustomerInterest
}

export interface CarLinkAttachListingRequest {
  listingUrl: string
}

export interface CarLinkCancelRequest {
  description: string
}

export interface CarLinkInternalNoteRequest {
  internalNote: string | null
}
