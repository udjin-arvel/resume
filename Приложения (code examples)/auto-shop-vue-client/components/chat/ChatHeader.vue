<template>
  <div :class="$style.wrapper">
    <button
      v-if="showBackBtn"
      :class="$style.backBtn"
      @click="$emit('back')"
    >
      ←
    </button>

    <div :class="$style.titleBlock">
      <NuxtLink
        v-if="title && titleLink"
        :to="titleLink"
        :class="$style.title"
      >
        {{ title }}
      </NuxtLink>
      <span
        v-else-if="title"
        :class="$style.title"
      >
        {{ title }}
      </span>
      <p
        v-if="subtitle"
        :class="$style.subtitle"
      >
        {{ subtitle }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject } from "vue"
import { useI18n } from "vue-i18n"
import { useChatStore } from "~/stores/chat"
import { chatTypes, USER_ROLE_KEY, ChatRoles } from "~/constants/chat"
import type { ChatRole } from "@/types/common/chat"

defineProps<{ showBackBtn?: boolean }>()
defineEmits(["back"])

const chatStore = useChatStore()
const chatRole = inject<ComputedRef<ChatRole> | null>(USER_ROLE_KEY, null)
const { t } = useI18n()

const isAdminChat = computed(() => {
  const type = chatStore.activeChat?.chatType
  return type === chatTypes.sellerAdmin || type === chatTypes.buyerAdmin
})

const isBuyerOrSeller = computed(() => {
  const role = chatRole?.value
  return role === ChatRoles.Buyer || role === ChatRoles.Seller
})

const title = computed(() => {
  if (isAdminChat.value && isBuyerOrSeller.value) {
    return t("chat.admin")
  }

  return chatStore.activeChat?.name ?? ""
})

const subtitle = computed(() => {
  if (isAdminChat.value && isBuyerOrSeller.value) {
    return ""
  }

  return chatStore.activeChat?.description ?? ""
})

const listingRouteName = computed(() => {
  const role = chatRole?.value

  if (role === ChatRoles.Admin || role === ChatRoles.Seller || role === ChatRoles.Logistic) {
    return "personal-listings-id"
  }

  return "catalog-id"
})

const titleLink = computed(() => {
  const chat = chatStore.activeChat

  if (!chat) {
    return null
  }

  if (chat.chatType === chatTypes.searchRequest && chat.searchRequestId) {
    return { name: "personal-needs-id", params: { id: String(chat.searchRequestId) } }
  }

  if (chat.chatType === chatTypes.buyerSeller && chat.listingId) {
    return { name: listingRouteName.value, params: { id: String(chat.listingId) } }
  }

  return null
})
</script>

<style module>
.wrapper {
  @apply h-16 flex items-center border-b border-gray-200 px-3 flex-none overflow-hidden;
}
.backBtn {
  @apply mr-3 text-gray-600 text-lg font-bold hover:text-black flex-shrink-0;
}
.titleBlock {
  @apply flex flex-col gap-1 overflow-hidden min-w-0;
}
.title {
  @apply text-base sm:text-lg font-bold text-gray-900 truncate whitespace-nowrap overflow-hidden block max-w-full;
}
.subtitle {
  @apply text-sm text-gray-500 truncate whitespace-nowrap overflow-hidden block max-w-full;
}
</style>
