import type { ApiResponse } from "@/types/responses/response"
import { useApiParamTransform } from "@/composables/api/useApiParamTransform"
import { toCamelCase } from "@/utils/caseTransform"

export type DraftFileData = {
  id: number
  name: string
  mimeType: string | null
  url: string | null
}

type PresignData = {
  media_id: number
  uuid: string
  url: string
  headers: Record<string, string | string[]> | null
  expires_at: string
}

type BatchPresignData = PresignData & {
  client_id: string
}

type BatchCompleteData = {
  media_id: number
  status: "completed" | "failed"
  file?: DraftFileData
  message?: string
}

type LocalBatchUploadData = {
  index: number
  status: "completed" | "failed"
  file?: DraftFileData
  message?: string
}

export type UploadBatchProgress = {
  phase: "preparing" | "uploading" | "completing"
  loaded: number
  total: number
  completedFiles: number
  totalFiles: number
}

export type UploadBatchResult = {
  uploaded: Array<{ file: File, draft: DraftFileData }>
  failed: Array<{ file: File, message: string }>
}

// Request headers the browser refuses to let scripts set; they are derived
// automatically from the request, so we must not forward them to OSS.
const FORBIDDEN_PUT_HEADERS = new Set([
  "host",
  "content-length",
  "connection",
  "origin",
  "referer",
])

const MAX_CONCURRENT_OSS_UPLOADS = 5
const OSS_UPLOAD_STALL_TIMEOUT_MS = 120_000
let activeOssUploads = 0
const ossUploadQueue: Array<() => void> = []

const acquireOssUploadSlot = () => new Promise<void>((resolve) => {
  const acquire = () => {
    activeOssUploads++
    resolve()
  }

  if (activeOssUploads < MAX_CONCURRENT_OSS_UPLOADS) {
    acquire()
  }
  else {
    ossUploadQueue.push(acquire)
  }
})

const releaseOssUploadSlot = () => {
  activeOssUploads--
  ossUploadQueue.shift()?.()
}

const withOssUploadSlot = async <T>(task: () => Promise<T>): Promise<T> => {
  await acquireOssUploadSlot()
  try {
    return await task()
  }
  finally {
    releaseOssUploadSlot()
  }
}

