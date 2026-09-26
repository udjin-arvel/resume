<template>
  <Popover
    v-if="userStore.isAuthenticated"
    v-slot="{ open, close }"
    :class="$style.wrapper"
  >
    <PopoverButton
      :class="[$style.btn, open ? $style.btnActive : '']"
      @click="!open && store.fetchNotifications()"
    >
      <div :class="$style.iconWrapper">
        <BellIcon class="h-6 w-6" />
        <span
          v-if="store.unreadCount > 0"
          :class="$style.badge"
        >
          {{ store.unreadCount > 99 ? '99+' : store.unreadCount }}
        </span>
      </div>
      <svg
        :class="[$style.arrowSvg]"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </PopoverButton>

    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="translate-y-1 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-1 opacity-0"
    >
      <PopoverPanel :class="$style.panel">
        <div :class="$style.panelContent">
          <div :class="$style.header">
            <h3 :class="$style.headerTitle">
              {{ t('notifications.popover_title') }}
              <span
                v-if="store.totalNotifications > 20"
                :class="$style.headerTitleSpan"
              >
                ({{ store.loadedNotificationsCount }}/{{ store.totalNotifications }})
              </span>
            </h3>
            <button
              type="button"
              :class="$style.closeBtn"
              :aria-label="t('common.close')"
              @click="close"
            >
              <XMarkIcon class="h-5 w-5" />
            </button>
          </div>

          <div
            v-if="unreadEvents.length > 0 || store.hasNewNotifications"
            ref="notificationsList"
            :class="$style.list"
          >
            <button
              v-if="store.hasNewNotifications"
              type="button"
              :class="$style.newNotificationsBtn"
              :disabled="store.loading"
              @click="showNewNotifications"
            >
              {{ store.newNotificationsCount > 0
                ? t('notifications.new_count', { count: store.newNotificationsCount })
                : t('notifications.new_available') }}
            </button>

            <div
              v-for="item in unreadEvents"
              :key="item.id"
              :class="$style.listItem"
            >
              <span :class="$style.dot" />

              <div :class="$style.itemBody">
                <div :class="$style.messageRow">
                  <p :class="$style.messageText">
                    {{ getEventTypeName(item.type) }}
                    <LinkOrSpan
                      v-if="isListingRequest(item) || isCarLinkEvent(item) || isSearchRequestEvent(item) || isListingSourceEvent(item)"
                      :to="getItemLink(item)"
                      :class="$style.carLink"
                      @click="onItemClick(item, close)"
                    >
                      {{ getItemLinkLabel(item) }}
                    </LinkOrSpan>
                  </p>

                  <button
                    type="button"
                    :class="$style.markReadBtn"
                    :title="t('common.mark_as_read')"
                    :aria-label="t('common.mark_as_read')"
                    @click="store.readNotification(item)"
                  >
                    <CheckIcon class="h-5 w-6" />
                  </button>
                </div>

                <div :class="$style.date">
                  {{ formatDate(item) }}
                </div>
              </div>
            </div>

            <div
              v-if="store.hasMoreNotifications"
              :class="$style.loadMoreWrapper"
            >
              <button
                type="button"
                :class="$style.loadMoreBtn"
                :disabled="store.loadingMore"
                @click="store.loadMoreNotifications()"
              >
                {{ store.loadingMore ? t('notifications.loading_more') : t('notifications.show_more') }}
              </button>
            </div>
          </div>

          <div
            v-else
            :class="$style.emptyState"
          >
            {{ t('notifications.empty') }}
          </div>

          <div :class="$style.footer">
            <button
              type="button"
              :class="$style.markAllBtn"
              :disabled="unreadEvents.length === 0 || store.markingAll"
              @click="onReadAllNotifications(close)"
            >
              <CheckBadgeIcon class="h-4 w-4" />
              {{ t('notifications.mark_all') }}
            </button>
          </div>
        </div>
      </PopoverPanel>
    </transition>
  </Popover>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from "vue"
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/vue"
import { BellIcon, XMarkIcon, CheckIcon, CheckBadgeIcon } from "@heroicons/vue/24/outline"
import { useI18n } from "vue-i18n"
import { storeToRefs } from "pinia"
import { useNotificationStore } from "@/stores/notification"
import { useUserStore } from "@/stores/user"
import {
  type ActivityEvent,
  isListingRequest,
  isCarLinkEvent,
  isListingSourceEvent,
  isSearchRequestEvent,
} from "~/types/responses/activityEvent"
import { activityEventItemLink } from "~/utils/activityEventLink"
import LinkOrSpan from "~/components/common/LinkOrSpan.vue"

