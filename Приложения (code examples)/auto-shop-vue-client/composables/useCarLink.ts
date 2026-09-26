import { ref, readonly } from "vue"
import { useApiCarLink } from "@/composables/api/useApiCarLink"
import usePagination from "@/composables/usePagination"
import { useApiAction } from "@/composables/useApiAction"
import type { CarLinkData } from "@/types/common/carLink"
import type {
  CarLinkIndexRequest,
  CarLinkStoreRequest,
  CarLinkAssignRequest,
  CarLinkReplyRequest,
  CarLinkInterestRequest,
  CarLinkAttachListingRequest,
  CarLinkCancelRequest,
  CarLinkInternalNoteRequest,
} from "@/types/requests/carLink"
import type { ApiListStrictResponse, ApiResponse, ApiMetaList } from "@/types/responses/response"

export function useCarLink() {
  const { run, isLoading, errors } = useApiAction()

  const items = ref<CarLinkData[]>([])
  const item = ref<CarLinkData | null>(null)
  const meta = ref<ApiMetaList | null>(null)

  const {
    index: _index,
    show: _show,
    store: _store,
    assign: _assign,
    reply: _reply,
    interest: _interest,
    attachListing: _attachListing,
    reopen: _reopen,
    cancel: _cancel,
    updateInternalNote: _updateInternalNote,
  } = useApiCarLink()

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

  async function fetchCarLinks(extraParams: Partial<CarLinkIndexRequest> = {}) {
    return run(async () => {
      const params: CarLinkIndexRequest = {
        offset: offset.value,
        limit: __limit.value,
        ...extraParams,
      }

      const res = await _index(
        params,
        { camelize: true, snakeParams: true },
      ) as ApiListStrictResponse<CarLinkData>

      items.value = res.data
      meta.value = res.meta
      applyMeta(res.meta)

      return res
    })
  }

  async function fetchCarLink(id: number | string): Promise<CarLinkData | undefined> {
    return run(async () => {
      const res = await _show(
        id,
        { camelize: true, snakeParams: true },
      ) as ApiResponse<CarLinkData>

      item.value = res.data || null
      return res.data || undefined
    })
  }

  async function createCarLink(payload: CarLinkStoreRequest): Promise<CarLinkData | undefined> {
    return run(async () => {
      const response = await _store(
        payload,
        { camelize: true, snakeParams: true },
      ) as ApiResponse<CarLinkData>

      return response.data || undefined
    })
  }

  async function assignCarLink(id: number | string, payload: CarLinkAssignRequest): Promise<CarLinkData | undefined> {
    return run(async () => {
      const response = await _assign(
        id,
        payload,
        { camelize: true, snakeParams: true },
      ) as ApiResponse<CarLinkData>

      if (item.value && String(item.value.id) === String(id)) {
        item.value = response.data
      }
      return response.data || undefined
    })
  }

  async function replyCarLink(id: number | string, payload: CarLinkReplyRequest): Promise<CarLinkData | undefined> {
    return run(async () => {
      const response = await _reply(
        id,
        payload,
        { camelize: true, snakeParams: true },
      ) as ApiResponse<CarLinkData>

      if (item.value && String(item.value.id) === String(id)) {
        item.value = response.data
      }
      return response.data || undefined
    })
  }

  async function setCarLinkInterest(id: number | string, payload: CarLinkInterestRequest): Promise<CarLinkData | undefined> {
    return run(async () => {
      const response = await _interest(
        id,
        payload,
        { camelize: true, snakeParams: true },
      ) as ApiResponse<CarLinkData>

      if (item.value && String(item.value.id) === String(id)) {
        item.value = response.data
      }
      return response.data || undefined
    })
  }

  async function attachCarLinkListing(id: number | string, payload: CarLinkAttachListingRequest): Promise<CarLinkData | undefined> {
    return run(async () => {
      const response = await _attachListing(
        id,
        payload,
        { camelize: true, snakeParams: true },
      ) as ApiResponse<CarLinkData>

      if (item.value && String(item.value.id) === String(id)) {
        item.value = response.data
      }
      return response.data || undefined
    })
  }

  async function reopenCarLink(id: number | string): Promise<CarLinkData | undefined> {
    return run(async () => {
      const response = await _reopen(
        id,
        { camelize: true, snakeParams: true },
      ) as ApiResponse<CarLinkData>

      if (item.value && String(item.value.id) === String(id)) {
        item.value = response.data
      }
      return response.data || undefined
    })
  }

  async function cancelCarLink(id: number | string, payload: CarLinkCancelRequest): Promise<CarLinkData | undefined> {
    return run(async () => {
      const response = await _cancel(
        id,
        payload,
        { camelize: true, snakeParams: true },
      ) as ApiResponse<CarLinkData>

      if (item.value && String(item.value.id) === String(id)) {
        item.value = response.data
      }
      return response.data || undefined
    })
  }

  async function updateCarLinkInternalNote(id: number | string, payload: CarLinkInternalNoteRequest): Promise<CarLinkData | undefined> {
    return run(async () => {
      const response = await _updateInternalNote(
        id,
        payload,
        { camelize: true, snakeParams: true },
      ) as ApiResponse<CarLinkData>

      if (item.value && String(item.value.id) === String(id)) {
        item.value = response.data
      }

      const listItem = items.value.find(link => String(link.id) === String(id))
      if (listItem) {
        listItem.internalNote = response.data?.internalNote ?? null
      }

      return response.data || undefined
    })
  }

  return {
    items,
    item,
    meta,
    errors,
    isLoading: readonly(isLoading),
    page: __currentPage,
    limit: __limit,
    total,
    lastPage,
    next,
    prev,
    first,
    last,
    fetchCarLinks,
    fetchCarLink,
    createCarLink,
    assignCarLink,
    replyCarLink,
    setCarLinkInterest,
    attachCarLinkListing,
    reopenCarLink,
    cancelCarLink,
    updateCarLinkInternalNote,
  }
}
