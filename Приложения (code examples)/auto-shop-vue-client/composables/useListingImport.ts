import { ref, readonly, onUnmounted, onMounted } from "vue"
import { useNuxtApp } from "nuxt/app"
import type { ImportedListingData, ImportProgressEvent } from "@/types/responses/listing"
import { useApiListing } from "@/composables/api/useApiListing"
import { useUserStore } from "@/stores/user"
import type Response from "@/types/responses/response"
import Errors from "@/classes/errors"

interface UseListingImportOptions {
  onSuccess?: (data: ImportedListingData & { is_image_update?: boolean }) => void
  onError?: (message: string) => void
  onProgress?: (percent: number, message: string) => void
}

export function useListingImport(options: UseListingImportOptions = {}) {
  const { importFromUrl, cancelImport: apiCancelImport } = useApiListing()
  const { $echo } = useNuxtApp()
  const userStore = useUserStore()
  const { t } = useI18n()
  const { isLoading, start, finish } = useLoadingIndicator()

  const progress = ref(0)
  const message = ref("")
  const errors = ref(new Errors())

  let currentChannel: any = null
  let timeoutId: NodeJS.Timeout | null = null

  const activeImport = {
    jobId: null as string | null,
    resolve: null as ((value: boolean) => void) | null,
    reject: null as ((reason?: any) => void) | null,
  }

  const handleProgress = (event: ImportProgressEvent) => {
    if (activeImport.jobId && event.jobId !== activeImport.jobId) {
      return
    }

    progress.value = event.percent
    message.value = event.message
    options.onProgress?.(event.percent, event.message)

    if (event.error) {
      const reject = activeImport.reject

      errors.value.record({ import: event.message })
      finish()
      cleanup()
      options.onError?.(event.message)
      reject?.(new Error(event.message))
      return
    }

    if (event.percent === 100 && event.data) {
      options.onSuccess?.(event.data)

      if (!event.data.media_loading) {
        const resolve = activeImport.resolve

        finish()
        cleanup()
        resolve?.(true)
        return
      }

      message.value = t("listing.import_loading_media")
    }
  }

  const handleImagesDownloaded = (event: any) => {
    const resolve = activeImport.resolve

    if (event.success) {
      options.onSuccess?.({
        photo_ids: event.photo_ids,
        video_ids: event.video_ids,
        is_image_update: true,
      })

      finish()
      cleanup()
      resolve?.(true)
    }
    else {
      const errorMsg = event.error || t("listing.import_media_error")
      errors.value.record({ media: errorMsg })
      options.onError?.(errorMsg)
      finish()
      cleanup()
      resolve?.(true)
    }
  }

  const setupChannel = () => {
    const userId = userStore.currentUserId || userStore.user?.id
    if (!userId) {
      console.warn("Cannot setup Echo channel: user not authenticated")
      return
    }

    if (currentChannel) {
      return
    }

    currentChannel = $echo.private(`user.${userId}`)
    currentChannel.listen(".listing.import.progress", handleProgress)
    currentChannel.listen(".listing.images.downloaded", handleImagesDownloaded)
  }

  const cleanup = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }

    activeImport.jobId = null
    activeImport.resolve = null
    activeImport.reject = null
  }

  const fullCleanup = () => {
    if (currentChannel) {
      currentChannel.stopListening(".listing.import.progress")
      currentChannel.stopListening(".listing.images.downloaded")
      currentChannel = null
    }

    cleanup()
  }

  const normalizeUrl = (url: string): string => {
    try {
      const urlObj = new URL(url)
      return `${urlObj.origin}${urlObj.pathname}`.replace(/\/$/, "")
    }
    catch {
      return url
    }
  }

  const validateUrl = (url: string): boolean => {
    const pattern = /^https:\/\/(www\.)?(che168\.com|dongchedi\.com)\//
    return pattern.test(url)
  }

  const startImport = async (url: string, withPhotos = false): Promise<boolean> => {
    cleanup()

    start()
    errors.value.clear()
    progress.value = 0
    message.value = ""

    try {
      const normalizedUrl = normalizeUrl(url.trim())

      if (!validateUrl(normalizedUrl)) {
        errors.value.record({
          url: t("listing.import_invalid_domain"),
        })
        options.onError?.(t("listing.import_invalid_domain"))
        finish()
        return false
      }

      const userId = userStore.currentUserId || userStore.user?.id
      if (!userId) {
        errors.value.record({
          auth: t("listing.import_unauthorized"),
        })
        options.onError?.(t("listing.import_unauthorized"))
        finish()
        return false
      }

      setupChannel()

      if (!currentChannel) {
        throw new Error("Failed to setup Echo channel")
      }

      const importPromise = new Promise<boolean>((resolve, reject) => {
        activeImport.resolve = resolve
        activeImport.reject = reject

        timeoutId = setTimeout(async () => {
          if (!isLoading.value) {
            return
          }

          if (activeImport.jobId) {
            try {
              await apiCancelImport(activeImport.jobId)
            }
            catch (err) {
              console.error("Cancel import error:", err)
            }
          }

          if (progress.value === 100) {
            finish()
            cleanup()
            resolve(true)
          }
          else {
            const timeoutError = t("listing.import_timeout")
            errors.value.record({ timeout: timeoutError })
            finish()
            cleanup()
            reject(new Error(timeoutError))
          }
        }, 300000)
      })

      const response = await importFromUrl({ url: normalizedUrl, with_photos: withPhotos })
      activeImport.jobId = response.job_id
      return await importPromise
    }
    catch (err: any) {
      const _error: Response<any> = err.data as Response<any> || {}

      if (_error.errors) {
        errors.value.record(_error.errors)
      }
      else {
        const errorMessage = _error.message || err.message || t("common.error")
        errors.value.record({ general: errorMessage })
      }

      finish()
      cleanup()

      const allErrors = errors.value.all()
      options.onError?.(allErrors || t("common.error"))
      return false
    }
  }

  const cancelImport = async () => {
    if (!activeImport.jobId) {
      cleanup()
      finish()
      return
    }

    try {
      await apiCancelImport(activeImport.jobId)
      errors.value.record({ cancel: t("listing.import_cancelled") })
      options.onError?.(t("listing.import_cancelled"))
    }
    catch (err) {
      console.error("Cancel import error:", err)
      errors.value.record({ cancel: t("common.error") })
    }
    finally {
      cleanup()
      finish()
      progress.value = 0
      message.value = ""
    }
  }

  onMounted(() => {
    setupChannel()
  })

  onUnmounted(async () => {
    if (isLoading.value && activeImport.jobId) {
      try {
        await apiCancelImport(activeImport.jobId)
      }
      catch (err) {
        console.error("Cancel on unmount error:", err)
      }
    }

    fullCleanup()
    finish()
  })

  return {
    isImporting: readonly(isLoading),
    progress: readonly(progress),
    message: readonly(message),
    errors,
    startImport,
    cancelImport,
  }
}
