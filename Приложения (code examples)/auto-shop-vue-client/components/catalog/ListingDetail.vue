<template>
  <div>
    <div
      v-if="isListingHidden"
      class="my-8"
    >
      <h1
        :class="$style.pageTitle"
        class="mb-6"
      >
        {{ car?.title ?? t('catalog.detail.car_not_available') }}
      </h1>

      <UiWarningBlock
        :title="t('catalog.detail.sold_title')"
        kind="danger"
        :show-icon="true"
      >
        <div class="flex flex-col gap-4">
          <p>{{ t('catalog.detail.sold_description') }}</p>
          <NuxtLink :to="actualListingsRoute">
            <Button kind="blue">
              {{ t('catalog.detail.show_actual') }}
            </Button>
          </NuxtLink>
        </div>
      </UiWarningBlock>

      <div
        v-if="similarCars?.length"
        class="mt-8"
      >
        <Similar
          :cars="similarCars"
          container-class="grid grid-cols-1 xl:grid-cols-4 lg:grid-cols-3 md:grid-cols-2 gap-6"
        >
          <template #header>
            <h2 class="text-2xl font-bold mb-6">
              {{ t('catalog.detail.similar_cars_title') }}
            </h2>
          </template>
        </Similar>
      </div>
    </div>

    <div v-else>
      <div
        v-if="$slots.topActions"
        :class="$style.topButtons"
      >
        <slot name="topActions" />
      </div>

      <div :class="$style.layout">
        <div :class="$style.left">
          <ImagesAndVideos
            :show-video-modal="showVideoRequestModal"
            :car="car"
            :listing-id="listingId"
            :is-guest="isGuest"
            :has-videos="hasVideos"
            :is-videos-locked="isVideosLocked"
            :is-photos-locked="isPhotosLocked"
            :is-nameplates-locked="isNameplatesLocked"
            @update:show-video-modal="$emit('update:showVideoRequestModal', $event)"
            @request-video-submit="$emit('request-video-submit')"
            @locked-click="$emit('locked-click')"
          />
        </div>

        <div :class="$style.right">
          <h1 :class="$style.pageTitle">
            {{ car?.title ?? '' }}
          </h1>
          <div
            v-if="showSaleStatusBadge"
            :class="$style.statusLabels"
          >
            <Label
              :text="saleStatusBadgeText"
              kind="black"
            />
          </div>
          <div :class="$style.pageSubtitle">
            <ListingDescription
              :parts="car?.descriptionParts"
              :fallback="car?.description ?? ''"
            />
          </div>

          <div
            v-if="!isAnonymousDomain || !!car?.price"
            :class="$style.priceBlockRow"
          >
            <div :class="$style.priceBlock">
              <div :class="$style.priceLabel">
                {{ t('catalog.detail.china_price_label') }}
              </div>
              <div
                v-if="car?.price && !isPriceLocked"
                :class="$style.priceValue"
              >
                {{ formatPriceWithOptionalDecimals(car?.price ?? 0) }}&nbsp;<span>{{ yuanSymbol }}</span>
              </div>
              <AuthLockInline
                v-else-if="isPriceLocked"
                size="lg"
                :class="$style.priceLocked"
              />
              <div
                v-else
                :class="$style.priceLocked"
              >
                <div :class="$style.fakePriceLine" />
              </div>
            </div>
            <div
              v-if="(!isGuest || isPublicGuest) && showArchiveSensitiveBlocks && $slots.priceActions"
              :class="$style.priceActions"
            >
              <slot name="priceActions" />
            </div>
          </div>

          <slot name="bookingBlock" />

          <ParamsAndDiagnostics
            :show-diagnostic-modal="showDiagnosticModal"
            :show-compensation-modal="showCompensationModal"
            :car="car"
            :listing-id="listingId"
            :currency-symbol="yuanSymbol"
            :is-guest="isGuest"
            :is-diagnostics-locked="isDiagnosticsLocked"
            :is-compensation-locked="isCompensationLocked"
            :has-diagnostics="hasDiagnostics"
            :has-compensation="hasCompensation"
            :is-archive="hideArchiveSensitiveBlocks"
            @update:show-diagnostic-modal="$emit('update:showDiagnosticModal', $event)"
            @update:show-compensation-modal="$emit('update:showCompensationModal', $event)"
            @request-diagnostic="$emit('request-diagnostic')"
            @request-compensation="$emit('request-compensation')"
            @go-to-diagnostic="$emit('go-to-diagnostic')"
            @request-video="$emit('open-video-modal')"
          />

          <DeliveryInfo
            v-if="showArchiveSensitiveBlocks && (!isAnonymousDomain || hasCalculations)"
            :selected-port="selectedPort"
            :location-name="car?.location_name ?? ''"
            :delivery-ports="deliveryPorts"
            :calc-result="calcResult"
            :currency-symbol="yuanSymbol"
            :is-guest="isGuest"
            :has-calculations="hasCalculations"
            @update:selected-port="$emit('update:selectedPort', $event)"
          />

          <div
            v-if="showArchiveSensitiveBlocks"
            :class="$style.publishedInfo"
          >
            {{ t('catalog.detail.published') }}: {{ car?.published_at ?? '' }}
          </div>
        </div>
      </div>

      <div
        v-if="similarCars?.length"
        class="w-full mt-8"
      >
        <hr class="mb-4">
        <Similar
          :cars="similarCars"
          container-class="grid grid-cols-1 xl:grid-cols-4 lg:grid-cols-3 md:grid-cols-2 gap-6"
        >
          <template #header>
            <h2 class="text-2xl font-bold mb-6">
              {{ t('catalog.detail.similar_cars_title') }}
            </h2>
          </template>
        </Similar>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { computed } from "vue"
