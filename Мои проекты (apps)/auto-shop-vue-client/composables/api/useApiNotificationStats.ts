import { useApiParamTransform } from "@/composables/api/useApiParamTransform"
import type { ApiResponse } from "@/types/responses/response"
import type {
  AuthorEvent,
  AuthorEventsMeta,
  AuthorEventsParams,
  NotificationStats,
} from "@/types/responses/notificationStats"

export function useApiNotificationStats() {
  const { call } = useApiParamTransform()

  const getNotificationStats = (hours: number) =>
    call<ApiResponse<NotificationStats>>(
      "api/v1/admin/notification-stats",
      { method: "GET", params: { hours } },
    )

  const getAuthorEvents = (userId: number, params: AuthorEventsParams) =>
    call<ApiResponse<AuthorEvent[], AuthorEventsMeta>>(
      `api/v1/admin/notification-stats/authors/${userId}/events`,
      { method: "GET", params },
    )

  return {
    getNotificationStats,
    getAuthorEvents,
  }
}
