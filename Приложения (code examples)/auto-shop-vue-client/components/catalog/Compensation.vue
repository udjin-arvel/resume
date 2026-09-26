<template>
  <div :class="[$style.wrapper, { [$style.completedWrapper]: hasCompensation }]">
    <Modal
      v-model="showRequestModal"
      size="lg"
      :overflow-hidden="true"
      @update:model-value="handleModalToggle"
    >
      <template #body>
        <h2 class="text-xl font-bold mb-4 pr-10">
          {{ t('catalog.detail.compensation_modal_title') }}
        </h2>
        <Alert
          v-if="alert"
          :alert="alert"
        />
        <p class="text-base text-gray-600 mb-4">
          <strong v-if="compensationRequested">{{ t('catalog.detail.compensation_subscription_free') }}</strong>
          <strong v-else>{{ t('catalog.detail.compensation_modal_cost', { cost: CompensationCost }) }}</strong>
        </p>
        <RequestNeedSelect
          v-if="showRequestModal && !compensationRequested"
          :key="listingId"
          v-model="selectedNeedId"
          v-model:ready="needSelectionReady"
          :listing-id="listingId"
          :disabled="isSubmitting"
        />
      </template>

      <template #footer>
        <div class="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <Button
            kind="blue"
            size="base"
            type="submit"
            :disabled="isLoading || isSubmitting || (!compensationRequested && !needSelectionReady)"
            @click="handleConfirmCompensation"
          >
            {{ t('catalog.detail.diagnostic_modal_confirm') }}
          </Button>
          <Button
            kind="lightgrey"
            size="base"
            type="button"
            @click="showRequestModal = false"
          >
            {{ t('catalog.detail.diagnostic_modal_cancel') }}
          </Button>
        </div>
      </template>
    </Modal>

    <SideDrawer
      v-model="showReportDrawer"
      :title="t('catalog.detail.compensation_title')"
    >
      <CompensationReportView
        v-if="report"
        :report="report"
      />
    </SideDrawer>

    <div :class="[$style.header, { [$style.completedHeader]: hasCompensation }]">
      <div>
        <div :class="$style.title">
          {{ t("catalog.detail.compensation_title") }}
        </div>
      </div>
    </div>

    <div :class="$style.body">
      <p :class="$style.compensationReportSubheader">
        {{ t('catalog.detail.compensation_description') }}
      </p>
      <div
        v-if="hasCompensation"
        class="flex justify-between mt-6"
      >
        <button
          type="button"
          :class="$style.reportLink"
          @click="openReportDrawer"
        >
          {{ t("catalog.detail.go_to_compensation") }}
          <ChevronRightIcon :class="$style.linkIcon" />
        </button>
        <span
          v-if="inspectedAtLabel"
          :class="$style.reportDate"
        >
          {{ t('catalog.report_inspected_at') }}: {{ inspectedAtLabel }}
        </span>
      </div>
      <template v-else-if="compensationRequested">
        <p :class="$style.compensationDesc">
          {{ t('catalog.detail.compensation_in_progress') }}
        </p>
        <template v-if="canRequestCompensation">
          <Button
            v-if="!compensationSubscribed"
            kind="white"
            :class="$style.compensationRequestBtn"
            @click="openRequestModal"
          >
            <BellIconOutline :class="$style.icon" />
            {{ t('catalog.detail.diagnostic_subscribe') }}
          </Button>
          <Button
            v-else
            kind="white"
            :interactive="false"
            :class="$style.compensationRequestBtn"
          >
            <BellIcon :class="$style.icon" />
            {{ t('catalog.detail.diagnostic_subscribed') }}
          </Button>
        </template>
      </template>
      <template v-else>
        <template v-if="canRequestCompensation">
          <Button
            kind="white"
            :class="$style.compensationRequestBtn"
            @click="openRequestModal"
          >
            {{ t('catalog.detail.request_compensation') }}. {{ t('catalog.detail.diagnostic_cost_short', { cost: CompensationCost, symbol: currencySymbol }) }}
          </Button>
        </template>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import { BellIcon, ChevronRightIcon } from "@heroicons/vue/24/solid"
