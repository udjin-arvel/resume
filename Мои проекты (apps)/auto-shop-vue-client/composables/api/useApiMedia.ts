import type Response from "@/types/responses/response"
import type { FileResponse } from "~/types/form/file"

export function useApiMedia() {
  const $api = useNuxtApp().$api as typeof $fetch
  const baseUrl: string = "/api/v1/media/documents"

  const deleteMedia = (mediaId: number): Promise<Response<any>> => {
    return $api<Response<any>>(`${baseUrl}/${mediaId}`, {
      method: "DELETE",
    })
  }

  const getMediaItem = (mediaId: number): Promise<Response<FileResponse>> => {
    return $api<Response<FileResponse>>(`${baseUrl}/${mediaId}`, {
      method: "GET",
    })
  }

  return {
    deleteMedia,
    getMediaItem,
  }
}
