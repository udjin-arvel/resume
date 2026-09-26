<template>
  <div
    :aria-busy="isLoading || undefined"
    :class="(isLoading ? 'pointer-events-none opacity-90' : '')"
  >
    <slot
      :chat-loading="isLoading"
      :click-disabled="isLoading || disabled"
      :go-to-chat="goToChat"
    />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router"
import { useChat } from "@/composables/useChat"
import type { Chat } from "@/types/common/chat"
import { useChatMessagesActiveStore } from "~/stores/chatMessage"

interface Props {
  type: "listing" | "admin" | "search_request"
  listingId?: number
  searchRequestId?: number
  buyerId?: number
  sellerId?: number
  userId?: number
  chatId?: number
  disabled?: boolean
  filterByListing?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: "loaded", chat: Chat): void
  (e: "error", err: unknown): void
}>()
const router = useRouter()

const { isLoading, openBuyerSellerChat, openSearchRequestChat, openAdminUserChat } = useChat()

const toNumber = (v?: number | null) => (v == null ? undefined : Number(v))
const chatMessagesStore = useChatMessagesActiveStore()

const goToChat = async () => {
  if (props.disabled || isLoading.value) {
    return
  }

  try {
    if (props.filterByListing && props.listingId) {
      await router.push({
        path: "/personal/chats",
        query: { listingId: String(props.listingId) },
      })
      return
    }

    let chat: Chat | undefined

    if (props.chatId) {
      const id = Number(props.chatId)
      chatMessagesStore.setActiveChat(id)
      chatMessagesStore.resetMessages()
      await router.push({ name: "personal-chats-id", params: { id: String(id) } })
      return
    }

    if (props.type === "listing" && props.listingId && props.buyerId) {
      chat = await openBuyerSellerChat({
        listingId: Number(props.listingId),
        buyerId: Number(props.buyerId),
        sellerId: toNumber(props.sellerId),
      })
    }
    else if (props.type === "search_request" && props.searchRequestId) {
      chat = await openSearchRequestChat({ searchRequestId: Number(props.searchRequestId) })
    }
    else if (props.type === "admin" && props.userId) {
      chat = await openAdminUserChat({ userId: Number(props.userId) })
    }

    if (!chat) {
      return
    }

    chatMessagesStore.setActiveChat(chat.id)
    chatMessagesStore.resetMessages()
    emit("loaded", chat)
  }
  catch (err) {
    emit("error", err)
  }
}
</script>
