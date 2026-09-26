<template>
  <div :class="$style.closeRequestsBlock">
    <button
      type="button"
      :class="[$style.accordionHeader, isOpen && $style.accordionHeaderOpen]"
      :disabled="disabled"
      :aria-expanded="isOpen"
      :aria-controls="`${fieldId}-options`"
      @click="isOpen = !isOpen"
    >
      <div class="flex min-w-0 items-center gap-3">
        <div :class="[$style.statusDot, selectedRequestId !== null ? $style.statusDotActive : '']">
          <CheckIcon
            v-if="selectedRequestId !== null"
            class="w-3 h-3 text-white"
          />
        </div>
        <div class="min-w-0 text-left">
          <span class="block text-sm font-semibold text-gray-900">
            {{ t('catalog.detail.close_requests_on_booking') }}
          </span>
          <span class="block text-xs text-gray-500">
            {{ t('catalog.detail.close_requests_hint', { count: openRequestsCount }) }}
          </span>
        </div>
      </div>
      <ChevronDownIcon
        :class="[$style.accordionArrow, isOpen ? $style.accordionArrowRotated : '']"
      />
    </button>

    <p
      v-if="selectionWasReset"
      role="alert"
      class="px-4 py-3 text-sm text-amber-800 bg-amber-50"
    >
      {{ t('catalog.detail.booking_selection_unavailable') }}
    </p>

    <transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 max-h-0"
      enter-to-class="opacity-100 max-h-[1000px]"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 max-h-[1000px]"
      leave-to-class="opacity-0 max-h-0"
    >
      <div
        v-if="isOpen"
        :id="`${fieldId}-options`"
        :class="$style.contentWrapper"
      >
        <div
          v-if="isLoadingRequests"
          class="py-8 text-center"
        >
          <span class="text-sm text-gray-400">{{ t('common.loading') }}</span>
        </div>

        <div
          v-else-if="loadError"
          role="alert"
          class="p-4 text-sm text-red-600"
        >
          {{ t('catalog.need_selection.load_error') }}
          <button
            type="button"
            class="ml-2 underline"
            :disabled="disabled"
            @click="loadOpenRequests"
          >
            {{ t('catalog.need_selection.retry') }}
          </button>
        </div>

        <template v-else>
          <div :class="$style.searchWrapper">
            <input
              v-model="searchQuery"
              type="text"
              :disabled="disabled"
              :placeholder="t('common.search')"
              :aria-label="t('common.search')"
              :class="$style.searchInput"
            >
          </div>

          <div
            :class="$style.scrollArea"
            class="custom-scrollbar"
          >
            <div
              v-if="filteredRequests.length === 0"
              :class="$style.emptyState"
            >
              {{ t('catalog.detail.no_open_requests') }}
            </div>

            <div
              v-for="request in filteredRequests"
              :key="request.id"
            >
              <label
                :class="[$style.requestCard, isRequestDisabled(request) && $style.requestCardDisabled]"
              >
                <input
                  v-model="selectedRequestId"
                  type="radio"
                  :name="fieldId"
                  :value="request.id"
                  :disabled="disabled || isRequestDisabled(request)"
                  :class="$style.radio"
                >
                <div :class="$style.cardBody">
                  <div class="flex justify-between items-start gap-4">
                    <div :class="$style.infoSection">
                      <h4 :class="$style.requestTitle">
                        №{{ String(request.id).padStart(4, '0') }}
                        <span
                          v-if="request.cars_info?.length"
                          class="ml-2 font-normal text-gray-500"
                        >
                          {{ request.cars_info.join(', ') }}
                        </span>
                      </h4>
                      <p :class="$style.requestMeta">
                        {{ t('catalog.detail.request_created') }}:
                        <ClientOnly fallback="—">
                          {{ formatDate(request.created_at) }}
                        </ClientOnly>
                      </p>
                      <p
                        v-if="hasPendingBooking(request)"
                        class="mt-1 text-xs text-amber-700"
                      >
                        {{ t('catalog.detail.booking_request_pending') }}
                      </p>
                    </div>

                    <div class="shrink-0">
                      <Label
                        :text="t(`statuses.request.${request.status}`)"
                        :kind="RequestStatusColorMap[request.status]"
                        size="sm"
                      />
                    </div>
                  </div>
                </div>
              </label>
              <p
                v-if="selectedRequestId === request.id && !isRequestDisabled(request)"
                class="px-3 pt-2 text-sm text-gray-600"
              >
                {{ t('catalog.detail.booking_request_pause_hint') }}
              </p>
            </div>
          </div>
        </template>

        <label :class="$style.footer">
          <input
            v-model="selectedRequestId"
            type="radio"
            :name="fieldId"
            :value="null"
            :disabled="disabled"
            :class="$style.radio"
          >
          <span class="text-sm text-gray-600">
            {{ t('catalog.detail.do_not_close_request') }}
          </span>
        </label>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useId, watch } from "vue"
import { useI18n } from "vue-i18n"
import { ChevronDownIcon, CheckIcon } from "@heroicons/vue/24/outline"
import Label from "@/components/common/Label.vue"
import { RequestStatusColorMap, RequestStatusOnBooking } from "@/constants/statuses"
import { useApiSearchRequests } from "@/composables/api/useApiSearchRequests"
import { useSearchRequestsRealtime } from "@/composables/useSearchRequestsRealtime"
import { useUserStore } from "@/stores/user"
import type { OpenRequestRaw } from "@/types/responses/searchRequest"

const props = defineProps<{ disabled?: boolean, refreshKey?: number }>()
const emit = defineEmits<{ selectionReady: [value: boolean] }>()
const selectedRequestId = defineModel<number | null>({ default: null })

