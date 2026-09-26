<template>
  <div :class="[$style.wrapper, { [$style.completedWrapper]: hasDiagnostics }]">
    <Modal
      v-model="showDiagnosticModal"
      size="lg"
      :overflow-hidden="true"
      @update:model-value="handleModalToggle"
    >
      <template #body>
        <h2 class="text-xl font-bold mb-4 pr-10">
          {{ t('catalog.detail.diagnostic_modal_title') }}
        </h2>
        <Alert
          v-if="alert"
          :alert="alert"
        />
        <p
          v-if="showCompensationRecommendation"
          class="text-base text-gray-600 mb-2"
        >
          <strong>{{ t('catalog.detail.diagnostic_modal_recommend_compensation') }}</strong>&nbsp;
          <a
            href="#"
            class="text-blue-500 hover:text-blue-700 underline"
            @click.prevent="handleRequestCompensation"
          >{{ t('catalog.detail.diagnostic_modal_request_compensation') }}</a>
        </p>
        <p
          v-if="diagnosticRequested"
          class="text-base text-gray-600 mb-4"
        >
          <strong>{{ t('catalog.detail.diagnostic_someone_already_requested') }}</strong>
        </p>
        <p
          v-if="hasVideos && !diagnosticRequested"
          class="text-base text-gray-600 mb-4"
        >
          <strong>{{ t('catalog.detail.diagnostic_modal_cost', { cost: diagnosticCost }) }}</strong>
        </p>
        <template v-else>
          <p
            v-if="!diagnosticRequested"
            class="text-base text-gray-600 mb-2"
          >
            <strong>{{ t('catalog.detail.diagnostic_modal_recommend_video') }}</strong>&nbsp;
            <a
              href="#"
              class="text-blue-500 hover:text-blue-700 underline"
              @click.prevent="handleRequestVideo"
            >{{ t('catalog.detail.diagnostic_modal_request_video') }}</a>
          </p>
          <p
            v-if="!diagnosticRequested"
            class="text-base text-gray-600 mb-4"
          >
            <strong>{{ t('catalog.detail.diagnostic_modal_cost', { cost: diagnosticCost }) }}</strong>
            <br>
            <strong class="mt-4">{{ t('catalog.detail.diagnostic_modal_extra') }}</strong>
          </p>
        </template>
        <RequestNeedSelect
          v-if="showDiagnosticModal && !diagnosticRequested"
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
            :disabled="isLoading || isSubmitting || (!diagnosticRequested && !needSelectionReady)"
            @click="handleConfirmDiagnostic"
          >
            {{ t('catalog.detail.diagnostic_modal_confirm') }}
          </Button>
          <Button
            kind="lightgrey"
            size="base"
            type="button"
            @click="showDiagnosticModal = false"
          >
            {{ t('catalog.detail.diagnostic_modal_cancel') }}
          </Button>
        </div>
      </template>
    </Modal>

    <div :class="[$style.header, { [$style.completedHeader]: hasDiagnostics }]">
      <div>
        <div :class="$style.title">
          {{ t('catalog.detail.diagnostic_and_condition_title') }}
        </div>
        <div :class="$style.badge">
          <CheckIcon :class="$style.checkIcon" />
          {{ t('catalog.detail.we_check_every_car') }}
        </div>
      </div>
      <DioagnosticCar :class="$style.carIcon" />
    </div>

    <div :class="$style.body">
      <div :class="$style.params">
        <div
          v-if="conditionValue"
          :class="$style.paramRow"
        >
          <span :class="$style.paramName">{{ t('catalog.detail.condition_label') }}</span>
          <span :class="$style.paramValue">{{ conditionValue }}</span>
        </div>
        <div
          v-else-if="isConditionLocked"
          :class="$style.paramRow"
        >
          <span :class="$style.paramName">{{ t('catalog.detail.condition_label') }}</span>
          <AuthLockInline size="xs" />
        </div>
        <div
          v-if="hasDescription"
          :class="$style.paramRow"
        >
          <span :class="$style.paramName">{{ t('catalog.detail.condition_comment_label') }}</span>
          <TranslatableWrapper
            :data="descriptionData"
            :config="descriptionConfig"
            :class="[$style.paramValue, 'pr-8']"
            control-class="absolute top-0 right-0 z-10"
          />
        </div>
        <div
          v-else-if="isConditionCommentLocked"
          :class="$style.paramRow"
        >
          <span :class="$style.paramName">{{ t('catalog.detail.condition_comment_label') }}</span>
          <AuthLockInline size="xs" />
        </div>
        <div
          v-if="paintValue"
          :class="$style.paramRow"
        >
          <span :class="$style.paramName">{{ t('catalog.detail.body_paint_label') }}</span>
          <span :class="$style.paramValue">{{ paintValue }}</span>
        </div>
        <div
          v-if="numberOfKeys"
          :class="$style.paramRow"
        >
          <span :class="$style.paramName">{{ t('catalog.detail.number_of_keys') }}</span>
          <span :class="$style.paramValue">{{ numberOfKeys }}</span>
        </div>
      </div>

      <div :class="$style.diagnosticLabelRow">
        <div :class="$style.diagnosticLabel">
          {{ t('catalog.detail.diagnostic') }}
        </div>
        <span
          v-if="!hasDiagnostics && !diagnosticRequested && canRequestDiagnostic"
          :class="$style.noDiagnosticBadge"
        >{{ t('catalog.detail.no_diagnostic_yet') }}</span>
      </div>

      <template v-if="hasDiagnostics">
        <div :class="$style.diagnosticLinksRow">
          <div :class="$style.diagnosticLinkContent">
            <a
              href="#"
              :class="$style.diagnosticLinkGo"
              @click.prevent="emit('goToDiagnostic')"
            >
              {{ t('catalog.detail.go_to_diagnostic') }}
              <ArrowTopRightOnSquareIcon :class="$style.diagnosticGoIcon" />
            </a>
            <div
              v-if="diagnosticComment"
              :class="$style.diagnosticComment"
            >
              <div :class="$style.diagnosticCommentLabel">
                {{ t('listing.diagnostic_comment') }}
              </div>
              <p :class="$style.diagnosticCommentText">
                {{ diagnosticComment }}
              </p>
            </div>
          </div>
          <div :class="$style.diagnosticDates">
            <span
              v-if="isOwnReport"
              :class="$style.diagnosticDate"
            >
              {{ t('catalog.report_inspected_at') }}: {{ inspectedAtLabel }}
            </span>
            <template v-else>
              <span
                v-if="diagnosticCreatedAtLabel"
                :class="$style.diagnosticDate"
              >
                {{ t('catalog.detail.diagnostic_added_when') }} {{ diagnosticCreatedAtLabel }}
              </span>
              <span
                v-if="diagnosticChangedAtLabel"
                :class="$style.diagnosticDate"
              >
                {{ t('catalog.detail.diagnostic_updated_when') }} {{ diagnosticChangedAtLabel }}
              </span>
            </template>
          </div>
        </div>
      </template>
      <template v-else-if="diagnosticRequested">
        <p :class="$style.diagnosticDesc">
          {{ t('catalog.detail.diagnostic_in_progress') }}
        </p>
        <template v-if="canRequestDiagnostic">
          <Button
            v-if="!diagnosticSubscribed"
            kind="white"
            :class="$style.diagnosticRequestBtn"
            @click="openDiagnosticModal"
          >
            <BellIconOutline :class="$style.icon" />
            {{ t('catalog.detail.diagnostic_subscribe') }}
          </Button>
          <Button
            v-else
            kind="white"
            :interactive="false"
            :class="$style.diagnosticRequestBtn"
          >
            <BellIcon :class="$style.icon" />
            {{ t('catalog.detail.diagnostic_subscribed') }}
          </Button>
        </template>
      </template>
      <template v-else>
        <template v-if="canRequestDiagnostic">
          <Button
            kind="white"
            :class="$style.diagnosticRequestBtn"
            @click="openDiagnosticModal"
          >
            {{ t('catalog.detail.request_diagnostic') }}. {{ t('catalog.detail.diagnostic_cost_short', { cost: diagnosticCost, symbol: currencySymbol }) }}
          </Button>
        </template>
        <template v-else>
          <p :class="$style.diagnosticDesc">
            {{ t('catalog.detail.no_diagnostic_seller') }}
          </p>
        </template>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import { ArrowTopRightOnSquareIcon, BellIcon, CheckIcon } from "@heroicons/vue/24/solid"
