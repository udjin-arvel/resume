import { onMounted, onUnmounted } from "vue"
import { useNuxtApp } from "#app"
import { useUserStore } from "@/stores/user"

export function useLogisticOrderRealtime(onUpdate: (payload: { type: string, order_id: number, status?: string }) => void) {
  let userChannel: any = null
  let roleChannel: any = null

  const handleUpdate = (payload: any) => {
    if (payload?.type === "logistic.order_updated") {
      onUpdate(payload)
    }
  }

  onMounted(() => {
    const { $echo } = useNuxtApp() as any
    const userStore = useUserStore()
    const userId = userStore.currentUserId

    if (userId) {
      userChannel = $echo.private(`user.${userId}`)
      userChannel.listen("LogisticOrderUpdated", handleUpdate)
    }

    if (userStore.isLogist) {
      roleChannel = $echo.private("role.logistic")
      roleChannel.listen("LogisticOrderUpdated", handleUpdate)
    }
  })

  onUnmounted(() => {
    if (userChannel) {
      userChannel.stopListening("LogisticOrderUpdated", handleUpdate)
    }
    if (roleChannel) {
      roleChannel.stopListening("LogisticOrderUpdated", handleUpdate)
    }
  })
}
