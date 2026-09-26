import { ref, readonly, onMounted, onUnmounted } from "vue"
import { useNuxtApp } from "nuxt/app"
import { useApiListing } from "@/composables/api/useApiListing"
import { useUserStore } from "@/stores/user"
import type { FileResponse } from "@/types/form/file"
import Errors from "@/classes/errors"

interface DiagnosticImportOptions {
  onSuccess?: (files: FileResponse[]) => void
  onError?: (message: string) => void
}

interface DiagnosticPhotosImportedEvent {
  job_id: string
  success: boolean
  count?: number
  error?: string
}

interface DiagnosticImportProgressEvent {
  job_id: string
  percent: number
  message: string
}

const IMPORT_TIMEOUT_MS = 180000

export function useDiagnosticImport(options: DiagnosticImportOptions = {}) {
  const { parseDiagnosticFromUrl, getDiagnosticPhotos } = useApiListing()
  const { $echo } = useNuxtApp()
  const userStore = useUserStore()
  const { t } = useI18n()
  const { isLoading, start, finish } = useLoadingIndicator()

  const progress = ref(0)
  const message = ref("")
  const errors = ref(new Errors())

  let currentChannel: any = null
  let activeJobId: string | null = null
  let timeoutId: NodeJS.Timeout | null = null

  const armTimeout = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      activeJobId = null
      finish()
      const errorMsg = t("listing.import_timeout")
      errors.value.record({ timeout: errorMsg })
      options.onError?.(errorMsg)
    }, IMPORT_TIMEOUT_MS)
  }

  const handleProgress = (event: DiagnosticImportProgressEvent) => {
    if (activeJobId && event.job_id !== activeJobId) {
      return
    }

    progress.value = event.percent
    message.value = event.message
    armTimeout()
  }

  const handleImported = async (event: DiagnosticPhotosImportedEvent) => {
    if (activeJobId && event.job_id !== activeJobId) {
      return
    }

    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }

    const jobId = event.job_id
    activeJobId = null

    if (event.success && (event.count ?? 0) > 0) {
      try {
        const { files: rawFiles } = await getDiagnosticPhotos(jobId)

        const files: FileResponse[] = (rawFiles ?? []).map(f => ({
          id: f.id,
          uuid: String(f.id),
          name: f.name,
          size: f.size,
          url: f.url,
          show_url: f.url,
          mime_type: f.mime_type,
          collection: "files",
          descriptions: f.descriptions,
        }))

        if (files.length > 0) {
          progress.value = 100
          options.onSuccess?.(files)
        }
        else {
          const errorMsg = t("listing.diagnostic_import_error")
          errors.value.record({ diagnostic: errorMsg })
          options.onError?.(errorMsg)
        }
      }
      catch (err: any) {
        const errorMsg = err?.data?.message ?? t("listing.diagnostic_import_error")
        errors.value.record({ diagnostic: errorMsg })
        options.onError?.(errorMsg)
      }
    }
    else {
      const errorMsg = event.error || t("listing.diagnostic_import_error")
      errors.value.record({ diagnostic: errorMsg })
      options.onError?.(errorMsg)
    }

    finish()
  }

  const setupChannel = () => {
    const userId = userStore.currentUserId || userStore.user?.id

    if (!userId || currentChannel) {
      return
    }

    currentChannel = $echo.private(`user.${userId}`)
    currentChannel.listen(".diagnostic.import.progress", handleProgress)
    currentChannel.listen(".diagnostic.photos.imported", handleImported)
  }

  const fullCleanup = () => {
    if (currentChannel) {
      currentChannel.stopListening(".diagnostic.import.progress")
      currentChannel.stopListening(".diagnostic.photos.imported")
      currentChannel = null
    }

    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }

    activeJobId = null
  }

  const startImport = async (url: string): Promise<void> => {
    errors.value.clear()
    progress.value = 0
    message.value = t("listing.diagnostic_importing")
    start()

    try {
      setupChannel()

      const response = await parseDiagnosticFromUrl({ url })
      activeJobId = response.job_id

      armTimeout()
    }
    catch (err: any) {
      finish()
      const errorMessage = err?.data?.message
        ?? err?.data?.errors?.url?.[0]
        ?? err?.message
        ?? t("common.error")
      errors.value.record({ general: errorMessage })
      options.onError?.(errorMessage)
    }
  }

  onMounted(() => {
    setupChannel()
  })

  onUnmounted(() => {
    fullCleanup()
    finish()
  })

  return {
    isDiagnosticImporting: readonly(isLoading),
    diagnosticProgress: readonly(progress),
    diagnosticMessage: readonly(message),
    errors,
    startImport,
  }
}