import { BellIcon as BellIconOutline } from "@heroicons/vue/24/outline"
import { useListingRequest } from "@/composables/useListingRequest"
import { RequestTypeCompensation } from "@/constants/listingRequests"
import { SaleStatusBooked, SaleStatusSold } from "@/constants/catalog"
import { useUserStore } from "@/stores/user"
import { useLocalizedDate } from "@/composables/useLocalizedDate"
import type { ShortListing } from "~/types/responses/listing"
import RequestNeedSelect from "~/components/catalog/RequestNeedSelect.vue"
import Button from "~/components/common/Button.vue"
import Modal from "~/components/common/Modal.vue"
import Alert from "~/components/common/Alert.vue"
import SideDrawer from "~/components/common/SideDrawer.vue"
import CompensationReportView from "~/components/compensation/ReportView.vue"
import { CompensationCost } from "~/constants/catalog"

const props = defineProps<{
  car: ShortListing | null
  listingId: number
  currencySymbol: string
  hasCompensation?: boolean
  isGuest?: boolean
}>()

const emit = defineEmits<{
  (e: "requestCompensation"): void
}>()

const { t } = useI18n()
const { humanDate } = useLocalizedDate()
const userStore = useUserStore()

const compensationRequested = computed(() => !!props.car?.compensation_requested)
const compensationSubscribed = computed(() => !!props.car?.compensation_subscribed)

const showRequestModal = defineModel<boolean>("showRequestModal", { default: false })
const { store, isLoading, alert, clearAlert } = useListingRequest(props.car)

const selectedNeedId = ref<number | null>()
const needSelectionReady = ref(false)
const isSubmitting = ref(false)
watch(showRequestModal, (show) => {
  if (show) {
    selectedNeedId.value = undefined
    needSelectionReady.value = false
    clearAlert()
  }
})

const showReportDrawer = ref(false)
const report = computed(() => props.car?.compensation_report ?? null)
const inspectedAtLabel = computed(() => humanDate(props.car?.compensation_report_inspected_at))

const canRequestCompensation = computed(() => {
  if (!props.car || props.isGuest) {
    return false
  }
  const isSeller = userStore.isAnySeller || userStore.isAdmin
  if (isSeller) {
    return false
  }
  const status = props.car.sale_status
  return status !== SaleStatusBooked && status !== SaleStatusSold
})

function openRequestModal() {
  if (!canRequestCompensation.value) {
    return
  }
  clearAlert()
  showRequestModal.value = true
}

function openReportDrawer() {
  showReportDrawer.value = true
}

async function handleConfirmCompensation() {
  if (isSubmitting.value || (!compensationRequested.value && (!needSelectionReady.value || selectedNeedId.value === undefined))) {
    return
  }
  isSubmitting.value = true
  try {
    const searchRequestId = compensationRequested.value ? undefined : selectedNeedId.value
    const success = await store(props.listingId, RequestTypeCompensation, undefined, searchRequestId)
    if (success) {
      emit("requestCompensation")
      showRequestModal.value = false
      clearAlert()
    }
  }
  finally {
    isSubmitting.value = false
  }
}

function handleModalToggle(value: boolean) {
  showRequestModal.value = value
  if (!value) {
    clearAlert()
  }
}
</script>

<style module>
.wrapper {
  @apply mt-6 border border-red-200 rounded-xl overflow-hidden bg-white;
}

.completedWrapper {
  @apply border-green-200;
}

.header {
  @apply flex items-start justify-between bg-red-50 px-5 pt-5 pb-4;
}

.completedHeader {
  @apply bg-emerald-50;
}

.title {
  @apply font-bold text-base mb-2;
}

.body {
  @apply px-5 pb-5 pt-4;
}

.reportLink {
  @apply inline-flex items-center gap-1 text-left text-sm font-medium text-blue-600 underline hover:text-blue-700;
}

.linkIcon {
  @apply w-4 h-4 flex-shrink-0;
}

.reportDate {
  @apply text-gray-500 font-medium text-sm;
}

.compensationReportSubheader {
  @apply text-base text-[#303030] font-semibold;
}

.compensationReportSubheader:not(:last-child) {
  @apply mb-6;
}

.compensationRequestBtn {
  @apply mt-1 block;
}

.icon {
  @apply w-5 h-5 inline-block mr-1;
}

.compensationDesc {
  @apply text-gray-500 font-medium text-sm;
}
</style>
