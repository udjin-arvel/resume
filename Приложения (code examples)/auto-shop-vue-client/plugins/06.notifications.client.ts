import { useUserStore } from "@/stores/user"
import { useNotificationStore } from "@/stores/notification"
import { watchEchoUserChannel } from "@/utils/echoUserChannel"

export default defineNuxtPlugin((nuxtApp) => {
  const { $echo } = nuxtApp as unknown as { $echo: any }
  const userStore = useUserStore()
  const notificationStore = useNotificationStore()

  const subscribe = (userId: number) => {
    const channel = $echo.private(`user.${userId}`)

    channel.notification((_notification: any) => {
      notificationStore.handleSocketNotification()
    })
  }

  const unsubscribe = () => {
    notificationStore.clear()
  }

  watchEchoUserChannel({
    echo: $echo,
    getUserId: () => userStore.currentUserId,
    subscribe,
    unsubscribe,
  })
})