import { storeToRefs } from "pinia"
import { useUserStore } from "@/stores/user"
import Button from "@/components/common/Button.vue"
import Label from "@/components/common/Label.vue"
import UiWarningBlock from "@/components/ui/UiWarningBlock.vue"
import Similar from "@/components/catalog/Similar.vue"
import ImagesAndVideos from "@/components/catalog/ImagesAndVideos.vue"
import AuthLockInline from "@/components/common/AuthLockInline.vue"
import ParamsAndDiagnostics from "@/components/catalog/ParamsAndDiagnostics.vue"
import DeliveryInfo from "@/components/catalog/DeliveryInfo.vue"
import { useMoney } from "@/composables/useMoney"
import type { ShortListingNullable } from "~/types/responses/listing"
import type { OptionBase } from "~/types/form/optionType"
import ListingDescription from "@/components/catalog/ListingDescription.vue"
import { SaleStatusBooked, SaleStatusSold, SaleStatusWithdrawn } from "@/constants/catalog"

interface Props {
  car: ShortListingNullable
  listingId: number
  isListingHidden?: boolean
  isGuest?: boolean
  isPublicGuest?: boolean
  similarCars?: any[]
  showVideoRequestModal: boolean
  showDiagnosticModal: boolean
  showCompensationModal: boolean
  selectedPort: string
  deliveryPorts: OptionBase[]
  calcResult: {
    cost: number
    chinaExpenses: number
    deliveryCost: number
    total: number
    deliveryPort: string
  }
  yuanSymbol: string
}
const props = defineProps<Props>()

defineEmits<{
  (e: "update:showVideoRequestModal" | "update:showDiagnosticModal" | "update:showCompensationModal", value: boolean): void
  (e: "update:selectedPort", value: string): void
  (e: "request-video-submit" | "request-diagnostic" | "request-compensation" | "go-to-diagnostic" | "open-video-modal" | "locked-click"): void
}>()

const { t } = useI18n()
const { formatPriceWithOptionalDecimals } = useMoney()
const { isAnySeller } = storeToRefs(useUserStore())

const actualListingsRoute = computed(() =>
  isAnySeller.value ? { name: "personal-listings" } : { name: "catalog" },
)

const hasVideos = computed(() => props.car?.has_video === true || (props.car?.videos && props.car.videos.length > 0))
const hasDiagnostics = computed(() => props.car?.has_diagnostics === true || !!props.car?.diagnostics)
const hasCompensation = computed(() => props.car?.has_compensation === true)

const { isAnonymousDomain } = useShareDomain()

const isPriceLocked = computed(() => props.car?.price_locked === true)
const hasCalculations = computed(() => !!props.car?.calculations)
const isVideosLocked = computed(() => props.car?.videos_locked === true)
const isDiagnosticsLocked = computed(() => props.car?.diagnostics_locked === true)
const isCompensationLocked = computed(() => props.car?.compensation_locked === true)
const isPhotosLocked = computed(() => props.car?.photos_locked === true)
const isNameplatesLocked = computed(() => props.car?.nameplates_locked === true)

const hideArchiveSensitiveBlocks = computed(() => {
  return !!props.car?.is_archive && !props.car?.can_view_archive_details
})

const showArchiveSensitiveBlocks = computed(() => !hideArchiveSensitiveBlocks.value)

const isWithdrawnListing = computed(() => props.car?.sale_status === SaleStatusWithdrawn)

const showSaleStatusBadge = computed(() => {
  const status = props.car?.sale_status
  if (!status) {
    return false
  }
  if (status === SaleStatusSold || status === SaleStatusWithdrawn) {
    return true
  }

  return !!props.car?.is_archive && status === SaleStatusBooked
})

const saleStatusBadgeText = computed(() =>
  isWithdrawnListing.value ? t("catalog.list.withdrawn") : t("catalog.list.sold"),
)
</script>

<style module>
.topButtons {
  @apply flex-col gap-2 items-stretch mb-4 md:flex md:flex-row md:gap-4 md:justify-end md:mb-6;
}
.layout {
  @apply flex flex-col md:flex-row gap-8;
}
.left {
  @apply w-full md:w-1/3 md:max-w-[420px];
}
.right {
  @apply w-full md:w-2/3;
}
.pageTitle {
  @apply text-3xl font-extrabold;
}
.statusLabels {
  @apply flex flex-wrap gap-1.5 mt-3;
}
.pageSubtitle {
  @apply text-base text-black mt-2;
}
.priceBlockRow {
  @apply flex flex-col lg:flex-row lg:items-end lg:gap-6 mt-6 w-full;
}
.priceBlock {
  @apply w-full lg:flex-1;
}
.priceActions {
  @apply flex flex-wrap items-center gap-2 mt-4 lg:mt-0 w-full lg:w-auto mb-1;
}
.priceLabel {
  @apply text-base text-gray-500 mb-0;
}
.priceValue {
  @apply text-xl font-extrabold text-black flex items-center;
}
.publishedInfo {
  @apply text-gray-500 text-sm text-right mt-2;
}
.priceLocked {
   @apply flex items-center mt-2;
}
.fakePriceLine {
   @apply h-6 w-32 bg-gray-200 rounded;
}
</style>
