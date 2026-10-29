import { ref, readonly } from "vue"
import { useI18n } from "vue-i18n"
import { useApiListingRequest } from "@/composables/api/useApiListingRequest"
import { useLoadingIndicator } from "#imports"
import type { ListingRequestStore } from "@/types/requests/listingRequest"
import type { ListingRequest } from "@/types/responses/listingRequest"
import type Response from "@/types/responses/response"
import {
  RequestTypeVideo,
  RequestTypeDiagnostic,
  RequestTypeCompensation,
  RequestTypeBooking,
} from "@/constants/listingRequests"
import type { RequestType } from "@/types/common/listingRequests"
import Errors from "@/classes/errors"
import { useListingRequestStore } from "@/stores/listingRequest"
import type { Alert } from "@/types/common/alert"
import { AlertTypeEnum } from "@/types/common/alert"
import type { ShortListing } from "@/types/responses/listing"
import type { ApiFetchOptions } from "@/types/common/api"

export function useListingRequest(car: ShortListing | null) {
  const { t } = useI18n()
  const {
    store: _store,
    subscribe: _subscribe,
    close: _close,
    decline: _decline,
    reopen: _reopen,
    getListingRequests: _getListingRequests,
  } = useApiListingRequest()
  const { isLoading, start, finish } = useLoadingIndicator()
  const storeListing = useListingRequestStore()

  const requestData = ref<ListingRequestStore>({ type: RequestTypeVideo, text: "" })
  const errors = ref(new Errors())
  const alert = ref<Alert | null>(null)
  const data = ref<ListingRequest[]>([])
  const pagination = ref({
    page: 1,
    perPage: 10,
    total: 0,
  })

  const store = async (listingId: number, type: RequestType, text?: string, searchRequestId?: number | null): Promise<boolean> => {
    start()
    errors.value.clear()
    alert.value = null

    const apiOptions: ApiFetchOptions = { skipValidationNotify: true }

    try {
      if (type === RequestTypeDiagnostic) {
        await _subscribe(listingId, { type, search_request_id: searchRequestId }, apiOptions)
        if (car) {
          car.diagnostic_requested = true
        }
      }
      else if (type === RequestTypeCompensation) {
        await _subscribe(listingId, { type, search_request_id: searchRequestId }, apiOptions)
        if (car) {
          car.compensation_requested = true
        }
      }
      else if (type === RequestTypeBooking) {
        const requestData: ListingRequestStore = { type, search_request_id: searchRequestId ?? null }
        await _store(listingId, requestData)
        if (car) {
          car.booking_requested = true
        }
      }
      else {
        const requestData: ListingRequestStore = { type, text: text || undefined }
        await _store(listingId, requestData)
        if (car) {
          if (type === RequestTypeVideo) {
            car.video_requested = true
          }
        }
      }
      return true
    }
    catch (error: any) {
      const _error: Response<any> = error.data as Response<any> || {}
      if (_error.errors) {
        errors.value.record(_error.errors)
        const errorMessage = Object.values(_error.errors)[0]?.[0] || t("error.base.generic")
        alert.value = {
          type: AlertTypeEnum.Error,
          subtitle: t("error.base.title"),
          text: errorMessage,
        }
      }
      else if (_error.message) {
        alert.value = {
          type: AlertTypeEnum.Error,
          subtitle: t("error.base.title"),
          text: _error.message,
        }
      }
      else {
        alert.value = {
          type: AlertTypeEnum.Error,
          subtitle: t("error.base.title"),
          text: t("error.base.generic"),
        }
      }
      return false
    }
    finally {
      finish()
    }
  }

  const clearAlert = () => {
    alert.value = null
    errors.value.clear()
  }

  const fetchListingRequests = async (
    listingId: number,
    page = pagination.value.page,
    perPage = pagination.value.perPage,
    type?: RequestType,
  ) => {
    start()
    try {
      const offset = (page - 1) * perPage
      const response = await _getListingRequests(listingId, {
        offset,
        limit: perPage,
        filter: { type },
      })

      if (response.data) {
        data.value = response.data
      }

      pagination.value = {
        page,
        perPage,
        total: response.meta?.total ?? data.value.length,
      }

      storeListing.setListingTotals(response.meta?.totals)
      return response
    }
    finally {
      finish()
    }
  }

  const close = async (listingId: number, requestId: number): Promise<void> => {
    start()
    try {
      const response = await _close(listingId, requestId)
      storeListing.setListingTotals(response.meta?.totals)
    }
    finally {
      finish()
    }
  }

  const decline = async (listingId: number, requestId: number): Promise<void> => {
    start()
    try {
      const response = await _decline(listingId, requestId)
      storeListing.setListingTotals(response.meta?.totals)
    }
    finally {
      finish()
    }
  }

  const reopen = async (listingId: number, requestId: number): Promise<void> => {
    start()
    try {
      const response = await _reopen(listingId, requestId)
      storeListing.setListingTotals(response.meta?.totals)
    }
    finally {
      finish()
    }
  }

  return {
    store,
    close,
    decline,
    reopen,
    requestData,
    errors,
    alert,
    clearAlert,
    data,
    pagination,
    fetchListingRequests,
    isLoading: readonly(isLoading),
  }
}
