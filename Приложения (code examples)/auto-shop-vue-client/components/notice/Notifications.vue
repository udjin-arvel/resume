<template>
  <div
    :class="[
      $style.wrapper,
      isAuthAgreeLayout ? $style.authWrapper : '',
    ]"
  >
    <div :class="$style.notifications">
      <NoticeNotification
        v-for="notification in notificationsStore.notifications"
        :key="notification.id"
        :kind="notification.kind"
        :title="t('notification.title.' + notification.kind)"
        :sub-title="subtitle(notification.subtitle)"
        @close="close(notification)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Notification as NotificationType } from "@/types/common/notification"

const { te, t } = useI18n()
const route = useRoute()
const notificationsStore = useNotificationsStore()
const subtitle = (value: string) => (te("notification." + value) ? t("notification." + value) : value)
const close = (item: NotificationType) => {
  notificationsStore.popNotification(item)
}
const isAuthAgreeLayout = computed(() => route.meta.layout === "auth")
</script>

<style module>
.wrapper {
  z-index: 100000;
    @apply fixed inset-0 top-12 flex items-end px-4 py-6 pointer-events-none sm:p-6 sm:items-start;
}

.authWrapper {
    top: 0 !important;
}

.notifications {
    @apply w-full flex flex-col items-center space-y-4 sm:items-end;
}
</style>
