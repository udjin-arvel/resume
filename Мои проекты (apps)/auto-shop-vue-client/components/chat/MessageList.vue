<template>
  <div
    ref="scrollWrapper"
    :class="$style.wrapper"
    @scroll="handleScroll"
  >
    <div
      v-if="!hasActiveChat"
      :class="$style.empty"
    >
      {{ t('chat.select_chat') }}
    </div>

    <template v-else>
      <div
        v-if="isPageLoading"
        :class="$style.loading"
      >
        {{ t('chat.loading_messages') }}
      </div>
      <div
        v-if="isLoadingMore"
        :class="$style.loadingMore"
      >
        {{ t('chat.loading_more') }}
      </div>
      <MessageItem
        v-for="msg in messages"
        :key="msg.id"
        :message="msg"
      />
      <div
        v-if="!isPageLoading && !messages.length"
        :class="$style.empty"
      >
        {{ t('chat.no_messages') }}
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue"
import { useI18n } from "vue-i18n"
import MessageItem from "./MessageItem.vue"
import { useChatStore } from "@/stores/chat"
import { useChatMessages } from "@/composables/useChatMessages"
import { useHidePopupsOnScroll } from "@/composables/useHidePopupsOnScroll"

const chatStore = useChatStore()
const hasActiveChat = computed(() => !!chatStore.activeChatId)
const { t } = useI18n()

const scrollWrapper = ref<HTMLElement | null>(null)
useHidePopupsOnScroll(scrollWrapper)

const { data: messages, isPageLoading, isLoadingMore, canLoadMore, fetchNextPage } = useChatMessages()

let oldScrollHeight = 0

const handleScroll = async (event: Event) => {
  const target = event.target as HTMLElement
  if (target.scrollTop <= 0 && canLoadMore.value && !isLoadingMore.value) {
    oldScrollHeight = target.scrollHeight
    await fetchNextPage()
    await nextTick()
    target.scrollTop = target.scrollHeight - oldScrollHeight
  }
}

watch(isPageLoading, async (loading) => {
  if (!loading && hasActiveChat.value && messages.value.length > 0) {
    await nextTick()
    scrollWrapper.value?.scrollTo({ top: scrollWrapper.value.scrollHeight, behavior: "auto" })
  }
})

watch(
  () => messages.value.length,
  async () => {
    if (!scrollWrapper.value) {
      return
    }
    await nextTick()
    scrollWrapper.value.scrollTo({ top: scrollWrapper.value.scrollHeight, behavior: "smooth" })
  },
)
</script>

<style module>
.wrapper {
  @apply flex-1 overflow-y-auto overflow-x-hidden p-3 min-h-0;
}
.empty {
  @apply h-full w-full flex items-center justify-center text-gray-400;
}
.loading {
  @apply h-full w-full flex items-center justify-center text-gray-400;
}
.loadingMore {
  @apply text-center py-2 text-gray-500;
}
</style>
