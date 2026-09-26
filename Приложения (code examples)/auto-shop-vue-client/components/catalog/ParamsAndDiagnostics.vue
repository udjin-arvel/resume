<template>
  <div>
    <div :class="$style.block">
      <Params
        :car="car"
        :is-guest="isGuest"
      />
    </div>
    <template v-if="!isArchive">
      <Compensation
        v-if="!isCompensationLocked"
        v-model:show-request-modal="showCompensationModal"
        :car="car"
        :listing-id="listingId"
        :currency-symbol="currencySymbol"
        :is-guest="isGuest"
        :has-compensation="hasCompensation"
        @request-compensation="emit('requestCompensation')"
      />
      <AuthLockBlock
        v-else
        :title="t('catalog.detail.compensation_title')"
        :blur-mode="true"
        :custom-class="$style.diagnosticLocked"
      />
      <Diagnostics
        v-if="!isDiagnosticsLocked"
        v-model:show-diagnostic-modal="showDiagnosticModal"
        v-model:diagnostic-action="diagnosticAction"
        :car="car"
        :listing-id="listingId"
        :currency-symbol="currencySymbol"
        :is-guest="isGuest"
        :has-diagnostics="hasDiagnostics"
        :has-compensation="hasCompensation"
        @request-diagnostic="emit('requestDiagnostic')"
        @go-to-diagnostic="emit('goToDiagnostic')"
        @open-video-modal="emit('requestVideo')"
        @open-compensation-modal="showCompensationModal = true"
      />
      <AuthLockBlock
        v-else
        :title="t('catalog.detail.diagnostic')"
        :blur-mode="true"
        :custom-class="$style.diagnosticLocked"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n"
import Params from "@/components/catalog/Params.vue"
import Diagnostics from "@/components/catalog/Diagnostics.vue"
import Compensation from "~/components/catalog/Compensation.vue"
import AuthLockBlock from "@/components/common/AuthLockBlock.vue"
import type { ShortListing } from "~/types/responses/listing"

defineProps<{
  car: ShortListing | null
  listingId: number
  currencySymbol: string
  isGuest?: boolean
  isDiagnosticsLocked?: boolean
  isCompensationLocked?: boolean
  hasDiagnostics?: boolean
  hasCompensation?: boolean
  isArchive?: boolean
}>()

const { t } = useI18n()
const showDiagnosticModal = defineModel<boolean>("showDiagnosticModal", { default: false })
const showCompensationModal = defineModel<boolean>("showCompensationModal", { default: false })
const diagnosticAction = defineModel<"requestDiagnostic" | null>("diagnosticAction", {
  default: null,
})

const emit = defineEmits<{
  (e: "requestDiagnostic" | "requestCompensation" | "goToDiagnostic" | "requestVideo"): void
}>()
</script>

<style module>
.block {
  @apply mt-8 bg-white border border-gray-200 rounded-xl p-6;
}

.diagnosticLocked {
   @apply mt-8;
}
</style>
