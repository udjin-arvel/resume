import type { LogisticOrderStatus } from "@/types/common/logisticOrder"
import type { ListQueryRequest } from "@/types/requests/request"

export interface LogisticOrderTrackingRequest {
  status: LogisticOrderStatus
  comment?: string | null
  mediaFileIds?: number[]
  documentFileIds?: number[]
  buyerDocumentFileIds?: number[]
}

export interface TrackingRequest {
  "vin_or_id": string
  "h-captcha-response": string
}

export type LogisticOrderTrackingIndexRequest = ListQueryRequest
