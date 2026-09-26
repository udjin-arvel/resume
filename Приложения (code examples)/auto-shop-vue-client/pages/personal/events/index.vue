<template>
  <div>
    <NuxtLink
      v-if="isDirector"
      :to="{ name: 'personal-events-team' }"
      :class="$style.teamEventsLink"
    >
      {{ t('notifications.team_events') }}
    </NuxtLink>
    <EventsFilters
      :is-show-client-filter="!isBuyer && !isSellerContent"
      @apply="applyFilters"
    />
    <EventsTable
      :events="eventsData"
      :pagination="pagination"
      :highlighted-event-id="highlightedEventId"
      @read="markAsRead"
      @read-on-navigate="markAsReadOnNavigate"
      @change-page="onPaginationChange"
      @refresh="refreshAfterAction"
    />
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref } from "vue"
import { useI18n } from "vue-i18n"
import { storeToRefs } from "pinia"
import { watchThrottled } from "@vueuse/core"
import { useApiActivityEvents } from "~/composables/api/useApiActivityEvents"
import type { ActivityEvent, ActivityEventsFilter } from "~/types/responses/activityEvent"
import { RoleAdmin, RoleDirector, RoleEmployee, RoleSellerClient, RoleSellerContent, RoleSellerSearch } from "~/constants/roles"
import { useUnreadCountStore } from "@/stores/unreadCount"
import { useNotificationStore } from "@/stores/notification"
import { useUserStore } from "@/stores/user"
import EventsFilters from "@/components/events/Filters.vue"
import EventsTable from "@/components/events/Table.vue"

definePageMeta({
  auth: true,
  roles: [RoleSellerClient, RoleSellerSearch, RoleSellerContent, RoleAdmin, RoleEmployee, RoleDirector],
  layout: "personal",
})

const { start, finish } = useLoadingIndicator()
const { index, read } = useApiActivityEvents()
const { t } = useI18n()
const userStore = useUserStore()
const { isBuyer, isDirector, isSellerContent } = storeToRefs(userStore)
const unreadStore = useUnreadCountStore()
const notificationStore = useNotificationStore()

const eventsData = ref<ActivityEvent[]>([])
const activeFilter = ref<ActivityEventsFilter>({ visibility: "all" })

const pagination = ref({ page: 1, perPage: 10, total: 0 })

const route = useRoute()
const highlightedEventId = ref<number | null>(null)

function applyHighlightFromQuery() {
  const eventId = Number(route.query.event)

  if (eventId) {
    highlightedEventId.value = eventId
  }
}

async function scrollToHighlightedEvent() {
  if (!highlightedEventId.value) {
    return
  }

  await nextTick()
  document.querySelector(".tableHighlightedRow")?.scrollIntoView({ block: "center" })
}

async function fetchNotifications(page = pagination.value.page, perPage = pagination.value.perPage, isBackground = false) {
  if (!isBackground) {
    start()
  }
  try {
    const params: Record<string, any> = {
      offset: (page - 1) * perPage,
      limit: perPage,
      filter: activeFilter.value,
    }

    const response = await index(params)
    eventsData.value = response.data ?? []
    pagination.value = { page, perPage, total: response.meta?.total ?? eventsData.value.length }
    updateUnreadCountFromResponse(response)
  }
  finally {
    if (!isBackground) {
      finish()
    }
  }
}

function updateUnreadCountFromResponse(response: { meta?: { totals?: any } }) {
  if (response.meta?.totals?.total_unread !== undefined) {
    unreadStore.setListingRequests(response.meta.totals.total_unread)
  }
}

function decrementUnreadCounts() {
  if (unreadStore.counts.listingRequests > 0) {
    unreadStore.setListingRequests(unreadStore.counts.listingRequests - 1)
  }
  if (unreadStore.counts.notifications > 0) {
    unreadStore.setNotifications(unreadStore.counts.notifications - 1)
  }
}

function restoreUnreadCounts() {
  unreadStore.setListingRequests(unreadStore.counts.listingRequests + 1)
  unreadStore.setNotifications(unreadStore.counts.notifications + 1)
}

async function markAsRead(item: ActivityEvent) {
  if (item.read_at) {
    return
  }
  item.read_at = new Date().toISOString()
  decrementUnreadCounts()
  try {
    const response = await read(item.id)
    updateUnreadCountFromResponse(response)
    await Promise.all([
      fetchNotifications(pagination.value.page, pagination.value.perPage, true),
      notificationStore.fetchNotifications(),
    ])
  }
  catch {
    item.read_at = null
    restoreUnreadCounts()
  }
}

async function markAsReadOnNavigate(item: ActivityEvent) {
  if (item.read_at) {
    return
  }
  item.read_at = new Date().toISOString()
  decrementUnreadCounts()
  try {
    const response = await read(item.id)
    updateUnreadCountFromResponse(response)
    void notificationStore.fetchNotifications()
  }
  catch (error) {
    item.read_at = null
    restoreUnreadCounts()
    console.error("Ошибка при фоновой отметке прочитанным:", error)
  }
}

async function refreshAfterAction() {
  await Promise.all([
    fetchNotifications(pagination.value.page, pagination.value.perPage, true),
    notificationStore.fetchNotifications(),
  ])
}

function onPaginationChange({ currentPage, limit }: { currentPage: number, limit: number }) {
  pagination.value.page = currentPage
  pagination.value.perPage = limit
  void fetchNotifications(currentPage, limit)
}

function applyFilters(filter: ActivityEventsFilter) {
  activeFilter.value = filter
  void fetchNotifications(1, pagination.value.perPage)
}

watchThrottled(
  () => unreadStore.listingRequestsWsEvent,
  () => {
    void fetchNotifications(pagination.value.page, pagination.value.perPage, true)
  },
  { throttle: 5000 },
)

onMounted(async () => {
  applyHighlightFromQuery()
  await fetchNotifications()
  await scrollToHighlightedEvent()
})
</script>

<style module>
.teamEventsLink {
  @apply inline-block text-sm text-gray-500 underline decoration-gray-400 decoration-1 underline-offset-4 hover:text-gray-700 transition-colors mb-4;
}
</style>