const userStore = useUserStore()
const { t, locale: currentLocale } = useI18n()
const store = useNotificationStore()
const notificationsStore = useNotificationsStore()
const notificationsList = ref<HTMLElement | null>(null)
const { isBuyer } = storeToRefs(userStore)

const unreadEvents = computed(() => {
  const dateField = "created_at"
  return [...store.recentEvents]
    .sort((a, b) => new Date(b[dateField]).getTime() - new Date(a[dateField]).getTime())
})

function formatDate(item: ActivityEvent) {
  return new Date(item.created_at).toLocaleString(currentLocale.value === "zh" ? "zh-CN" : "ru-RU")
}

function getEventTypeName(type: string) {
  return t(`user_notifications.types.${type}`)
}

function getItemLink(item: ActivityEvent) {
  if (isListingSourceEvent(item)) {
    return { name: "personal-events", query: { event: item.id } }
  }

  return activityEventItemLink(item, isBuyer.value)
}

function getItemLinkLabel(item: ActivityEvent) {
  const id = item.entity.attributes.id ?? "—"

  if (isListingRequest(item)) {
    return item.entity.attributes.name
  }
  if (isCarLinkEvent(item)) {
    return t("car_link_events.link_number", { id })
  }
  if (isSearchRequestEvent(item)) {
    return t("search_request_events.request_number", { id })
  }
  if (isListingSourceEvent(item)) {
    return item.entity.attributes.name ?? t("listing_source_events.filter_label")
  }

  return t("listing_source_events.filter_label")
}

async function onReadAllNotifications(close: () => void) {
  await store.readAllNotifications()
  close()
  notificationsStore.successNotify(t("notifications.all_read"))
}

async function showNewNotifications() {
  const refreshed = await store.fetchNotifications()
  if (!refreshed) {
    return
  }

  await nextTick()
  notificationsList.value?.scrollTo({ top: 0 })
}

function onItemClick(item: ActivityEvent, close: () => void) {
  store.readNotification(item)
  close()
}
</script>

<style module>
.wrapper {
  @apply relative;
}

.btn {
  @apply flex items-center appearance-none px-2 py-1 rounded-lg focus:outline-none cursor-pointer transition-colors duration-200 border border-gray-300 bg-gray-200 text-black;
}

.btn:hover,
.btnActive {
  @apply bg-white text-gray-900 border-black;
}

.iconWrapper {
  @apply relative flex items-center justify-center;
}

.badge {
  @apply absolute top-0 right-0 flex h-3.5 w-3.5 -translate-y-1 translate-x-1 items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-white;
}

.arrowSvg {
  @apply w-4 h-4 ml-1 transition-transform duration-200;
}

.panel {
  @apply absolute right-0 z-50 mt-2 w-[26rem] transform rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none;
}

.panelContent {
  @apply flex flex-col max-h-[calc(100vh-6rem)];
}

.header {
  @apply flex items-center justify-between border-b border-gray-100 px-4 py-3;
}

.headerTitle {
  @apply text-base font-bold text-gray-900;
}

.closeBtn {
  @apply p-1 text-gray-400 transition-colors hover:text-red-600 focus:outline-none;
}

.list {
  @apply max-h-[420px] overflow-y-auto overflow-x-hidden overscroll-y-contain px-4;
}

.listItem {
  @apply relative flex gap-3 border-b border-gray-100 py-4 last:border-0 transition-colors;
}

.newNotificationsBtn {
  @apply sticky top-0 z-10 my-3 flex w-full items-center justify-center rounded-md bg-red-50 px-3 py-2 text-xs font-medium text-red-600 shadow-sm transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none;
}

.dot {
  @apply mt-2 h-2 w-2 shrink-0 rounded-full bg-red-600;
}

.itemBody {
  @apply min-w-0 flex-1;
}

.messageRow {
  @apply flex items-start justify-between gap-2;
}

.messageText {
  @apply text-sm leading-relaxed text-gray-800;
}

.markReadBtn {
  @apply mt-0.5 shrink-0 text-gray-400 transition-colors hover:text-red-600 focus:outline-none;
}

.carLink {
  @apply font-semibold text-red-600 underline-offset-2 hover:underline ml-1;
}

.date {
  @apply mt-2 text-[11px] font-medium text-gray-400;
}

.emptyState {
  @apply px-4 py-6 text-center text-sm text-gray-500;
}

.loadMoreWrapper {
  @apply flex justify-center py-3;
}

.loadMoreBtn {
  @apply flex items-center justify-center whitespace-nowrap rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none;
}

.footer {
  @apply border-t border-gray-100 p-3;
}

.markAllBtn {
  @apply flex w-full items-center justify-center gap-2 rounded-lg bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none;
}

.headerTitleSpan {
  @apply text-sm font-medium text-gray-400;
}
</style>
