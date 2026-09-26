import { defineStore } from "pinia"
import type { ChatMessage } from "@/types/common/chat"
import { mergeMessagesByIdAsc, mergeOneMessageByIdAsc } from "@/utils/mergeChatMessage"

export const useChatMessagesActiveStore = defineStore("chatMessagesActive", {
  state: () => ({
    activeChatId: undefined as number | undefined,
    byChat: {} as Record<number, ChatMessage[]>,
    minIdByChat: {} as Record<number, number | undefined>,
  }),
  getters: {
    activeChatMessages(state) {
      const id = state.activeChatId
      return id ? (state.byChat[id] ?? []) : []
    },
    activeChatMinId(state) {
      const id = state.activeChatId
      return id ? state.minIdByChat[id] : undefined
    },
  },
  actions: {
    setActiveChat(id?: number | null) {
      this.activeChatId = id ?? undefined
      if (this.activeChatId && !this.byChat[this.activeChatId]) {
        this.byChat[this.activeChatId] = []
      }
    },
    resetMessages() {
      this.clearChat(this.activeChatId)
    },
    clearChat(chatId?: number | null) {
      if (!chatId) {
        return
      }
      this.byChat[chatId] = []
      this.minIdByChat[chatId] = undefined
    },
    setMessages(items: ChatMessage[]) {
      this.setChatMessages(this.activeChatId, items)
    },
    setChatMessages(chatId: number | null | undefined, items: ChatMessage[]) {
      if (!chatId) {
        return
      }
      this.byChat[chatId] = mergeMessagesByIdAsc([], items ?? [])
    },
    appendMessages(older: ChatMessage[]) {
      this.appendChatMessages(this.activeChatId, older)
    },
    appendChatMessages(chatId: number | null | undefined, older: ChatMessage[]) {
      if (!chatId || !older?.length) {
        return
      }
      const list = this.byChat[chatId] ?? []
      this.byChat[chatId] = mergeMessagesByIdAsc(list, older)
    },
    prependMessage(newer: ChatMessage) {
      this.prependChatMessage(this.activeChatId, newer)
    },
    prependChatMessage(chatId: number | null | undefined, newer: ChatMessage) {
      if (!chatId) {
        return
      }
      const list = this.byChat[chatId] ?? []

      const existingIdx = list.findIndex(m => m.id === newer.id)

      if (existingIdx !== -1) {
        const existing = list[existingIdx]

        if (existing.translateStatus === "done" && newer.translateStatus !== "done") {
          return
        }

        list.splice(existingIdx, 1, newer)
        this.byChat[chatId] = [...list]
      }
      else {
        this.byChat[chatId] = mergeOneMessageByIdAsc(list, newer)
      }
    },
    setMinId(val?: number) {
      this.setChatMinId(this.activeChatId, val)
    },
    setChatMinId(chatId: number | null | undefined, val?: number) {
      if (!chatId) {
        return
      }
      this.minIdByChat[chatId] = val
    },
    updateMinIdByItems(items: ChatMessage[]) {
      this.setChatMinIdByItems(this.activeChatId, items)
    },
    setChatMinIdByItems(chatId: number | null | undefined, items: ChatMessage[]) {
      if (!chatId || !items?.length) {
        return
      }
      const current = this.minIdByChat[chatId]
      const next = Math.min(...items.map(i => i.id))
      this.minIdByChat[chatId] = current !== undefined ? Math.min(current, next) : next
    },
    updateMessage(msg: ChatMessage) {
      if (!msg.chatId) {
        return
      }

      const list = this.byChat[msg.chatId]
      if (!list) {
        return
      }

      const idx = list.findIndex(m => m.id === msg.id)

      if (idx !== -1) {
        this.byChat[msg.chatId].splice(idx, 1, msg)
      }
      else {
        this.prependChatMessage(msg.chatId, msg)
      }
    },
    markMessagesAsRead(chatId: number, lastReadMessageId: number) {
      if (this.activeChatId !== chatId) {
        return
      }

      const list = this.byChat[chatId]
      if (!list) {
        return
      }

      let updated = false
      for (let i = 0; i < list.length; i++) {
        if (list[i].id <= lastReadMessageId && !list[i].isRead) {
          list[i].isRead = true
          updated = true
        }
      }

      if (updated) {
        this.byChat[chatId] = [...list]
      }
    },
  },
})
