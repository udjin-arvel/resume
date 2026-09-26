<template>
  <div :class="$style.page">
    <div :class="$style.topRow">
      <div :class="$style.leftGroup">
        <CommonBackButton :to="`/personal/needs/${numericId}`" />
        <div :class="$style.titleBlock">
          <h1 :class="$style.title">
            {{ t('needs.detail.title', { number: String(numericId).padStart(4, '0') }) }}
          </h1>

          <div
            v-if="request"
            :class="$style.datesRow"
          >
            <span>{{ t('needs.detail.created') }} <span :class="$style.datesItem">{{ formatDateTime(request.created_at, locale) }}</span></span>
            <template v-if="changeDates.length">
              <span>{{ t('needs.detail.changed') }} <span :class="$style.datesItem">{{ changeDates.join(', ') }}</span></span>
            </template>
          </div>

          <div :class="$style.statusRow">
            <Label
              v-if="request"
              :text="t(`statuses.request.${reqStatus}`)"
              :kind="RequestStatusColorMap[reqStatus]"
            />
          </div>
        </div>
      </div>

      <div :class="$style.actions">
        <div
          v-if="!isLocked && !isSeller"
          :class="$style.buttonWrapper"
        >
          <button
            type="button"
            :class="$style.secondaryBtn"
            :disabled="hasPendingChanges"
            @click="handleEdit"
          >
            <PencilSquareIcon class="w-4 h-4" />
            {{ t('needs.detail.edit_request') }}
          </button>
          <div
            v-if="hasPendingChanges"
            :class="$style.tooltip"
          >
            {{ t('needs.form.edit_pending_changes_tooltip') }}
          </div>
        </div>

        <Popover
          v-if="!isLocked"
          :class="$style.relativeBlock"
        >
          <PopoverButton as="template">
            <button
              type="button"
              :class="$style.primaryBtn"
            >
              {{ t('needs.detail.close_request') }}
              <ChevronDownIcon class="w-4 h-4" />
            </button>
          </PopoverButton>
          <transition
            enter-active-class="transition ease-out duration-200"
            enter-from-class="opacity-0 translate-y-1"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition ease-in duration-150"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 translate-y-1"
          >
            <PopoverPanel :class="$style.dropdownPanel">
              <div>
                <button
                  type="button"
                  :class="$style.menuItem"
                  @click="openComplete"
                >
                  {{ t('actions.completed') }}
                </button>
              </div>
              <div>
                <button
                  type="button"
                  :class="[$style.menuItem, $style.menuItemDanger]"
                  @click="openCancel"
                >
                  {{ t('actions.cancel_ellipsis') }}
                </button>
              </div>
            </PopoverPanel>
          </transition>
        </Popover>

        <NeedStatusModal
          v-model:show="showCompleteModal"
          mode="complete"
          :submitting="submitting"
          @submit="submitComplete"
        />
        <NeedStatusModal
          v-model:show="showCancelModal"
          mode="cancel"
          :submitting="submitting"
          @submit="submitCancel"
        />
      </div>
    </div>

    <div :class="$style.card">
      <div :class="$style.cardHeader">
        <div :class="$style.cardTitleRow">
          <h2 :class="$style.cardTitle">
            {{ t('needs.trims.title') }}
          </h2>
          <span :class="$style.badge">{{ totalTrimsCount }}</span>
          <span
            v-if="requestVariants.length > 1"
            :class="$style.variantsBadge"
          >
            {{ t('needs.trims.variants_count', { count: requestVariants.length }) }}
          </span>
        </div>

        <div :class="$style.tabs">
          <button
            type="button"
            :class="[$style.tab, activeTab === 'compare' ? $style.tabActive : $style.tabInactive]"
            @click="activeTab = 'compare'"
          >
            {{ t('needs.trims.tab_compare') }}
          </button>
          <button
            type="button"
            :class="[$style.tab, activeTab === 'list' ? $style.tabActive : $style.tabInactive]"
            @click="activeTab = 'list'"
          >
            {{ t('needs.trims.tab_list') }}
          </button>
        </div>
      </div>

      <div :class="$style.cardBody">
        <div
          v-if="loading"
          :class="$style.loadingState"
        >
          {{ t('common.loading') }}
        </div>

        <template v-else-if="allCarsForCompare.length">
          <CarsCompareTable
            v-if="activeTab === 'compare'"
            :cars="allCarsForCompare"
          />

          <div
            v-else
            :class="$style.selectedCarsWrap"
          >
            <div
              v-for="variant in requestVariants"
              :key="variant.id || variant.priority"
              :class="$style.variantGroup"
            >
              <h3 :class="$style.variantGroupTitle">
                <Label
                  v-if="requestVariants.length > 1"
                  kind="blue"
                  :text="t('needs.form.priority_label', { n: variant.priority })"
                  class="mr-2"
                />
                {{ variantGroupTitle(variant) }}
              </h3>
              <SelectedCarsList
                v-if="variantCarsForView(variant.cars).length"
                :selected-cars="variantCarsForView(variant.cars)"
                :readonly-mode="true"
              />
              <p
                v-else
                :class="$style.emptyVariant"
              >
                {{ t('needs.trims.no_cars') }}
              </p>
            </div>
          </div>
        </template>

        <div
          v-else
          :class="$style.emptyState"
        >
          {{ t('needs.trims.no_cars') }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/vue"
import { PencilSquareIcon } from "@heroicons/vue/24/outline"
import { ChevronDownIcon } from "@heroicons/vue/24/solid"
import { ref, computed, onMounted } from "vue"
import { storeToRefs } from "pinia"
import { useI18n } from "vue-i18n"
import { useRoute, useRouter } from "vue-router"
import { formatDateTime } from "@/utils/formatters"
import { RequestStatusColorMap } from "@/constants/statuses"
import useSearchRequest from "@/composables/useSearchRequest"
import {
  legacyVariantFromRequest,
  variantCarsForView,
  variantLabel,
} from "@/composables/needs/useVariantSpecs"
import Label from "@/components/common/Label.vue"
import SelectedCarsList from "@/components/needs/SelectedCarsList.vue"
import CarsCompareTable from "@/components/needs/CarsCompareTable.vue"
import NeedStatusModal from "@/components/needs/NeedStatusModal.vue"
import type { SearchRequestDetail, SearchRequestVariantDetail } from "~/types/responses/searchRequest"
import { RoleEmployee, RoleDirector, RoleAdmin, RoleSellerSearch, RoleSellerClient } from "~/constants/roles"

definePageMeta({
  auth: true,
  roles: [RoleEmployee, RoleDirector, RoleAdmin, RoleSellerSearch, RoleSellerClient],
  layout: "personal",
  hideTitle: true,
})

const userStore = useUserStore()
const { isSellerSearch, isSellerClient, isAdmin } = storeToRefs(userStore)
const isSeller = computed(() => {
  return isSellerSearch.value || isAdmin.value || isSellerClient.value
})

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const { show, updateStatus, hasUnacknowledgedChanges } = useSearchRequest()

const numericId = computed(() => Number(route.params.id ?? ""))
const request = ref<SearchRequestDetail | null>(null)
const loading = ref(true)
const activeTab = ref<"compare" | "list">("compare")
const showCancelModal = ref(false)
const showCompleteModal = ref(false)
const submitting = ref(false)

const requestVariants = computed(() => {
  const list = (request.value as any)?.variants
  if (Array.isArray(list) && list.length) {
    return [...list].sort((a: SearchRequestVariantDetail, b: SearchRequestVariantDetail) =>
      (a.priority ?? 0) - (b.priority ?? 0),
    )
  }
  if (request.value) {
    return [legacyVariantFromRequest(request.value)]
  }
  return []
})

const totalTrimsCount = computed(() =>
  requestVariants.value.reduce((sum, v) => sum + (v.cars?.length ?? 0), 0),
)

const allCarsForCompare = computed(() => {
  const seen = new Set<number>()
  const cars: any[] = []
  for (const variant of requestVariants.value) {
    for (const car of variantCarsForView(variant.cars)) {
      if (!car || seen.has(car.id)) {
        continue
      }
      seen.add(car.id)
      cars.push(car)
    }
  }
  return cars
})

const reqStatus = computed(() => request.value?.status ?? "new")

const isLocked = computed(() => {
  const s = reqStatus.value
  return s === "completed" || s === "cancelled"
})

const hasPendingChanges = computed(() =>
  request.value ? hasUnacknowledgedChanges(request.value) : false,
)

const changeDates = computed<string[]>(() => {
  const list = Array.isArray(request.value?.changes) ? request.value?.changes : []
  return list.map((c: any) => formatDateTime(c.changed_at, locale.value))
})

const formatYearRange = (from?: number | null, to?: number | null) => {
  if (from && to) {
    return `${from}—${to}`
  }
  if (from) {
    return `${t("common.from")} ${from}`
  }
  if (to) {
    return `${t("common.to")} ${to}`
  }
  return ""
}

const variantGroupTitle = (variant: SearchRequestVariantDetail) =>
  variantLabel(variant, formatYearRange)

function handleEdit() {
  if (hasPendingChanges.value) {
    return
  }
  router.push(`/personal/needs/${numericId.value}/edit`)
}

function openComplete() {
  showCompleteModal.value = true
}

function openCancel() {
  showCancelModal.value = true
}

async function submitCancel(payload: { reason?: string }) {
  submitting.value = true
  try {
    await updateStatus(numericId.value, "cancelled", { cancellation_reason: payload.reason })
    await router.push({ name: "personal-needs" })
  }
  finally {
    submitting.value = false
  }
}

async function submitComplete() {
  submitting.value = true
  try {
    await updateStatus(numericId.value, "completed", {})
    await router.push({ name: "personal-needs" })
  }
  finally {
    submitting.value = false
  }
}

onMounted(async () => {
  try {
    const res = (await show(numericId.value)) as { data: SearchRequestDetail } | SearchRequestDetail
    const data = (res as any)?.data ?? res
    if (data) {
      request.value = data as SearchRequestDetail
    }
  }
  catch (e) {
    console.error(e)
  }
  finally {
    loading.value = false
  }
})
</script>

<style module>
.page {
  @apply flex flex-col gap-5;
}

.topRow {
  @apply flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between;
}

.leftGroup {
  @apply flex min-w-0 items-start gap-3;
}

.titleBlock {
  @apply min-w-0 flex flex-col gap-1.5;
}

.title {
  @apply truncate text-2xl font-bold leading-tight tracking-tight text-gray-900 md:text-[28px];
}

.datesRow {
  @apply flex flex-col sm:flex-row sm:flex-wrap sm:gap-x-4 text-sm text-gray-500;
}

.datesItem {
  @apply text-gray-900;
}

.statusRow {
  @apply flex items-center gap-2;
}

.actions {
  @apply flex flex-wrap gap-3 shrink-0 items-center;
}

.secondaryBtn {
  @apply inline-flex h-10 shrink-0 items-center gap-2 rounded-[9px] border border-gray-200 bg-white px-4 text-sm text-gray-900 transition-colors hover:border-gray-400 hover:text-gray-700 disabled:opacity-60;
}

.primaryBtn {
  @apply inline-flex h-10 shrink-0 items-center gap-2 rounded-[9px] bg-gray-900 px-4 text-sm font-medium text-white transition-colors hover:bg-gray-800;
}

.buttonWrapper {
  @apply relative;
}

.buttonWrapper:hover .tooltip {
  @apply opacity-100 visible;
}

.tooltip {
  @apply absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-900 px-3 py-2 text-xs text-white opacity-0 invisible transition-opacity duration-200;
}

.tooltip::after {
  content: '';
  @apply absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900;
}

.relativeBlock {
  @apply relative;
}

.dropdownPanel {
  @apply absolute top-full right-0 z-50 mt-2 w-44 rounded-[9px] bg-white p-2 shadow-lg ring-1 ring-gray-900/5;
}

.menuItem {
  @apply w-full text-left px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 rounded-[6px] transition;
}

.menuItemDanger {
  @apply text-red-600;
}

.card {
  @apply flex flex-col overflow-hidden rounded-[9px] border border-gray-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)];
}