import { BellIcon as BellIconOutline } from "@heroicons/vue/24/outline"
import Button from "@/components/common/Button.vue"
import Modal from "@/components/common/Modal.vue"
import AuthLockInline from "@/components/common/AuthLockInline.vue"
import Alert from "@/components/common/Alert.vue"
import TranslatableWrapper from "@/components/common/TranslatableWrapper.vue"
import RequestNeedSelect from "@/components/catalog/RequestNeedSelect.vue"
import { useListingRequest } from "@/composables/useListingRequest"
import { RequestTypeDiagnostic } from "@/constants/listingRequests"
import { DiagnosticCost, SaleStatusBooked, SaleStatusSold } from "~/constants/catalog"
import type { ShortListing } from "~/types/responses/listing"
import { useLocalizedDate } from "@/composables/useLocalizedDate"
import { useUserStore } from "~/stores/user"
import DioagnosticCar from "@/components/icon/DioagnosticCar.vue"

const props = defineProps<{
  car: ShortListing | null
  listingId: number
  currencySymbol: string
  isGuest?: boolean
  hasDiagnostics?: boolean
  hasCompensation?: boolean
}>()

const emit = defineEmits<{
  (e: "requestDiagnostic" | "goToDiagnostic" | "openVideoModal" | "openCompensationModal"): void
}>()

