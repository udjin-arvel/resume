<template>
  <NuxtLink
    v-if="chatId"
    :to="{ name: 'personal-chats-id', params: { id: String(chatId) } }"
    :class="$style.cell"
    :title="t('needs.detail.open_chat')"
    :aria-label="t('needs.detail.open_chat')"
    @click.stop
  >
    <ChatBubbleLeftEllipsisIcon :class="$style.icon" />
    <Badge :value="unread" />
  </NuxtLink>

  <ToChat
    v-else-if="canOpen"
    type="search_request"
    :search-request-id="requestId"
  >
    <template #default="{ chatLoading, clickDisabled, goToChat }">
      <button
        type="button"
        :class="$style.cell"
        :disabled="clickDisabled"
        :aria-busy="chatLoading || undefined"
        :title="t('needs.detail.open_chat')"
        :aria-label="t('needs.detail.open_chat')"
        @click.stop="goToChat"
      >
        <ChatBubbleLeftEllipsisIcon :class="$style.icon" />
        <Badge :value="unread" />
      </button>
    </template>
  </ToChat>

  <span
    v-else
    :class="$style.empty"
  >—</span>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { ChatBubbleLeftEllipsisIcon } from "@heroicons/vue/24/outline"
import Badge from "@/components/common/Badge.vue"
import ToChat from "@/components/chat/ToChat.vue"
import { useUnreadCountStore } from "@/stores/unreadCount"

const props = withDefaults(defineProps<{
  requestId: number
  chatId?: number | null
  fallback?: number
  canOpen?: boolean
}>(), {
  chatId: null,
  fallback: 0,
  canOpen: true,
})

const { t } = useI18n()
const unreadStore = useUnreadCountStore()

const unread = computed(() => unreadStore.getSearchRequestUnreadCount(props.requestId) ?? props.fallback)
</script>

<style module>
.cell {
  @apply inline-flex items-center gap-1.5 text-gray-500 hover:text-blue-600;
}

.icon {
  @apply w-5 h-5;
}

.empty {
  @apply text-gray-400;
}
</style>