const { t, locale } = useI18n()
const userStore = useUserStore()
const { getOpenRequests } = useApiSearchRequests()

const fieldId = useId()
const openRequests = ref<OpenRequestRaw[]>([])
const isOpen = ref(false)
const searchQuery = ref("")
const isLoadingRequests = ref(false)
const isLoaded = ref(false)
const loadError = ref(false)
const selectionWasReset = ref(false)
let reloadRequested = false
let isDisposed = false

const filteredRequests = computed(() => {
  if (!searchQuery.value) {
    return openRequests.value
  }

  const q = searchQuery.value.toLowerCase()
  return openRequests.value.filter((request) => {
    const formattedId = String(request.id).padStart(4, "0")
    const idMatch = formattedId.includes(q) || String(request.id).includes(q)

    const carMatch = request.cars_info?.some((car: string) =>
      car.toLowerCase().includes(q),
    )
    return idMatch || carMatch
  })
})

const currentUserId = computed(() => userStore.currentUserId)
const openRequestsCount = computed(() => openRequests.value.length)
const selectionReady = computed(() => {
  if (selectedRequestId.value === null) {
    return true
  }
  return isLoaded.value && !isLoadingRequests.value && !loadError.value
    && openRequests.value.some(request => request.id === selectedRequestId.value && !isRequestDisabled(request))
})

function hasPendingBooking(request: OpenRequestRaw) {
  return request.status === RequestStatusOnBooking || request.disabled_reason === "booking_pending"
}

function isRequestDisabled(request: OpenRequestRaw) {
  return request.disabled || hasPendingBooking(request)
}

async function loadOpenRequests() {
  if (isDisposed || !currentUserId.value) {
    return
  }
  reloadRequested = true
  if (isLoadingRequests.value) {
    return
  }

  isLoadingRequests.value = true
  loadError.value = false
  try {
    do {
      reloadRequested = false
      const userId: number | null | undefined = currentUserId.value
      try {
        const res = await getOpenRequests()
        if (isDisposed || userId !== currentUserId.value || reloadRequested) {
          continue
        }
        openRequests.value = res.data || []
        isLoaded.value = true
        loadError.value = false
        if (selectedRequestId.value !== null
          && !openRequests.value.some(request => request.id === selectedRequestId.value && !isRequestDisabled(request))) {
          selectedRequestId.value = null
          selectionWasReset.value = true
        }
      }
      catch {
        if (!isDisposed && userId === currentUserId.value && !reloadRequested) {
          loadError.value = true
        }
      }
    } while (reloadRequested && !isDisposed && currentUserId.value)
  }
  finally {
    isLoadingRequests.value = false
  }
}

watch(currentUserId, (id) => {
  openRequests.value = []
  isLoaded.value = false
  if (id) {
    void loadOpenRequests()
  }
}, { immediate: true })
watch(isOpen, (open) => {
  if (open) {
    void loadOpenRequests()
  }
})
watch(() => props.refreshKey, () => {
  void loadOpenRequests()
})
watch(selectedRequestId, (id) => {
  if (id !== null) {
    selectionWasReset.value = false
  }
})
watch(selectionReady, (ready) => {
  emit("selectionReady", ready)
}, { immediate: true, flush: "sync" })

useSearchRequestsRealtime(() => {
  void loadOpenRequests()
})

onBeforeUnmount(() => {
  isDisposed = true
})

function formatDate(date: string | null) {
  if (!date) {
    return "—"
  }
  return new Date(date).toLocaleDateString(locale.value === "zh" ? "zh-CN" : "ru-RU", {
    month: "2-digit", day: "2-digit", year: "numeric",
  })
}
</script>

<style module>
.closeRequestsBlock {
  @apply mt-6 bg-white border border-gray-200 rounded-xl overflow-hidden transition-all;
}

.accordionHeader {
  @apply w-full px-4 py-3 flex items-center justify-between gap-3 hover:bg-gray-50 transition-colors outline-none;
}

.accordionHeaderOpen {
  @apply border-b border-gray-100 bg-gray-50/30;
}

.statusDot {
  @apply w-5 h-5 shrink-0 rounded border border-gray-300 flex items-center justify-center transition-colors bg-white;
}

.statusDotActive {
  @apply bg-gray-900 border-gray-900;
}
.accordionArrow {
  @apply w-5 h-5 shrink-0 text-gray-400 transition-transform duration-300;
}

.accordionArrowRotated {
  @apply rotate-180;
}

.contentWrapper {
  @apply bg-white flex flex-col;
}

.searchWrapper {
  @apply p-4 border-b border-gray-50;
}

.searchInput {
  @apply w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm;
}

.scrollArea {
  @apply p-4 space-y-2 max-h-[400px] overflow-y-auto;
}

.emptyState {
  @apply text-gray-500 text-sm py-8 text-center;
}

.requestCard {
  @apply flex items-center gap-4 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition cursor-pointer;
}

.requestCardDisabled {
  @apply cursor-not-allowed bg-gray-50 opacity-70;
}

.radio {
  @apply shrink-0 border-gray-300 text-blue-600 focus:ring-blue-500;
}

.cardBody {
  @apply flex-1 min-w-0;
}

.infoSection {
  @apply flex-1 min-w-0;
}

.requestTitle {
  @apply text-sm font-semibold text-gray-900 truncate;
}

.requestMeta {
  @apply text-xs text-gray-500 mt-1;
}

.footer {
  @apply flex items-center gap-2 cursor-pointer p-4 border-t border-gray-100 bg-gray-50/30;
}
</style>
