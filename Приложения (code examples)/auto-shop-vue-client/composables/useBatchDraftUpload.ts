import {
  useApiUpload,
  type UploadBatchResult,
} from "@/composables/api/useApiUpload"
import { useMediaUploadState } from "@/composables/useMediaUploadState"

const BATCH_SIZE = 25

function splitIntoChunks(files: File[], maxBytes?: number): File[][] {
  const chunks: File[][] = []
  let currentChunk: File[] = []
  let currentChunkSize = 0

  for (const file of files) {
    const exceedsCount = currentChunk.length >= BATCH_SIZE
    const exceedsSize = maxBytes !== undefined
      && currentChunk.length > 0
      && currentChunkSize + file.size > maxBytes

    if (exceedsCount || exceedsSize) {
      chunks.push(currentChunk)
      currentChunk = []
      currentChunkSize = 0
    }

    currentChunk.push(file)
    currentChunkSize += file.size
  }

  if (currentChunk.length) {
    chunks.push(currentChunk)
  }

  return chunks
}

export function useBatchDraftUpload() {
  const config = useRuntimeConfig()
  const { uploadDraftFiles } = useApiUpload()
  const { isAnyUploading, startUpload, updateUpload, finishUpload } = useMediaUploadState()

  const uploadBatch = async (
    inputFiles: FileList | File[],
    context: string,
  ): Promise<UploadBatchResult> => {
    const files = Array.from(inputFiles)

    if (!files.length) {
      return { uploaded: [], failed: [] }
    }

    const total = files.reduce((sum, file) => sum + file.size, 0)
    const uploadId = startUpload(context, files)
    const result: UploadBatchResult = { uploaded: [], failed: [] }
    let loadedBeforeChunk = 0
    let completedBeforeChunk = 0
    const maxChunkBytes = config.public.directOssUpload === false
      ? config.public.maxMultipartUploadBatchSizeBytes
      : undefined
    const chunks = splitIntoChunks(files, maxChunkBytes)

    try {
      for (const chunk of chunks) {
        let chunkLoaded = 0

        try {
          const chunkResult = await uploadDraftFiles(chunk, context, (progress) => {
            chunkLoaded = Math.max(chunkLoaded, progress.loaded)
            updateUpload(uploadId, {
              ...progress,
              loaded: loadedBeforeChunk + chunkLoaded,
              total,
              completedFiles: completedBeforeChunk + progress.completedFiles,
              totalFiles: files.length,
            })
          })
          result.uploaded.push(...chunkResult.uploaded)
          result.failed.push(...chunkResult.failed)
        }
        catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          result.failed.push(...chunk.map(file => ({ file, message })))
        }

        loadedBeforeChunk += chunkLoaded
        completedBeforeChunk += chunk.length
        updateUpload(uploadId, { completedFiles: completedBeforeChunk })
      }

      return result
    }
    finally {
      finishUpload(uploadId, result.failed.map(({ file, message }) => ({ name: file.name, message })))
    }
  }

  return { uploadBatch, isBatchUploading: isAnyUploading }
}
