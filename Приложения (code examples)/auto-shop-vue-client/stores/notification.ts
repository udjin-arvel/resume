import { defineStore } from "pinia"
import { ref, computed } from "vue"
import { useApiActivityEvents } from "~/composables/api/useApiActivityEvents"
import { useUnreadCountStore } from "@/stores/unreadCount"
import { useUserStore } from "@/stores/user"
import type { ActivityEvent } from "~/types/responses/activityEvent"

const UNREAD_EVENTS_LIMIT = 20

export const useNotificationStore = defineStore("activity-events", () => {
  const { getNotifications, read, readAll } = useApiActivityEvents()

  const unreadCountStore = useUnreadCountStore()
  const userStore = useUserStore()

  const recentEvents = ref<ActivityEvent[]>([])
  const loading = ref(false)
  const loadingMore = ref(false)
  const markingAll = ref(false)
  const totalNotifications = ref(0)
  const hasNewNotifications = ref(false)

  const unreadCount = computed(() => unreadCountStore.counts.notifications)
  const loadedNotificationsCount = computed(() => recentEvents.value.length)
  const newNotificationsCount = computed(() => Math.max(0, unreadCount.value - totalNotifications.value))
  const hasMoreNotifications = computed(() =>
    !hasNewNotifications.value && recentEvents.value.length < totalNotifications.value,
  )

  async function fetchNotifications(): Promise<boolean> {
    if (!userStore.canViewNotifications) {
      return false
    }

    loading.value = true
    try {
      const response = await getNotifications({
        limit: UNREAD_EVENTS_LIMIT,
        offset: 0,
        filter: { visibility: "unread" },
      })
      if (response?.data) {
        recentEvents.value = response.data
        totalNotifications.value = response.meta?.total ?? response.data.length
        unreadCountStore.setNotifications(totalNotifications.value)
        hasNewNotifications.value = false
        return true
      }
      return false
    }
    catch (e) {
      console.error(e)
      return false
    }
    finally {
      loading.value = false
    }
  }

  async function loadMoreNotifications() {
    if (!userStore.canViewNotifications || loading.value || loadingMore.value || !hasMoreNotifications.value) {
      return
    }

    loadingMore.value = true
    try {
      const response = await getNotifications({
        limit: UNREAD_EVENTS_LIMIT,
        offset: recentEvents.value.length,
        filter: { visibility: "unread" },
      })

      if (response?.data) {
        const loadedIds = new Set(recentEvents.value.map(item => item.id))
        const newEvents = response.data.filter(item => !loadedIds.has(item.id))

        recentEvents.value = [...recentEvents.value, ...newEvents]
        totalNotifications.value = response.meta?.total ?? recentEvents.value.length
        unreadCountStore.setNotifications(totalNotifications.value)
      }
    }
    catch (e) {
      console.error(e)
    }
    finally {
      loadingMore.value = false
    }
  }

  async function readNotification(item: ActivityEvent) {
    await read(item.id)
    void fetchNotifications()
  }

  async function readAllNotifications() {
    if (markingAll.value) {
      return
    }

    markingAll.value = true
    try {
      await readAll()
      await fetchNotifications()
    }
    finally {
      markingAll.value = false
    }
  }

  function handleSocketNotification() {
    hasNewNotifications.value = unreadCount.value > totalNotifications.value
  }

  function clear() {
    recentEvents.value = []
    totalNotifications.value = 0
    hasNewNotifications.value = false
  }

  return {
    recentEvents,
    unreadCount,
    loadedNotificationsCount,
    totalNotifications,
    hasNewNotifications,
    newNotificationsCount,
    loading,
    loadingMore,
    markingAll,
    hasMoreNotifications,
    fetchNotifications,
    loadMoreNotifications,
    readNotification,
    readAllNotifications,
    handleSocketNotification,
    clear,
  }
})
