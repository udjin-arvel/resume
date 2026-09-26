<template>
  <div :class="$style.wrapper">
    <button
      v-for="tab in tabs"
      :key="tab.value"
      type="button"
      :class="[$style.tab, activeSubject === tab.value ? $style.tabActive : '']"
      @click="select(tab.value)"
    >
      <span :class="$style.label">{{ tab.label }}</span>
      <Badge :value="tab.count" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { useRoute, useRouter } from "vue-router"
import { chatSubjects } from "~/constants/chat"
import type { ChatSubject } from "@/types/common/chat"
import { useChatStore } from "~/stores/chat"
import { useUnreadCountStore } from "~/stores/unreadCount"
import Badge from "@/components/common/Badge.vue"

const { t } = useI18n()
const chatStore = useChatStore()
const route = useRoute()
const router = useRouter()

const unreadStore = useUnreadCountStore()

const tabs = computed(() => [
  {
    value: chatSubjects.listing,
    label: t("chat.subject.listing"),
    count: unreadStore.getSubjectUnreadCount(chatSubjects.listing),
  },
  {
    value: chatSubjects.searchRequest,
    label: t("chat.subject.search_request"),
    count: unreadStore.getSubjectUnreadCount(chatSubjects.searchRequest),
  },
])

const activeSubject = computed<ChatSubject>(() => {
  return chatStore.filters.subject === chatSubjects.searchRequest
    ? chatSubjects.searchRequest
    : chatSubjects.listing
})

const syncQuery = (subject: ChatSubject) => {
  const query = { ...route.query }

  if (subject === chatSubjects.listing) {
    delete query.subject
  }
  else {
    query.subject = subject

    if (query.listingId) {
      delete query.listingId
    }
  }

  router.replace({ query })
}

const select = (subject: ChatSubject) => {
  if (subject === activeSubject.value) {
    return
  }

  chatStore.setSubject(subject)
  syncQuery(subject)
}
</script>

<style module>
.wrapper {
  @apply flex items-center gap-1 px-3 py-2 border-b border-gray-200 bg-white flex-none;
}
.tab {
  @apply flex-1 inline-flex items-center justify-center gap-1.5 min-w-0;
  @apply px-3 py-1.5 text-sm rounded-full text-gray-600 hover:bg-gray-100;
}
.label {
  @apply truncate;
}
.tabActive {
  @apply bg-gray-900 text-white hover:bg-gray-900;
}
</style>
