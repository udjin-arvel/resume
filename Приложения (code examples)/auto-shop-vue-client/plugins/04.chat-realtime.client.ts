import type { Pinia } from "pinia"
import { useUserStore } from "@/stores/user"
import { useChatStore } from "@/stores/chat"
import { useChatMessagesActiveStore } from "@/stores/chatMessage"
import { useUnreadCountStore } from "@/stores/unreadCount"
import type { ChatMessage } from "@/types/common/chat"
import { toCamelCase } from "@/utils/caseTransform"
import { chatSubjectOfType } from "@/utils/chatSubjectOfType"
import { watchEchoUserChannel } from "@/utils/echoUserChannel"

export default defineNuxtPlugin((nuxtApp) => {
  const { $echo } = nuxtApp as unknown as { $echo: any }
  const pinia = nuxtApp.$pinia as Pinia

  const userStore = useUserStore(pinia)
  const chatStore = useChatStore(pinia)
  const messageStore = useChatMessagesActiveStore(pinia)
  const unreadStore = useUnreadCountStore(pinia)

  const subscribe = (userId: number) => {
    const channel = $echo.private(`user.${userId}`)

    channel.listen("App\\Events\\UserChatMessageSent", async (payload: any) => {
      if (!payload || payload.type !== "chat.message") {
        return
      }

      const normalized = toCamelCase(payload)
      const msg = normalized.message as ChatMessage
      const exactUnreadCount = normalized.chatUnreadCount

      if (!msg || !msg.chatId) {
        return
      }
      const chatId = msg.chatId
      const chatExists = chatStore.chats.some(c => c.id === chatId)

      if (!chatExists) {
        const newChat = await chatStore.fetchChatById(chatId)
        if (newChat) {
          chatStore.setChats([newChat])
        }
      }

      if (chatId === messageStore.activeChatId) {
        messageStore.prependMessage(msg)
        chatStore.updateChatLastMessage(chatId, msg, 0)
        await chatStore.markChatAsReadAction(chatId)
      }
      else {
        if (messageStore.byChat[chatId]) {
          messageStore.prependChatMessage(chatId, msg)
        }

        const chat = chatStore.chats.find(c => c.id === chatId)
        const previousUnread = chat?.unread || 0

        if (typeof exactUnreadCount === "number") {
          chatStore.updateChatLastMessage(chatId, msg, exactUnreadCount)
        }
        else {
          chatStore.updateChatLastMessage(chatId, msg, false)
        }

        if ("unreadTotals" in normalized) {
          unreadStore.applyTotals(normalized.unreadTotals)
        }
        else if (typeof exactUnreadCount === "number" && exactUnreadCount > previousUnread) {
          const diff = exactUnreadCount - previousUnread

          unreadStore.setChats(unreadStore.counts.chats + diff)
          unreadStore.bumpSubjectCount(chatSubjectOfType(chat?.chatType ?? undefined), diff)
        }
      }
    })

    channel.listen("App\\Events\\UserChatMessageTranslated", (payload: any) => {
      if (payload?.type !== "chat.message_translated") {
        return
      }

      const normalized = toCamelCase(payload)
      const msg = normalized.message as ChatMessage

      if (!msg) {
        return
      }

      messageStore.updateMessage(msg)

      const chat = chatStore.chats.find(c => c.id === msg.chatId)
      const lastMessageId = chat?.lastMessage?.id
      if (chat && (lastMessageId == null || lastMessageId <= msg.id)) {
        chatStore.updateChatLastMessage(msg.chatId, msg, false)
      }
    })

    channel.listen("App\\Events\\UserChatRead", (payload: any) => {
      if (payload?.type !== "chat.read") {
        return
      }

      const normalized = toCamelCase(payload)
      const chatId = normalized.chatId
      const lastReadMessageId = normalized.lastReadMessageId

      if (!chatId || !lastReadMessageId) {
        return
      }

      messageStore.markMessagesAsRead(chatId, lastReadMessageId)
    })
  }

  watchEchoUserChannel({
    echo: $echo,
    getUserId: () => userStore.currentUserId,
    subscribe,
  })
})
