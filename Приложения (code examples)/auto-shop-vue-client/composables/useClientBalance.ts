import { ref, readonly } from "vue"
import { useApiClientBalance, useLoadingIndicator } from "#imports"
import { useApiUpload, type DraftFileData } from "@/composables/api/useApiUpload"
import usePagination from "@/composables/usePagination"
import type { ClientBalance } from "@/types/common/client"
import type { ClientBalanceHistoryRequest, ClientBalanceAdjustRequest } from "@/types/requests/client"
import type { ClientBalanceApiListStrictResponse } from "~/types/responses/client"
import type { ApiResponse } from "@/types/responses/response"
import type Response from "@/types/responses/response"
import type { SimpleFile } from "@/types/common/file"
import Errors from "@/classes/errors"

interface FetchOpts {
  filters?: ClientBalanceHistoryRequest
}

export function useClientBalance(clientId: number | string) {
  const { isLoading, start, finish } = useLoadingIndicator()
  const data = ref<ClientBalance[]>([])
  const clientName = ref<string>("")
  const clientBalance = ref<number>(0)
  const clientDeposit = ref<number>(0)
  const managers = ref<{ id: number, name: string }[]>([])
  const payers = ref<string[]>([])
  const errors = ref(new Errors())
  const uploadedFile = ref<SimpleFile | null>(null)
  const isUploading = ref(false)

  const { index, store: _store } = useApiClientBalance()
  const { uploadDraftFile } = useApiUpload()

  const { __currentPage, __limit, offset, total, lastPage, next, prev, first, last } = usePagination({
    currentPage: 1,
    limit: 20,
    total: 0,
  })

  async function fetchHistory(opts?: FetchOpts) {
    start()
    try {
      const res = await index(
        clientId,
        { offset: offset.value, limit: __limit.value, ...(opts?.filters || {}) },
        { camelize: true, snakeParams: true },
      ) as ClientBalanceApiListStrictResponse<ClientBalance>

      data.value = res.data
      total.value = res.meta.total
      __limit.value = res.meta.limit
      __currentPage.value = res.meta.currentPage
      clientName.value = res.meta.clientName
      clientBalance.value = res.meta.clientBalance || 0
      clientDeposit.value = res.meta.clientDeposit || 0
      managers.value = res.meta.managers || []
      payers.value = res.meta.payers || []

      return res
    }
    finally {
      finish()
    }
  }

  function draftToSimpleFile(draft: DraftFileData): SimpleFile {
    return {
      id: draft.id,
      name: draft.name,
      uuid: String(draft.id),
      url: draft.url ?? "",
      mimeType: draft.mimeType ?? "",
      size: 0,
      thumb: null,
    }
  }

  async function uploadFile(file: File): Promise<SimpleFile | undefined> {
    isUploading.value = true
    errors.value.clear()
    try {
      const response = await uploadDraftFile(file, "client_balance")

      if (response.data) {
        const simpleFile = draftToSimpleFile(response.data)
        uploadedFile.value = simpleFile
        return simpleFile
      }
    }
    catch (error: any) {
      const _error: Response<any> = error.data as Response<any> || {}
      if (_error.errors) {
        errors.value.record(_error.errors)
      }
    }
    finally {
      isUploading.value = false
    }
  }

  function clearUploadedFile() {
    uploadedFile.value = null
  }

  async function adjustBalance(payload: ClientBalanceAdjustRequest): Promise<number | undefined> {
    start()
    errors.value.clear()
    try {
      const response = await _store(
        clientId,
        payload,
        { camelize: true, snakeParams: true },
      ) as ApiResponse<ClientBalance>

      if (response.data?.id) {
        clearUploadedFile()
      }

      return response.data?.id
    }
    catch (error: any) {
      const _error: Response<any> = error.data as Response<any> || {}
      if (_error.errors) {
        errors.value.record(_error.errors)
      }
    }
    finally {
      finish()
    }
  }

  return {
    data,
    clientName: readonly(clientName),
    clientBalance: readonly(clientBalance),
    clientDeposit: readonly(clientDeposit),
    managers: readonly(managers),
    payers: readonly(payers),
    isLoading: readonly(isLoading),
    isUploading: readonly(isUploading),
    uploadedFile: readonly(uploadedFile),
    errors,
    page: __currentPage,
    limit: __limit,
    total,
    lastPage,
    next,
    prev,
    first,
    last,
    fetchHistory,
    uploadFile,
    clearUploadedFile,
    adjustBalance,
  }
}
