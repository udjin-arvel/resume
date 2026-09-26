import { ref, readonly } from "vue"
import { useApiTracking } from "#imports"
import type { DraftFileData } from "@/composables/api/useApiUpload"
import usePagination from "@/composables/usePagination"
import { useApiAction } from "@/composables/useApiAction"
import type {
  LogisticOrderTracking,
  PublicLogisticOrderTracking,
} from "@/types/common/logisticOrderTracking"
import type {
  LogisticOrderTrackingIndexRequest,
  LogisticOrderTrackingRequest,
} from "@/types/requests/logisticOrderTracking"
import type { ApiResponse } from "@/types/responses/response"
import type {
  PublicTrackingApiListStrictResponse,
  PublicTrackingListMeta,
  TrackingApiListStrictResponse,
  TrackingListMeta,
  TrackingMeta,
} from "@/types/responses/logisticOrderTracking"
import type { SimpleFile } from "@/types/common/file"
import { useBatchDraftUpload } from "@/composables/useBatchDraftUpload"

interface UseLogisticOrderTrackingOptions {
  logisticOrderId: number | string
}

export function useLogisticOrderTracking(options: UseLogisticOrderTrackingOptions) {
  const { logisticOrderId } = options

  const { run, runWithLoading, isLoading, errors } = useApiAction()

  const items = ref<LogisticOrderTracking[]>([])
  const meta = ref<TrackingListMeta | null>(null)
  const trackingMeta = ref<TrackingMeta | null>(null)

  const publicItems = ref<PublicLogisticOrderTracking[]>([])
  const publicMeta = ref<PublicTrackingListMeta | null>(null)

  const isUploadingMedia = ref(false)
  const isUploadingDocument = ref(false)
  const isUploadingBuyerDocument = ref(false)

  const {
    index,
    show: _show,
    store: _store,
    update: _update,
    trackPublic: _trackPublic,
    listing: _listing,
  } = useApiTracking()

  const { uploadBatch } = useBatchDraftUpload()

  function draftToSimpleFile(draft: DraftFileData, fallbackMimeType = ""): SimpleFile {
    return {
      id: draft.id,
      name: draft.name,
      uuid: String(draft.id),
      url: draft.url ?? "",
      mimeType: draft.mimeType || fallbackMimeType,
      size: 0,
      thumb: null,
    }
  }

  const {
    __currentPage,
    __limit,
    offset,
    total,
    lastPage,
    next,
    prev,
    first,
    last,
    applyMeta,
  } = usePagination({
    currentPage: 1,
    limit: 20,
    total: 0,
  })

  async function fetchTrackings(extraParams: Partial<LogisticOrderTrackingIndexRequest> = {}) {
    return run(async () => {
      const params: LogisticOrderTrackingIndexRequest = {
        offset: offset.value,
        limit: __limit.value,
        ...extraParams,
      }

      const res = await index(
        logisticOrderId,
        params,
        { camelize: true, snakeParams: true },
      ) as TrackingApiListStrictResponse<LogisticOrderTracking>

      items.value = res.data
      meta.value = res.meta
      applyMeta(res.meta)

      return res
    })
  }

  async function fetchTracking(trackingId: number | string): Promise<LogisticOrderTracking | undefined> {
    return run(async () => {
      const res = await _show(
        logisticOrderId,
        trackingId,
        { camelize: true, snakeParams: true },
      ) as ApiResponse<LogisticOrderTracking, TrackingMeta>

      trackingMeta.value = res.meta || null

      return res.data || undefined
    })
  }

  async function fetchListing(): Promise<LogisticOrderTracking | undefined> {
    return run(async () => {
      const res = await _listing(
        logisticOrderId,
        { camelize: true, snakeParams: true },
      ) as ApiResponse<LogisticOrderTracking, TrackingMeta>

      trackingMeta.value = res.meta || null

      return res.data || undefined
    })
  }

  async function fetchPublicTrackings(uin: string) {
    return run(async () => {
      const res = await _trackPublic(
        uin,
        { camelize: true },
      ) as PublicTrackingApiListStrictResponse<PublicLogisticOrderTracking>

      publicItems.value = res.data || []
      publicMeta.value = res.meta

      return res
    })
  }

  async function uploadPhotos(files: FileList | File[]) {
    return runWithLoading(isUploadingMedia, async () => {
      const result = await uploadBatch(files, "logistic_tracking_media")
      return {
        uploaded: result.uploaded.map(({ file, draft }) => ({ file, value: draftToSimpleFile(draft, file.type) })),
        failed: result.failed,
      }
    })
  }

  async function uploadDocuments(files: FileList | File[]) {
    return runWithLoading(isUploadingDocument, async () => {
      const result = await uploadBatch(files, "logistic_tracking_document")
      return {
        uploaded: result.uploaded.map(({ file, draft }) => ({ file, value: draftToSimpleFile(draft, file.type) })),
        failed: result.failed,
      }
    })
  }

  async function uploadBuyerDocuments(files: FileList | File[]) {
    return runWithLoading(isUploadingBuyerDocument, async () => {
      const result = await uploadBatch(files, "logistic_tracking_buyer_document")
      return {
        uploaded: result.uploaded.map(({ file, draft }) => ({ file, value: draftToSimpleFile(draft, file.type) })),
        failed: result.failed,
      }
    })
  }

  async function createTracking(
    payload: LogisticOrderTrackingRequest,
  ): Promise<LogisticOrderTracking | undefined> {
    return run(async () => {
      const response = await _store(
        logisticOrderId,
        payload,
        { camelize: true, snakeParams: true },
      ) as ApiResponse<LogisticOrderTracking>

      return response.data || undefined
    })
  }

  async function updateTracking(
    trackingId: number | string,
    payload: LogisticOrderTrackingRequest,
  ): Promise<LogisticOrderTracking | undefined> {
    return run(async () => {
      const response = await _update(
        logisticOrderId,
        trackingId,
        payload,
        { camelize: true, snakeParams: true },
      ) as ApiResponse<LogisticOrderTracking>

      return response.data || undefined
    })
  }

  return {
    items,
    meta,
    publicItems,
    publicMeta,
    errors,
    isLoading: readonly(isLoading),
    isUploadingMedia: readonly(isUploadingMedia),
    isUploadingDocument: readonly(isUploadingDocument),
    isUploadingBuyerDocument: readonly(isUploadingBuyerDocument),
    page: __currentPage,
    limit: __limit,
    total,
    lastPage,
    next,
    prev,
    first,
    last,
    fetchTrackings,
    fetchTracking,
    fetchPublicTrackings,
    uploadPhotos,
    uploadDocuments,
    uploadBuyerDocuments,
    createTracking,
    updateTracking,
    trackingMeta,
    fetchListing,
  }
}
