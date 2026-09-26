import type { ApiResponse } from "@/types/responses/response"
import { useApiParamTransform } from "@/composables/api/useApiParamTransform"
import type {
  LogisticOrderTracking,
  PublicLogisticOrderTracking,
} from "@/types/common/logisticOrderTracking"
import type {
  LogisticOrderTrackingRequest,
  LogisticOrderTrackingIndexRequest,
  TrackingRequest,

} from "@/types/requests/logisticOrderTracking"
import type {
  PublicTrackingApiListStrictResponse, TrackingApiListStrictResponse, TrackingMeta, TrackingResponse,
} from "@/types/responses/logisticOrderTracking"

export function useApiTracking() {
  const { call } = useApiParamTransform()
  const baseUrl = "api/v1/"
  const logisticsBaseUrl = `${baseUrl}logistics/order-trackings`

  const track = (payload: TrackingRequest) =>
    call<ApiResponse<TrackingResponse>>(
      `${baseUrl}tracking`,
      { method: "POST", body: payload },
    )

  const trackPublic = (
    uin: string,
    opts: { camelize?: boolean, snakeParams?: boolean } = {},
  ) =>
    call<PublicTrackingApiListStrictResponse<PublicLogisticOrderTracking>>(
      `${baseUrl}tracking/${uin}`,
      { method: "GET" },
      opts,
    )

  const index = (
    logisticOrderId: number | string,
    params: LogisticOrderTrackingIndexRequest = {},
    opts: { camelize?: boolean, snakeParams?: boolean } = {},
  ) =>
    call<TrackingApiListStrictResponse<LogisticOrderTracking>>(
      `${logisticsBaseUrl}/${logisticOrderId}`,
      { method: "GET", params },
      opts,
    )

  const show = (
    logisticOrderId: number | string,
    trackingId: number | string,
    opts: { camelize?: boolean, snakeParams?: boolean } = {},
  ) =>
    call<ApiResponse<LogisticOrderTracking, TrackingMeta>>(
      `${logisticsBaseUrl}/${logisticOrderId}/${trackingId}`,
      { method: "GET" },
      opts,
    )

  const listing = (
    logisticOrderId: number | string,
    opts: { camelize?: boolean, snakeParams?: boolean } = {},
  ) =>
    call<ApiResponse<LogisticOrderTracking, TrackingMeta>>(
      `${logisticsBaseUrl}/${logisticOrderId}/listing`,
      { method: "GET" },
      opts,
    )

  const store = (
    logisticOrderId: number | string,
    payload: LogisticOrderTrackingRequest,
    opts: { camelize?: boolean, snakeParams?: boolean } = {},
  ) =>
    call<ApiResponse<LogisticOrderTracking>>(
      `${logisticsBaseUrl}/${logisticOrderId}`,
      { method: "POST", body: payload },
      opts,
    )

  const update = (
    logisticOrderId: number | string,
    trackingId: number | string,
    payload: LogisticOrderTrackingRequest,
    opts: { camelize?: boolean, snakeParams?: boolean } = {},
  ) =>
    call<ApiResponse<LogisticOrderTracking>>(
      `${logisticsBaseUrl}/${logisticOrderId}/${trackingId}`,
      { method: "PUT", body: payload },
      opts,
    )

  const downloadArchive = (ids: number[]) =>
    call<Blob>(
      `${logisticsBaseUrl}/download-archive`,
      {
        method: "POST",
        body: { ids },
        responseType: "blob",
        headers: {
          accept: "*/*",
        },
      },

      {
        camelize: false,
        snakeParams: true,
      },
    )

  return {
    track,
    trackPublic,
    index,
    show,
    store,
    update,
    listing,
    downloadArchive,
  }
}