export const useApiUpload = () => {
  const { call } = useApiParamTransform()
  const config = useRuntimeConfig()
  const tokenStore = useTokenStore()
  const baseUrl = "api/v1"
  // Черновики грузятся напрямую в OSS (presign -> PUT -> complete). Там, где
  // бэкенд хранит медиа локально (тестовые стенды), presigned-ссылку выдать
  // некому, поэтому окружение переключает загрузку на multipart-эндпоинт.
  const directOssUpload = config.public.directOssUpload !== false

  const uploadDraftFilesMultipart = (
    formData: FormData,
    totalBytes: number,
    onUploadProgress: (loaded: number) => void,
    onUploadComplete: () => void,
  ): Promise<ApiResponse<LocalBatchUploadData[]>> => new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const url = new URL(`${baseUrl}/media/draft/batch`, config.public.apiBase).toString()

    xhr.open("POST", url)
    xhr.withCredentials = true
    xhr.responseType = "json"
    xhr.setRequestHeader("Accept", "application/json")

    if (tokenStore.token) {
      xhr.setRequestHeader("Authorization", `Bearer ${tokenStore.token}`)
    }

    xhr.upload.onprogress = (event) => {
      const loaded = event.lengthComputable && event.total > 0
        ? event.loaded / event.total * totalBytes
        : event.loaded
      onUploadProgress(Math.min(totalBytes, loaded))
    }

    xhr.upload.onload = () => {
      onUploadProgress(totalBytes)
      onUploadComplete()
    }

    xhr.onload = () => {
      const response = toCamelCase(xhr.response) as ApiResponse<LocalBatchUploadData[]> | null

      if (xhr.status >= 200 && xhr.status < 300 && response?.data) {
        resolve(response)
      }
      else {
        reject(new Error(response?.message || `Batch upload failed with status ${xhr.status}`))
      }
    }

    xhr.onerror = () => reject(new Error("Batch upload failed"))
    xhr.onabort = () => reject(new Error("Batch upload aborted"))
    xhr.send(formData)
  })

  const uploadDraftFileMultipart = (file: File, context = "default") => {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("context", context)

    return call<ApiResponse<DraftFileData>>(
      `${baseUrl}/media/draft`,
      { method: "POST", body: formData },
      { camelize: true },
    )
  }

  const presignDraft = (file: File, context = "default") =>
    call<ApiResponse<PresignData>>(
      `${baseUrl}/media/draft/presign`,
      {
        method: "POST",
        body: {
          name: file.name,
          size: file.size,
          context,
        },
      },
      { camelize: false },
    )

  const completeDraft = (mediaId: number, context = "default") =>
    call<ApiResponse<DraftFileData>>(
      `${baseUrl}/media/draft/${mediaId}/complete`,
      { method: "POST", body: { context } },
      { camelize: true },
    )

  // fetch headers must be Latin1; map UTF-8 bytes to code units so a non-ASCII
  // Content-Disposition stays valid and matches the bytes OSS signed.
  const toByteStringHeaderValue = (value: string | string[]): string => {
    const joined = Array.isArray(value) ? value.join(", ") : value
    const bytes = new TextEncoder().encode(joined)
    let result = ""
    for (const byte of bytes) {
      result += String.fromCharCode(byte)
    }
    return result
  }

  const putToOss = async (presign: PresignData, file: File) => {
    const headers: Record<string, string> = {}
    for (const [key, value] of Object.entries(presign.headers ?? {})) {
      if (!FORBIDDEN_PUT_HEADERS.has(key.toLowerCase())) {
        headers[key] = toByteStringHeaderValue(value)
      }
    }

    const response = await fetch(presign.url, {
      method: "PUT",
      headers,
      body: file,
      credentials: "omit",
      mode: "cors",
    })

    if (!response.ok) {
      throw new Error(`OSS upload failed with status ${response.status}`)
    }
  }

  const putToOssWithProgress = (
    presign: PresignData,
    file: File,
    onProgress: (loaded: number) => void,
  ): Promise<void> => new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    let stalled = false
    let stallTimer: ReturnType<typeof setTimeout> | null = null
    const clearStallTimer = () => {
      if (stallTimer) {
        clearTimeout(stallTimer)
        stallTimer = null
      }
    }
    const resetStallTimer = () => {
      clearStallTimer()
      stallTimer = setTimeout(() => {
        stalled = true
        xhr.abort()
      }, OSS_UPLOAD_STALL_TIMEOUT_MS)
    }

    xhr.open("PUT", presign.url)
    xhr.withCredentials = false

    for (const [key, value] of Object.entries(presign.headers ?? {})) {
      if (!FORBIDDEN_PUT_HEADERS.has(key.toLowerCase())) {
        xhr.setRequestHeader(key, toByteStringHeaderValue(value))
      }
    }

    xhr.upload.onprogress = (event) => {
      resetStallTimer()
      onProgress(event.loaded)
    }
    xhr.onload = () => {
      clearStallTimer()
      onProgress(file.size)
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
      }
      else {
        reject(new Error(`OSS upload failed with status ${xhr.status}`))
      }
    }
    xhr.onerror = () => {
      clearStallTimer()
      reject(new Error("OSS upload failed"))
    }
    xhr.onabort = () => {
      clearStallTimer()
      reject(new Error(stalled ? "OSS upload stalled" : "OSS upload aborted"))
    }
    resetStallTimer()
    xhr.send(file)
  })

  const runWithConcurrency = async <T>(tasks: Array<() => Promise<T>>, limit: number): Promise<PromiseSettledResult<T>[]> => {
    const results: PromiseSettledResult<T>[] = new Array(tasks.length)
    let nextIndex = 0

    const worker = async () => {
      while (nextIndex < tasks.length) {
        const index = nextIndex++
        try {
          results[index] = { status: "fulfilled", value: await tasks[index]() }
        }
        catch (reason) {
          results[index] = { status: "rejected", reason }
        }
      }
    }

    await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker))
    return results
  }

  const uploadDraftFiles = async (
    inputFiles: FileList | File[],
    context = "default",
    onProgress?: (progress: UploadBatchProgress) => void,
  ): Promise<UploadBatchResult> => {
    const files = Array.from(inputFiles)
    const total = files.reduce((sum, file) => sum + file.size, 0)
    const emitProgress = (phase: UploadBatchProgress["phase"], loaded: number, completedFiles: number) =>
      onProgress?.({ phase, loaded, total, completedFiles, totalFiles: files.length })

    emitProgress("preparing", 0, 0)

    if (!directOssUpload) {
      const formData = new FormData()
      formData.append("context", context)
      files.forEach(file => formData.append("files[]", file))

      emitProgress("uploading", 0, 0)
      const response = await uploadDraftFilesMultipart(
        formData,
        total,
        loaded => emitProgress("uploading", loaded, 0),
        () => emitProgress("completing", total, 0),
      )
      emitProgress("completing", total, files.length)
      const result: UploadBatchResult = { uploaded: [], failed: [] }
      const returnedIndexes = new Set<number>()

      for (const item of response.data) {
        const file = files[item.index]

        if (!file || returnedIndexes.has(item.index)) {
          continue
        }

        returnedIndexes.add(item.index)

        if (item.status === "completed" && item.file) {
          result.uploaded.push({ file, draft: item.file })
        }
        else {
          result.failed.push({ file, message: item.message || "Upload failed" })
        }
      }

      files.forEach((file, index) => {
        if (!returnedIndexes.has(index)) {
          result.failed.push({ file, message: "Upload result missing" })
        }
      })

      return result
    }

    const clientFiles: Array<{ clientId: string, file: File }> = files.map((file, index) => ({
      clientId: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${index}`,
      file,
    }))

    const presigned = await call<ApiResponse<BatchPresignData[]>>(
      `${baseUrl}/media/draft/presign-batch`,
      {
        method: "POST",
        body: {
          context,
          files: clientFiles.map(({ clientId, file }) => ({ client_id: clientId, name: file.name, size: file.size })),
        },
      },
      { camelize: false },
    )

    const byClientId = new Map(clientFiles.map(item => [item.clientId, item.file]))
    const presignByClientId = new Map<string, BatchPresignData>()
    const presignedMediaIds = new Set<number>()
    for (const item of presigned.data) {
      if (
        byClientId.has(item.client_id)
        && !presignByClientId.has(item.client_id)
        && !presignedMediaIds.has(item.media_id)
      ) {
        presignByClientId.set(item.client_id, item)
        presignedMediaIds.add(item.media_id)
      }
    }

    const failed: UploadBatchResult["failed"] = clientFiles.flatMap(({ clientId, file }) =>
      presignByClientId.has(clientId) ? [] : [{ file, message: "Upload preparation result missing" }],
    )
    const loadedByClientId = new Map<string, number>()
    let completedFiles = 0
    emitProgress("uploading", 0, 0)

    const entries = clientFiles.flatMap(({ clientId, file }) => {
      const presign = presignByClientId.get(clientId)
      return presign ? [{ presign, file }] : []
    })
    const putResults = await runWithConcurrency(entries.map(({ presign, file }) => () => withOssUploadSlot(async () => {
      await putToOssWithProgress(presign, file, (loaded) => {
        loadedByClientId.set(presign.client_id, loaded)
        emitProgress("uploading", Array.from(loadedByClientId.values()).reduce((sum, value) => sum + value, 0), completedFiles)
      })
      completedFiles++
      emitProgress("uploading", Array.from(loadedByClientId.values()).reduce((sum, value) => sum + value, 0), completedFiles)
      return presign
    })), MAX_CONCURRENT_OSS_UPLOADS)

    const successfulPresigns = putResults.flatMap((result, index) => result.status === "fulfilled" ? [entries[index].presign] : [])
    failed.push(...putResults.flatMap((result, index) => result.status === "rejected"
      ? [{ file: entries[index].file, message: result.reason instanceof Error ? result.reason.message : String(result.reason) }]
      : []))

    if (!successfulPresigns.length) {
      return { uploaded: [], failed }
    }

    emitProgress("completing", Array.from(loadedByClientId.values()).reduce((sum, value) => sum + value, 0), completedFiles)

    const completed = await call<ApiResponse<BatchCompleteData[]>>(
      `${baseUrl}/media/draft/complete-batch`,
      { method: "POST", body: { media_ids: successfulPresigns.map(item => item.media_id) } },
      { camelize: false },
    )

    const presignByMediaId = new Map(successfulPresigns.map(item => [item.media_id, item]))
    const completedMediaIds = new Set<number>()
    const uploaded: UploadBatchResult["uploaded"] = []

    for (const item of completed.data) {
      const presign = presignByMediaId.get(item.media_id)
      const file = presign ? byClientId.get(presign.client_id) : undefined

      if (!file || completedMediaIds.has(item.media_id)) {
        continue
      }

      completedMediaIds.add(item.media_id)
      if (item.status === "completed" && item.file) {
        uploaded.push({ file, draft: item.file })
      }
      else {
        failed.push({ file, message: item.message || "Upload confirmation failed" })
      }
    }

    for (const presign of successfulPresigns) {
      if (completedMediaIds.has(presign.media_id)) {
        continue
      }

      const file = byClientId.get(presign.client_id)
      if (file) {
        failed.push({ file, message: "Upload confirmation result missing" })
      }
    }

    return { uploaded, failed }
  }

  const uploadDraftFileDirect = async (file: File, context = "default"): Promise<ApiResponse<DraftFileData>> => {
    const presigned = await presignDraft(file, context)
    const presign = presigned?.data
    if (!presign?.url || !presign?.media_id) {
      throw new Error("Invalid presign response")
    }

    await putToOss(presign, file)

    return completeDraft(presign.media_id, context)
  }

  const uploadDraftFile = (file: File, context = "default"): Promise<ApiResponse<DraftFileData>> =>
    directOssUpload
      ? uploadDraftFileDirect(file, context)
      : uploadDraftFileMultipart(file, context)

  return { uploadDraftFile, uploadDraftFiles }
}
