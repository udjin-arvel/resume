import { v4 as uuidv4 } from "uuid"
import type { Notification } from "@/types/common/notification"
import { KindTypeEnum } from "@/types/common/notification"

export const useNotificationsStore = defineStore("notifications", () => {
  const notifications = ref<Notification[]>([])

  const notify = (kind: KindTypeEnum, message: string) => {
    const notification: Notification = { id: uuidv4(), kind: kind, subtitle: message }
    if (!Array.isArray(notifications.value)) {
      notifications.value = []
    }
    notifications.value.push(notification)
    setTimeout(() => {
      popNotification(notification)
    }, 3000)
  }
  const popNotification = (notification: Notification) =>
    (notifications.value = notifications.value.filter(item => item.id !== notification.id))
  const errorNotify = (message: string) => notify(KindTypeEnum.Error, message)
  const successNotify = (message: string) => notify(KindTypeEnum.Success, message)
  const infoNotify = (message: string) => notify(KindTypeEnum.Info, message)
  const warningNotify = (message: string) => notify(KindTypeEnum.Warning, message)

  return {
    notifications,
    notify,
    popNotification,
    errorNotify,
    successNotify,
    infoNotify,
    warningNotify,
  }
})
