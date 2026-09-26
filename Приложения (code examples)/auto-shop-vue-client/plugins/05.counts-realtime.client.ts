import type { Pinia } from "pinia"
import { useUserStore } from "@/stores/user"
import { useUnreadCountStore } from "@/stores/unreadCount"
import { useNotificationStore } from "@/stores/notification"
import { toCamelCase } from "@/utils/caseTransform"
import { watchEchoUserChannel } from "@/utils/echoUserChannel"

export default defineNuxtPlugin((nuxtApp) => {
  const { $echo } = nuxtApp as unknown as { $echo: any }
  const pinia = nuxtApp.$pinia as Pinia

  const userStore = useUserStore(pinia)
  const unreadStore = useUnreadCountStore(pinia)
  const notificationStore = useNotificationStore(pinia)

  const handleCarLinksUpdate = (payload: any) => {
    if (!payload || payload.type !== "car_links.unread_updated") {
      return
    }

    const normalized = toCamelCase(payload)
    const count = normalized.carLinks ?? normalized.car_links ?? 0

    unreadStore.setCarLinks(Number(count) || 0)
  }

  let subscribedToSellers = false

  const subscribe = (userId: number) => {
    const channel = $echo.private(`user.${userId}`)

    channel.listen("NotificationsUnreadUpdated", (payload: { type: string, count: number }) => {
      if (!payload || payload.type !== "notifications.unread_updated") {
        return
      }

      unreadStore.setNotifications(payload.count)
      notificationStore.handleSocketNotification()
    })

    channel.listen("BuyerLogisticUnreadUpdated", (payload: any) => {
      if (!payload || payload.type !== "logistic.unread_updated") {
        return
      }

      const normalized = toCamelCase(payload)

      const data = normalized.unreadLogisticOrders
        ?? normalized.unread_logistic_orders
        ?? {}

      unreadStore.setLogisticOrders(data)
    })

    channel.listen("ListingRequestsUnreadUpdated", (payload: any) => {
      if (!payload || payload.type !== "listing_requests.unread_updated") {
        return
      }

      const normalized = toCamelCase(payload)
      const count
          = normalized.listingRequests
            ?? normalized.listing_requests
            ?? 0

      unreadStore.setListingRequests(Number(count) || 0)
      unreadStore.bumpListingRequestsWsEvent()
    })

    channel.listen("SearchRequestsCountUpdated", (payload: any) => {
      if (!payload || payload.type !== "search_requests.count_updated") {
        return
      }

      const normalized = toCamelCase(payload)
      const count
          = normalized.searchRequests
            ?? normalized.search_requests
            ?? 0

      unreadStore.setSearchRequests(Number(count) || 0)
    })

    channel.listen("CarLinksUnreadUpdated", handleCarLinksUpdate)

    if (userStore.isAnySeller) {
      const sellersChannel = $echo.private("role.sellers")
      sellersChannel.listen("CarLinksUnreadUpdated", handleCarLinksUpdate)
      subscribedToSellers = true
    }
  }

  const unsubscribe = () => {
    if (subscribedToSellers) {
      $echo.leave("role.sellers")
      subscribedToSellers = false
    }
  }

  watchEchoUserChannel({
    echo: $echo,
    getUserId: () => userStore.currentUserId,
    subscribe,
    unsubscribe,
  })
})
