import type Response from "@/types/responses/response"
import type { FiltersOptionsResponse } from "~/types/responses/activityEvent"

export function useApiActivityEvents() {
  const $api = useNuxtApp().$api as typeof $fetch

  const baseUrl = "/api/v1/activity-events"

  const index = (query: Record<string, any> = {}): Promise<Response<any[]>> => {
    return $api(`${baseUrl}`, {
      method: "GET",
      query,
    })
  }

  const team = (query: Record<string, any> = {}): Promise<Response<any[]>> => {
    return $api(`${baseUrl}/team`, {
      method: "GET",
      query,
    })
  }

  const getNotifications = (query: Record<string, any> = {}): Promise<Response<any[]>> => {
    return $api(`${baseUrl}/notifications`, {
      method: "GET",
      query,
    })
  }

  const read = (activityEventId: number): Promise<Response<any>> => {
    return $api(`${baseUrl}/${activityEventId}/read`, {
      method: "POST",
    })
  }

  const readAll = (): Promise<Response<any>> => {
    return $api(`${baseUrl}/read-all`, {
      method: "POST",
    })
  }

  const getFiltersOptions = (query: Record<string, any> = {}): Promise<Response<FiltersOptionsResponse>> => {
    return $api(`${baseUrl}/filters-options`, {
      method: "GET",
      query,
    })
  }

  return {
    index,
    team,
    read,
    readAll,
    getNotifications,
    getFiltersOptions,
  }
}