const showDiagnosticModal = defineModel<boolean>("showDiagnosticModal", { default: false })

const { t } = useI18n()
const { humanDate } = useLocalizedDate()
const userStore = useUserStore()

const diagnosticRequested = computed(() => !!props.car?.diagnostic_requested)
const diagnosticSubscribed = computed(() => !!props.car?.diagnostic_subscribed)
const hasVideos = computed(() => (props.car?.videos?.length ?? 0) > 0)
const showCompensationRecommendation = computed(() => {
  return !props.hasCompensation && !props.car?.compensation_requested
})

const conditionValue = computed(() => {
  const val = props.car?.condition
  if (!val) {
    return ""
  }
  const key = `cars.condition.${val}`
  const translated = t(key)
  return translated !== key ? translated : val
})

const isConditionLocked = computed(() => props.car?.condition_locked === true)

const isConditionCommentLocked = computed(() => props.car?.condition_comment_locked === true)

const hasDescription = computed(() => Boolean(props.car?.description_ru || props.car?.description_zh))

const descriptionData = computed(() => ({
  description_ru: props.car?.description_ru ?? null,
  description_zh: props.car?.description_zh ?? null,
  original_locale: props.car?.original_locale ?? null,
}))

const descriptionConfig = {
  keys: {
    ru: "description_ru",
    zh: "description_zh",
    original: "original_locale",
  },
}

const paintValue = computed(() => {
  return props.car?.original_paint ? t("catalog.detail.original_paint_yes") : ""
})

const numberOfKeys = computed(() => {
  return props.car?.number_of_keys ?? ""
})

