<template>
  <div>
    <EventsFilters
      is-team-table
      @apply="applyFilters"
    />
    <EventsTable
      :events="eventsData"
      :pagination="pagination"
      is-team-table
      @change-page="onPaginationChange"
    />
  </div>
</template>

<script setup lang="ts">
import { watchThrottled } from "@vueuse/core"
import { RoleDirector } from "@/constants/roles"
import EventsFilters from "@/components/events/Filters.vue"
import EventsTable from "@/components/events/Table.vue"
import { useUnreadCountStore } from "@/stores/unreadCount"
import { useApiActivityEvents } from "~/composables/api/useApiActivityEvents"
import type { ActivityEvent, ActivityEventsFilter } from "~/types/responses/activityEvent"

definePageMeta({
  auth: true,
  roles: [RoleDirector],
  layout: "personal",
})

const { start, finish } = useLoadingIndicator()
const { team } = useApiActivityEvents()
const unreadStore = useUnreadCountStore()

const eventsData = ref<ActivityEvent[]>([])
const activeFilter = ref<ActivityEventsFilter>({ visibility: "all" })
const pagination = ref({ page: 1, perPage: 10, total: 0 })

async function fetchEvents(page = pagination.value.page, perPage = pagination.value.perPage, isBackground = false) {
  if (!isBackground) {
    start()
  }
  try {
    const response = await team({
      offset: (page - 1) * perPage,
      limit: perPage,
      filter: activeFilter.value,
    })

    eventsData.value = response.data ?? []
    pagination.value = { page, perPage, total: response.meta?.total ?? eventsData.value.length }
  }
  finally {
    if (!isBackground) {
      finish()
    }
  }
}

function onPaginationChange({ currentPage, limit }: { currentPage: number, limit: number }) {
  pagination.value.page = currentPage
  pagination.value.perPage = limit
  void fetchEvents(currentPage, limit)
}

function applyFilters(filter: ActivityEventsFilter) {
  activeFilter.value = filter
  void fetchEvents(1, pagination.value.perPage)
}

watchThrottled(
  () => unreadStore.listingRequestsWsEvent,
  () => {
    void fetchEvents(pagination.value.page, pagination.value.perPage, true)
  },
  { throttle: 5000 },
)

onMounted(() => {
  void fetchEvents()
})
</script>
