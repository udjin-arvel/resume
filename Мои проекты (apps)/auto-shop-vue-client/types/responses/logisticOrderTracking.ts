import type { ApiMetaList, ApiResponse } from "~/types/responses/response"
import type { LogisticOrder, LogistData } from "~/types/common/logisticOrder"

export interface PublicTrackingListMeta extends ApiMetaList {
  deliveryId: string
  vin: string
  name: string
  year: string
  updatedAt: string
}

export type PublicTrackingApiListStrictResponse<TItem> = ApiResponse<TItem[], PublicTrackingListMeta> & {
  meta: PublicTrackingListMeta
}

export interface TrackingListMeta extends ApiMetaList {
  image: string
  name: string
  order: LogisticOrder
  orders?: LogisticOrderShort[]
  logists?: LogistData[]
}

export type TrackingApiListStrictResponse<TItem> = ApiResponse<TItem[], TrackingListMeta> & {
  meta: TrackingListMeta
}

export interface TrackingMeta {
  id: number | null
  name: string | null
  year: number | null
  shortGearbox: string | null
  shortPowerType: string | null
  shortDriveType: string | null
  image: string | null
}

export interface LogisticOrderShort {
  id: number
  name: string
}

export interface TrackingRedirect {
  to: string
}

export interface TrackingResponse {
  redirect?: TrackingRedirect
}