const canRequestDiagnostic = computed(() => {
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

const { store, isLoading, alert, clearAlert } = useListingRequest(props.car)

const selectedNeedId = ref<number | null>()
const needSelectionReady = ref(false)
const isSubmitting = ref(false)
watch(showDiagnosticModal, (show) => {
  if (show) {
    selectedNeedId.value = undefined
    needSelectionReady.value = false
    clearAlert()
  }
})

const diagnosticCost = DiagnosticCost
const diagnosticCreatedAtLabel = computed(() => humanDate(props.car?.diagnostic_created_at))
const diagnosticChangedAtLabel = computed(() => humanDate(props.car?.diagnostic_changed_at))
const diagnosticComment = computed(() => {
  if (props.car?.diagnostic_format !== "url") {
    return ""
  }
  return props.car.diagnostic_comment?.trim() ?? ""
})

// У собственного отчёта даты url-формата пустые — показываем дату осмотра.
const isOwnReport = computed(() => !!props.car?.diagnostic_is_own)
const inspectedAtLabel = computed(() => humanDate(props.car?.diagnostic_report_inspected_at))

function openDiagnosticModal() {
  if (!canRequestDiagnostic.value) {
    return
  }
  clearAlert()
  showDiagnosticModal.value = true
}

async function handleConfirmDiagnostic() {
  if (isSubmitting.value || (!diagnosticRequested.value && (!needSelectionReady.value || selectedNeedId.value === undefined))) {
    return
  }
  isSubmitting.value = true
  try {
    const searchRequestId = diagnosticRequested.value ? undefined : selectedNeedId.value
    const success = await store(props.listingId, RequestTypeDiagnostic, undefined, searchRequestId)
    if (success) {
      emit("requestDiagnostic")
      showDiagnosticModal.value = false
      clearAlert()
    }
  }
  finally {
    isSubmitting.value = false
  }
}

function handleRequestVideo() {
  showDiagnosticModal.value = false
  clearAlert()
  emit("openVideoModal")
}

function handleRequestCompensation() {
  showDiagnosticModal.value = false
  clearAlert()
  emit("openCompensationModal")
}

function handleModalToggle(value: boolean) {
  showDiagnosticModal.value = value
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

.badge {
  @apply inline-flex items-center gap-1 text-xs text-gray-600 bg-white border border-gray-200 rounded-full px-3 py-1;
}

.checkIcon {
  @apply w-3.5 h-3.5 text-gray-500 flex-shrink-0;
}

.carIcon {
  @apply flex-shrink-0 ml-3 opacity-80 w-12 h-12;
}

.body {
  @apply px-5 pb-5 pt-4;
}

.params {
  @apply mb-4;
}

.paramRow {
  @apply grid grid-cols-2 py-2 border-b border-gray-100 last:border-b-0 text-sm;
}

.paramName {
  @apply text-gray-500;
}

.paramValue {
  @apply text-gray-900 font-medium;
}

.diagnosticLabelRow {
  @apply flex items-center gap-2 mb-3;
}

.diagnosticLabel {
  @apply font-bold text-base;
}

.noDiagnosticBadge {
  @apply inline-block text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full px-3 py-1;
}

.diagnosticRequestBtn {
  @apply mt-1 block;
}

.diagnosticLinksRow {
  @apply flex justify-between items-start gap-4;
}

.diagnosticLinkContent {
  @apply flex-1 min-w-0;
}

.diagnosticLinkGo {
  @apply text-blue-500 no-underline font-medium text-sm;
}

.diagnosticDate {
  @apply text-gray-500 font-medium text-sm;
}

.diagnosticGoIcon {
  @apply w-4 h-4 inline-block ml-1 align-middle;
}

.diagnosticComment {
  @apply mt-3;
}

.diagnosticCommentLabel {
  @apply text-sm font-medium text-gray-900 mb-1;
}

.diagnosticCommentText {
  @apply text-sm text-gray-600 whitespace-pre-line break-words;
}

.diagnosticDesc {
  @apply text-gray-500 font-medium text-sm;
}

.icon {
  @apply w-5 h-5 inline-block mr-1;
}

.diagnosticDates {
  @apply flex flex-col items-end gap-1 flex-shrink-0;
}
</style>
