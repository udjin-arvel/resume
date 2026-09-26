<template>
  <div>
    <Modal
      v-model="showConfirmation"
      size="lg"
      :overflow-hidden="false"
    >
      <template #body>
        <h2 class="text-xl font-bold mb-4">
          {{ t('catalog.detail.purchase_warning_title') }}
        </h2>
        <Alert
          v-if="alert"
          :alert="alert"
        />
        <p class="text-base text-gray-600 mb-4">
          {{ t('catalog.detail.purchase_warning_text') }}
        </p>
        <p class="text-base text-gray-600 mt-6 pt-4">
          {{ t('catalog.detail.booking_success_description') }}
        </p>
        <CloseRequestsAccordion
          v-if="showConfirmation"
          v-model="selectedRequestId"
          :disabled="isSubmitting"
          :refresh-key="selectionRefreshKey"
          @selection-ready="selectionReady = $event"
        />
      </template>

      <template #footer>
        <div class="flex justify-between">
          <Button
            kind="lightgrey"
            size="base"
            :disabled="isSubmitting"
            @click="handleCancel"
          >
            {{ t('actions.cancel') }}
          </Button>
          <Button
            kind="black"
            size="base"
            :disabled="isSubmitting || !canSubmitSelection"
            @click="handleConfirm"
          >
            {{ t('actions.confirm_and_continue_order') }}
          </Button>
        </div>
      </template>
    </Modal>

    <Modal
      v-model="showWarning"
      size="lg"
      :overflow-hidden="false"
    >
      <template #body>
        <h2 class="text-xl font-bold mb-4">
          {{ t('catalog.detail.purchase_warning_title') }}
        </h2>
        <Alert
          v-if="alert"
          :alert="alert"
        />

        <Label
          kind="yellow"
          :text="t('common.attention')"
          class="mb-4"
        />

        <p class="text-base text-gray-600 mb-4">
          {{ t('catalog.detail.no_video_and_diagnostic') }}<br>
          {{ t('catalog.detail.recommend_request_video_and_diagnostic') }}
        </p>

        <div class="flex flex-wrap gap-4 mb-6">
          <Button
            v-if="!hasVideos"
            kind="lightgrey"
            size="base"
            :disabled="isSubmitting"
            @click="handleRequestVideo"
          >
            {{ t('catalog.detail.request_video') }}
          </Button>
          <Button
            v-if="!hasDiagnostics"
            kind="lightgrey"
            size="base"
            :disabled="isSubmitting"
            @click="handleRequestDiagnostic"
          >
            {{ t('catalog.detail.request_diagnostic') }}
          </Button>
          <Button
            v-if="!hasCompensation"
            kind="lightgrey"
            size="base"
            :disabled="isSubmitting"
            @click="handleRequestCompensation"
          >
            {{ t('catalog.detail.request_compensation') }}
          </Button>
        </div>

        <hr class="mb-4 border-gray-200">

        <p class="text-base text-gray-600 mb-4">
          {{ t('catalog.detail.can_order_without_video_and_diagnostic') }}<br>
          {{ t('catalog.detail.check_all_data_before_order') }}
        </p>

        <p class="text-base text-gray-600 mt-6 pt-4">
          {{ t('catalog.detail.booking_success_description') }}
        </p>

        <CloseRequestsAccordion
          v-if="showWarning"
          v-model="selectedRequestId"
          :disabled="isSubmitting"
          :refresh-key="selectionRefreshKey"
          @selection-ready="selectionReady = $event"
        />
      </template>

      <template #footer>
        <div class="flex justify-between">
          <Button
            kind="lightgrey"
            size="base"
            :disabled="isSubmitting"
            @click="handleCancel"
          >
            {{ t('actions.cancel') }}
          </Button>
          <Button
            kind="black"
            size="base"
            :disabled="isSubmitting || !canSubmitSelection"
            @click="handleConfirm"
          >
            {{ t('catalog.detail.accept_risks_and_continue') }}
          </Button>
        </div>
      </template>
    </Modal>

    <div
      v-if="showBookingSuccess && bookingStatus === 'new'"
      :class="$style.bookingSuccessBlock"
    >
      <div :class="$style.bookingSuccessTitle">
        {{ t('catalog.detail.booking_success_title') }}: {{ queuePosition }}
      </div>
      <div :class="$style.bookingSuccessText">
        {{ t('catalog.detail.booking_success_description') }}
      </div>
    </div>

    <div
      v-if="showBookingSuccess && bookingStatus === 'confirmed'"
      :class="$style.bookingConfirmedBlock"
    >
      <div :class="$style.bookingConfirmedText">
        {{ t('catalog.detail.booking_confirmed_title') }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import CloseRequestsAccordion from "./CloseRequestsAccordion.vue"
import Modal from "@/components/common/Modal.vue"
import Button from "@/components/common/Button.vue"
import Label from "@/components/common/Label.vue"
import Alert from "@/components/common/Alert.vue"
import type { Alert as AlertData } from "@/types/common/alert"

interface Props {
  showConfirmation: boolean
  showWarning: boolean
  showBookingSuccess: boolean
  hasVideos: boolean
  hasDiagnostics: boolean
  hasCompensation: boolean
  isSubmitting: boolean
  alert: AlertData | null
  queuePosition?: number
  bookingStatus?: string
  selectionRefreshKey?: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  "update:showConfirmation": [value: boolean]
  "update:showWarning": [value: boolean]
  "confirm": [searchRequestId: number | null]
  "cancel": []
  "request-video": []
  "request-diagnostic": []
  "request-compensation": []
  "proceed-to-purchase": []
}>()

const { t } = useI18n()

const showConfirmation = computed({
  get: () => props.showConfirmation,
  set: (value) => {
    if (props.isSubmitting) {
      return
    }
    emit("update:showConfirmation", value)
    if (!value) {
      emit("cancel")
    }
  },
})

const showWarning = computed({
  get: () => props.showWarning,
  set: (value) => {
    if (props.isSubmitting) {
      return
    }
    emit("update:showWarning", value)
    if (!value) {
      emit("cancel")
    }
  },
})

const selectedRequestId = ref<number | null>(null)
const selectionReady = ref(true)
const canSubmitSelection = computed(() => selectedRequestId.value === null || selectionReady.value)

watch(() => props.showConfirmation || props.showWarning, () => {
  selectedRequestId.value = null
  selectionReady.value = true
})

function handleRequestVideo() {
  if (props.isSubmitting) {
    return
  }
  emit("request-video")
  showWarning.value = false
}

function handleRequestDiagnostic() {
  if (props.isSubmitting) {
    return
  }
  emit("request-diagnostic")
  showWarning.value = false
}

function handleRequestCompensation() {
  if (props.isSubmitting) {
    return
  }
  emit("request-compensation")
  showWarning.value = false
}

function handleConfirm() {
  if (props.isSubmitting || !canSubmitSelection.value) {
    return
  }
  emit("confirm", selectedRequestId.value)
}

function handleCancel() {
  if (props.isSubmitting) {
    return
  }
  emit("cancel")
}
</script>

<style module>
.bookingSuccessBlock {
  @apply mt-8 rounded-xl p-8 mb-6 flex flex-col bg-green-50 border border-green-300;
}

.bookingConfirmedBlock {
  @apply mt-8 rounded-xl p-4 mb-6 flex flex-col bg-green-50 border border-green-300;
}

.bookingSuccessTitle {
  @apply text-sm font-bold mb-4 text-gray-900;
}

.bookingSuccessText {
  @apply text-sm text-gray-600;
}

.bookingConfirmedText {
  @apply text-sm font-bold text-gray-900;
}

.proceedButton {
  @apply px-8 py-3 text-lg;
}
</style>
