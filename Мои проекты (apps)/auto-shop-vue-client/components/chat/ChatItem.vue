<template>
  <div
    :class="[
      $style.item,
      isAdminChat ? $style.pinnedItem : '',
      highlighted && (isAdminChat ? $style.itemActiveAdmin : $style.itemActive),
    ]"
  >
    <div :class="$style.left">
      <ChatAvatar
        :type="avatarType"
        :kind="avatarKind"
        :src="avatar"
      />
    </div>

    <div :class="$style.center">
      <h3 :class="$style.title">
        {{ title }}
      </h3>
      <div :class="$style.name">
        {{ name }}
      </div>
      <div :class="[$style.lastMessage, unread > 0 ? $style.lastMessageUnread : $style.lastMessageRead]">
        {{ lastMessageText }}
      </div>
    </div>

    <div
      class="group"
      :class="$style.right"
    >
      <span :class="$style.time">
        {{ formatSmartDate(createdAt) }}
      </span>
      <Label
        v-if="unread > 0"
        :text="String(unread)"
        kind="darkRed"
        size="sm"
      />
      <div
        :class="$style.menuWrap"
        @click.stop
      >
        <MenuElips
          :menu-action-groups="menuActions"
          kind="white"
          vertical
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, type ComputedRef } from "vue"
import { useI18n } from "vue-i18n"
import { useChatStore } from "~/stores/chat"
import ChatAvatar from "~/components/chat/ChatAvatar.vue"
import Label from "~/components/common/Label.vue"
import MenuElips from "~/components/common/MenuElips.vue"
import type { MenuActions } from "@/types/common/menuActions"
import { useLocalizedDate } from "@/composables/useLocalizedDate"
import type { Chat, MentionType } from "~/types/common/chat"
import { USER_ROLE_KEY, ChatRoles, adminAvatar, chatTypes } from "~/constants/chat"
import { russian, chinese } from "~/constants/lang"
import { translateStatuses } from "~/constants/statuses"

const props = defineProps<{
  chat: Chat
  highlighted?: boolean
}>()

const userRole = inject<ComputedRef<string>>(USER_ROLE_KEY)!
const chatStore = useChatStore()
const { t, locale } = useI18n()
const { formatSmartDate } = useLocalizedDate()

const isAdminChat = computed(() => {
  const ct = props.chat.chatType
  const adminChat = ct === chatTypes.buyerAdmin || ct === chatTypes.sellerAdmin
  return adminChat && userRole.value !== ChatRoles.Admin
})

const avatar = computed(() => (isAdminChat.value ? adminAvatar : props.chat.avatar))
const avatarType = computed<"car" | "personal" | "request">(() => {
  if (isAdminChat.value) {
    return "personal"
  }

  if (props.chat.chatType === chatTypes.searchRequest) {
    return "request"
  }

  return "car"
})
const avatarKind = computed<"user" | "admin">(() => (isAdminChat.value && userRole.value !== ChatRoles.Admin ? "admin" : "user"))

const title = computed(() => props.chat.name)
const name = computed(() => {
  const sender = props.chat.lastMessage?.sender
  if (!sender) {
    return ""
  }

  if (sender.role === userRole.value) {
    return t("chat.you")
  }

  return sender.name ?? ""
})

const createdAt = computed(() => {
  return props.chat.lastMessage?.createdAt || props.chat.createdAt
})
const unread = computed(() => props.chat.unread)

const lastMessageText = computed(() => {
  const msg = props.chat.lastMessage
  if (!msg) {
    return ""
  }

  let content = msg.text

  if (msg.translateStatus === translateStatuses.done) {
    if (locale.value === russian && msg.textRu) {
      content = msg.textRu
    }
    else if (locale.value === chinese && msg.textZh) {
      content = msg.textZh
    }
  }

  const hasFiles = msg.files?.length > 0
  const fileText = hasFiles ? t("chat.file") : content
  const firstMention = msg.mentions?.find(m => m !== null) ?? null

  if (firstMention) {
    const participant = props.chat.participants.find(p => p.role === firstMention)

    if (participant) {
      return `@${participant.name}${fileText ? " " + fileText : ""}`
    }

    const mentionFallback: Record<Exclude<MentionType, null>, string> = {
      admin: t("chat.admin"),
      buyer: t("chat.buyer"),
      seller: t("chat.seller"),
      logistic: t("chat.logistic"),
    }
    return `@${mentionFallback[firstMention]}${fileText ? " " + fileText : ""}`
  }

  return fileText
})

const handleMarkUnread = async () => {
  await chatStore.markChatAsUnread(props.chat.id)
}

const menuActions: MenuActions[][] = [
  [{ label: t("chat.actions.mark_unread"), action: handleMarkUnread }],
]
</script>

<style module>
.item {
  @apply flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer;
}
.left {
  @apply flex-shrink-0;
}
.center {
  @apply flex-1 min-w-0;
}
.title {
  @apply text-sm font-medium text-gray-900 truncate;
}
.name {
  @apply text-xs text-gray-500 truncate;
}
.lastMessage {
  @apply text-sm truncate;
}
.lastMessageUnread {
  @apply font-bold text-gray-900;
}
.lastMessageRead {
  @apply font-normal text-gray-700;
}
.right {
  @apply flex flex-col items-end justify-between self-stretch relative;
}
.time {
  @apply text-xs text-gray-400;
}
.menuWrap {
  @apply absolute top-0 right-0 hidden;
}
:global(.group:hover) .menuWrap {
  display: block;
}
.pinnedItem {
  @apply border-b border-black;
}
.itemActiveAdmin {
  @apply bg-[#fef2f2];
}
.itemActive {
  @apply bg-[#f0f9ff];
}
</style>