.cardHeader {
  @apply flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 px-4 sm:px-5 py-4 shrink-0;
}

.cardTitleRow {
  @apply flex items-center gap-3 flex-wrap;
}

.cardTitle {
  @apply text-lg font-semibold tracking-tight text-gray-900 md:text-xl;
}

.badge {
  @apply inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-md min-w-[28px];
}

.variantsBadge {
  @apply text-sm text-gray-500;
}

.tabs {
  @apply flex gap-1;
}

.tab {
  @apply px-3 py-1.5 text-sm rounded-[9px] transition-colors;
}

.tabActive {
  @apply font-medium bg-gray-900 text-white;
}

.tabInactive {
  @apply text-gray-500 hover:text-gray-900 hover:bg-gray-50;
}

.cardBody {
  @apply p-4 sm:p-5 min-h-[400px] lg:h-[calc(100vh_-_380px)] overflow-y-auto;
}

.selectedCarsWrap {
  @apply w-full flex flex-col gap-6;
}

.variantGroup {
  @apply w-full;
}

.variantGroupTitle {
  @apply flex flex-wrap items-center gap-2 text-base font-semibold text-gray-900 mb-3;
}

.emptyVariant {
  @apply text-gray-400 text-sm py-4 text-center;
}

.loadingState {
  @apply text-gray-500 text-sm py-8 text-center;
}

.emptyState {
  @apply text-gray-400 text-sm py-8 text-center;
}
</style>
