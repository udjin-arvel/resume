import { ref } from "vue"
import type { UploadedDraft } from "@/types/form/file"
import { useBatchDraftUpload } from "@/composables/useBatchDraftUpload"

export function useDraftUpload() {
  const { uploadBatch } = useBatchDraftUpload()
  const uploadedDrafts = ref<UploadedDraft[]>([])
  const isUploading = ref(false)

  // maxFiles не задан — количество не ограничивается.
  const uploadFiles = async (files: FileList, collection: string, maxFiles?: number): Promise<"limit_exceeded" | "upload_failed" | null> => {
    if (maxFiles !== undefined && uploadedDrafts.value.length + files.length > maxFiles) {
      return "limit_exceeded"
    }
    isUploading.value = true
    try {
      const result = await uploadBatch(files, collection)
      result.uploaded.forEach(({ draft }) => {
        if (draft.id && draft.url) {
          uploadedDrafts.value.push({ id: draft.id, url: draft.url })
        }
      })
      return result.failed.length ? "upload_failed" : null
    }
    catch {
      return "upload_failed"
    }
    finally {
      isUploading.value = false
    }
  }

  const removeDraft = (id: number) => {
    uploadedDrafts.value = uploadedDrafts.value.filter(d => d.id !== id)
  }

  const reset = () => {
    uploadedDrafts.value = []
  }

  return { uploadedDrafts, isUploading, uploadFiles, removeDraft, reset }
}
