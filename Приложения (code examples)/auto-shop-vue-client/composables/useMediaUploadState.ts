import type { UploadBatchProgress } from "@/composables/api/useApiUpload"

export type MediaUploadSession = UploadBatchProgress & {
  id: string
  active: boolean
  context: string
  fileNames: string[]
  failed: Array<{ name: string, message: string }>
}

export function useMediaUploadState() {
  const uploads = useState<Record<string, MediaUploadSession>>("media-upload-sessions", () => ({}))

  const sessions = computed(() => Object.values(uploads.value))
  const activeUploads = computed(() => sessions.value.filter(upload => upload.active))
  const isAnyUploading = computed(() => activeUploads.value.length > 0)
  const aggregate = computed(() => sessions.value.reduce(
    (result, upload) => ({
      loaded: result.loaded + upload.loaded,
      total: result.total + upload.total,
      completedFiles: result.completedFiles + upload.completedFiles,
      totalFiles: result.totalFiles + upload.totalFiles,
      failed: [...result.failed, ...upload.failed],
    }),
    {
      loaded: 0,
      total: 0,
      completedFiles: 0,
      totalFiles: 0,
      failed: [] as Array<{ name: string, message: string }>,
    },
  ))

  const startUpload = (context: string, files: File[]) => {
    const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
    uploads.value[id] = {
      id,
      active: true,
      context,
      fileNames: files.map(file => file.name),
      failed: [],
      phase: "preparing",
      loaded: 0,
      total: files.reduce((sum, file) => sum + file.size, 0),
      completedFiles: 0,
      totalFiles: files.length,
    }
    return id
  }

  const updateUpload = (id: string, progress: Partial<MediaUploadSession>) => {
    const upload = uploads.value[id]
    if (upload) {
      uploads.value[id] = { ...upload, ...progress }
    }
  }

  const finishUpload = (id: string, failed: MediaUploadSession["failed"]) => {
    const upload = uploads.value[id]

    if (!upload) {
      return
    }

    updateUpload(id, {
      active: false,
      failed,
      loaded: upload.total,
      completedFiles: upload.totalFiles,
    })
  }

  const clearCompleted = (sessionIds?: string[]) => {
    const targetIds = sessionIds ? new Set(sessionIds) : null
    uploads.value = Object.fromEntries(
      Object.entries(uploads.value).filter(([id, upload]) =>
        upload.active || (targetIds !== null && !targetIds.has(id)),
      ),
    )
  }

  return {
    uploads,
    sessions,
    activeUploads,
    isAnyUploading,
    aggregate,
    startUpload,
    updateUpload,
    finishUpload,
    clearCompleted,
  }
}
