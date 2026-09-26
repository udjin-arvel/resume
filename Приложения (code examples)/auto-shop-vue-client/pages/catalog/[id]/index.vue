<template>
  <ListingDetail
    v-model:show-video-request-modal="showVideoRequestModal"
    v-model:show-diagnostic-modal="showDiagnosticModal"
    v-model:show-compensation-modal="showCompensationModal"
    v-model:selected-port="selectedPort"
    :car="car"
    :listing-id="numericListingId"
    :is-listing-hidden="isListingHidden"
    :is-guest="isGuestMode"
    :is-public-guest="isPublicGuest"
    :similar-cars="similarCars"
    :delivery-ports="deliveryPorts"
    :calc-result="calcResult"
    :yuan-symbol="yuanSymbol"
    @request-video-submit="onVideoRequestSubmitted"
    @request-diagnostic="handleRequestDiagnosticSubmit"
    @request-compensation="handleRequestCompensationSubmit"
    @go-to-diagnostic="handleGoToDiagnostic"
    @open-video-modal="handleOpenVideoModal"
    @locked-click="goToLogin"
  >
    <template
      v-if="!isSharedLinkMode && (!isGuestMode || isPublicGuest)"
      #topActions
    >
      <div :class="$style.relativeBlock">
        <Button
          kind="white"
          :class="$style.button"
          @click="isPublicGuest ? goToLogin() : router.push(addNeedRoute)"
        >
          {{ t('catalog.detail.search_request_btn') }}
        </Button>
      </div>

      <ShareLinkPopover
        v-if="!isPublicGuest"
        :loading="isGeneratingLink"
        :last-generated-share="lastGeneratedShare"
        :link-duration-options="linkDurationOptions"
        @generate="handleGenerateLink"
      />
    </template>

    <template #priceActions>
      <div
        v-if="isPublicGuest"
        :class="$style.priceActionsRow"
      >
        <FavoriteButton
          :listing-id="numericListingId"
          :is-favorited="false"
        />
        <Button
          kind="blue"
          :class="$style.priceActionBtn"
          @click="goToLogin"
        >
          {{ t('actions.reserve_for_purchase') }}
        </Button>
        <Button
          kind="grey"
          :class="$style.priceActionBtn"
          @click="goToLogin"
        >
          <ChatBubbleOvalLeftIcon :class="$style.icon" />
          {{ t('actions.write_to_chat') }}
        </Button>
      </div>
      <div
        v-else-if="showFavoriteButton || (isBuyer && !isSharedLinkMode)"
        :class="$style.priceActionsRow"
      >
        <FavoriteButton
          v-if="showFavoriteButton"
          :listing-id="numericListingId"
          :is-favorited="isFavorited"
          @change="onFavoriteChange"
        />
        <Button
          v-if="isBuyer && !isSharedLinkMode && !hideReserveButton"
          kind="blue"
          :class="$style.priceActionBtn"
          :disabled="isBookingDisabled"
          :title="bookingDisabledTitle"
          @click="handleReserveClick"
        >
          {{ t('actions.reserve_for_purchase') }}
        </Button>
        <Button
          v-else-if="isBuyer && !isSharedLinkMode && hideReserveButton && showBookingSuccess && bookingStatus !== 'confirmed'"
          kind="white"
          :class="$style.priceActionBtn"
          @click="handleCancelBooking"
        >
          {{ t('actions.cancel_booking') }}
        </Button>
        <Button
          v-else-if="isBuyer && !isSharedLinkMode && showBookingSuccess && bookingStatus === 'confirmed'"
          kind="white"
          :class="$style.priceActionBtn"
          @click="handleProceedToPurchase"
        >
          {{ t('catalog.detail.proceed_to_purchase') }}
        </Button>

        <ToChat
          v-if="isBuyer && !isSharedLinkMode"
          type="listing"
          :listing-id="numericListingId"
          :buyer-id="currentUserId ?? undefined"
          :seller-id="car?.user_id ?? undefined"
        >
          <template #default="{ chatLoading, clickDisabled, goToChat }">
            <Button
              kind="grey"
              :class="$style.priceActionBtn"
              :disabled="clickDisabled"
              :aria-busy="chatLoading || undefined"
              @click="goToChat"
            >
              <ChatBubbleOvalLeftIcon :class="$style.icon" />
              <span v-if="!chatLoading">{{ t('actions.write_to_chat') }}</span>
              <span v-else>{{ t('common.loading') }}</span>
            </Button>
          </template>
        </ToChat>
      </div>
    </template>

    <template #bookingBlock>
      <BookingWarning
        v-if="isBuyer"
        v-model:show-confirmation="showBookingConfirmation"
        v-model:show-warning="showBookingWarning"
        :show-booking-success="showBookingSuccess"
        :has-videos="hasVideos"
        :has-diagnostics="hasDiagnostics"
        :has-compensation="hasCompensation"
        :queue-position="bookingQueuePosition"
        :booking-status="bookingStatus"
        :is-submitting="isBookingSubmitting"
        :alert="bookingAlert"
        :selection-refresh-key="bookingSelectionRefreshKey"
        @confirm="onBookingConfirm"
        @cancel="hideWarning"
        @request-video="handleOpenVideoModal"
        @request-diagnostic="handleOpenDiagnosticModal"
        @request-compensation="handleOpenCompensationModal"
        @proceed-to-purchase="handleProceedToPurchase"
      />
    </template>
  </ListingDetail>
</template>

<script setup lang="ts">
import { ChatBubbleOvalLeftIcon } from "@heroicons/vue/24/outline"
import dayjs from "dayjs"
import "dayjs/locale/ru"
import "dayjs/locale/zh-cn"
import { ref, computed, onMounted } from "vue"
import { storeToRefs } from "pinia"
import { useI18n } from "vue-i18n"
import { useRouter, useRoute, createError, useSeoMeta } from "#imports"
import ListingDetail from "@/components/catalog/ListingDetail.vue"
import FavoriteButton from "@/components/catalog/FavoriteButton.vue"
import Button from "@/components/common/Button.vue"
import ShareLinkPopover from "@/components/catalog/ShareLinkPopover.vue"
import BookingWarning from "@/components/catalog/BookingWarning.vue"
import ToChat from "@/components/chat/ToChat.vue"
import currency from "@/lang/ru/currency.json"
import useListing from "@/composables/useListing"
import { useBreadcrumbStore } from "@/stores/breadcrumb"
import { PowerTypeHybrid } from "~/constants/cars"
import usePorts from "@/composables/usePorts"
import type { ShortListingNullable, ListingFull, ParamPair, TranslatableParamValue } from "~/types/responses/listing"
import { useUserStore } from "@/stores/user"
import { RequestTypeBooking } from "@/constants/listingRequests"
import { useSharedLink } from "@/composables/useSharedLink"
import { useShareDomain } from "@/composables/useShareDomain"
import { useListingRequest } from "@/composables/useListingRequest"
import { buildListingSeoTitle, resolveListingShareImage } from "@/utils/listingSharePreview"
import { useApiListingRequest } from "@/composables/api/useApiListingRequest"
import type { ListingRequest } from "@/types/responses/listingRequest"

const router = useRouter()
const config = useRuntimeConfig()
const { isAnonymousDomain, isShareDomain } = useShareDomain()
const userStore = useUserStore()
const { currentUserId, isBuyer, isAuthenticated, isAdmin, isDirector, isEmployee } = storeToRefs(userStore)
const { updateBreadcrumb } = useBreadcrumbStore()
const { locale: currentLocale } = useI18n()
const yuanSymbol = currency.CNY_symbol
const { showPublic, buildShort, getSharedListing } = useListing()
const { t } = useI18n()
const route = useRoute()

const routeParam = route.params.id as string
const isSharedLinkMode = isNaN(Number(routeParam))

const numericListingId = computed(() => {
  return isSharedLinkMode ? (car.value?.id ?? 0) : Number(routeParam)
})

const isGuestMode = computed(() => isSharedLinkMode || !isAuthenticated.value)

const { goToLogin } = useLoginRedirect()

const isPublicGuest = computed(() => {
  return !isSharedLinkMode && !isShareDomain.value && !isAuthenticated.value
})

const showFavoriteButton = computed(() => {
  return !isGuestMode.value && (isAdmin.value || isDirector.value || isEmployee.value)
})

const addNeedRoute = computed(() => ({
  path: "/personal/needs/create",
  query: {
    brand_id: fetchedListing.value?.brand.id,
    series_id: fetchedListing.value?.series.id,
  },
}))

const { data: fetchedListing, error } = await useAsyncData(
  `listing-${routeParam}`,
  async () => {
    let listing: ListingFull | null | undefined

    if (isSharedLinkMode) {
      listing = await getSharedListing(routeParam)
      if (!listing) {
        throw createError({ statusCode: 404, statusMessage: "Listing not found or expired" })
      }
    }
    else {
      listing = await showPublic(Number(routeParam))
      if (!listing) {
        throw createError({ statusCode: 404, statusMessage: "Listing not found" })
      }
    }

    return listing
  },
  { server: true },
)

if (error.value) {
  if (error.value.statusCode === 410) {
    throw createError({ statusCode: 410 })
  }

  throw createError({ statusCode: 404, statusMessage: "Page not found" })
}

const isFavorited = ref(!!fetchedListing.value?.is_favorited)

function onFavoriteChange(value: boolean) {
  isFavorited.value = value
}

type TranslateFn = (key: string) => string

const translateIfExists = (key: string, value?: string | null): string => {
  if (!value || !t(`${key}.${value}`) || t(`${key}.${value}`) === `${key}.${value}`) {
    return value ?? ""
  }
  return t(`${key}.${value}`)
}

const formatUnit = (v: string | number | null | undefined, unit: string) =>
  v == null || v === "" ? "" : `${v} ${unit}`

const get = (obj: unknown, path: string): string => {
  return path.split(".").reduce<any>((o, key) => (o ? o[key as keyof typeof o] : undefined), obj) ?? ""
}

const getFlag = (obj: unknown, path: string): boolean => {
  return path.split(".").reduce<any>((o, key) => (o ? o[key as keyof typeof o] : undefined), obj) === true
}

function getMonthLabel(value?: string | null): string {
  if (value == null) {
    return ""
  }
  const idx = Number(value)
  if (!idx || idx < 1 || idx > 12) {
    return ""
  }
  const loc = currentLocale.value === "zh" ? "zh-cn" : currentLocale.value || "ru"
  return dayjs().locale(loc).month(idx - 1).format("MMMM")
}

interface ParamCfg { nameKey: string, field?: string, getter?: (l: ListingFull, t: TranslateFn) => string, dictKey?: string, unitKey?: string, hybridField?: string, lockedField?: string }
interface GroupCfg { headerKey?: string, params: ParamCfg[] }

const groups: GroupCfg[] = [
  // Базовые параметры (без группы)
  {
    params: [
      { nameKey: "catalog.detail.brand", field: "car.brand_name" },
      { nameKey: "catalog.detail.model", field: "car.model_name" },
      { nameKey: "catalog.detail.equipment", field: "car.name" },
      { nameKey: "listing.additional_options", field: "options" },
      {
        nameKey: "catalog.detail.mileage",
        getter: (l, t) => l.mileage ? `${new Intl.NumberFormat("ru-RU").format(l.mileage)} ${t("catalog.list.km")}` : "",
      },
      { nameKey: "catalog.detail.displacement", field: "car.displacement" },
      { nameKey: "catalog.detail.power_type", field: "car.short_power_type", dictKey: "cars.power_type", hybridField: "car.short_power_type" },
      { nameKey: "catalog.detail.common_gearbox", field: "car.common_short_gearbox", dictKey: "cars.gearbox" },
      { nameKey: "catalog.detail.chassis_driven_type", field: "car.chassis_driven_type" },
      { nameKey: "catalog.detail.engine_zdml", field: "car.engine_zdml", unitKey: "catalog.detail.hp" },
      { nameKey: "catalog.detail.gearbox", field: "car.gearbox", dictKey: "cars.gearbox" },
      { nameKey: "catalog.detail.drive_type", field: "car.drive_type", dictKey: "cars.drive_type" },
      { nameKey: "catalog.detail.year", field: "release_year" },
      {
        nameKey: "catalog.detail.month",
        lockedField: "month_locked",
        getter: (l) => {
          const m = l?.month
          return getMonthLabel(m != null ? String(m) : "")
        },
      },
      { nameKey: "catalog.detail.vin", field: "vin", lockedField: "vin_locked" },
      { nameKey: "catalog.detail.color", field: "body_color", dictKey: "cars.colors" },
      { nameKey: "catalog.detail.stop_date", field: "car.stop_date" },
      { nameKey: "catalog.detail.effluent_standard", field: "car.effluent_standard" },
      { nameKey: "catalog.detail.displacement_ml", field: "car.displacement_ml", unitKey: "catalog.detail.ml" },
      { nameKey: "catalog.detail.gearbox_number", field: "car.gearbox_number" },
      { nameKey: "catalog.detail.engine_type", field: "car.engine" }, // повтор, но как в оригинале
    ],
  },

  // Общие параметры
  {
    headerKey: "catalog.detail.common_group_title",
    params: [
      { nameKey: "catalog.detail.common_kcsj", field: "car.common_kcsj", unitKey: "catalog.detail.sec" },
      { nameKey: "catalog.detail.common_mcsj", field: "car.common_mcsj", unitKey: "catalog.detail.sec" },
      { nameKey: "catalog.detail.common_kcdlbfb", field: "car.common_kcdlbfb", unitKey: "%" },
      { nameKey: "catalog.detail.common_zdgl", field: "car.common_zdgl", unitKey: "catalog.detail.kw" },
      { nameKey: "catalog.detail.common_zdnj", field: "car.common_zdnj", unitKey: "catalog.detail.nm" },
      { nameKey: "catalog.detail.common_ddj", field: "car.common_ddj" },
      { nameKey: "catalog.detail.common_size", field: "car.common_size" },
      { nameKey: "catalog.detail.scale", field: "car.scale", dictKey: "cars.scale_type" },
      { nameKey: "catalog.detail.common_zgcs", field: "car.common_zgcs", unitKey: "catalog.detail.km_h" },
      { nameKey: "catalog.detail.common_gfjs", field: "car.common_gfjs" },
      { nameKey: "catalog.detail.common_scjs", field: "car.common_scjs" },
      { nameKey: "catalog.detail.common_sczd", field: "car.common_sczd" },
      { nameKey: "catalog.detail.common_scxhlc", field: "car.common_scxhlc", unitKey: "catalog.detail.km" },
      { nameKey: "catalog.detail.common_sckcsj", field: "car.common_sckcsj", unitKey: "catalog.detail.hr" },
      { nameKey: "catalog.detail.common_scmcsj", field: "car.common_scmcsj", unitKey: "catalog.detail.hr" },
      { nameKey: "catalog.detail.common_nedczhyh", field: "car.common_nedczhyh", unitKey: "catalog.detail.l_100km" },
      { nameKey: "catalog.detail.common_wltczhyh", field: "car.common_wltczhyh", unitKey: "catalog.detail.l_100km" },
      { nameKey: "catalog.detail.common_zdhdztyh", field: "car.common_zdhdztyh", unitKey: "catalog.detail.l_100km" },
      { nameKey: "catalog.detail.common_scyh", field: "car.common_scyh", unitKey: "catalog.detail.l_100km" },
    ],
  },

  // Коробка передач
  {
    headerKey: "catalog.detail.gearbox_group_title",
    params: [
      { nameKey: "catalog.detail.gearbox_body_gearbox", field: "car.gearbox_body_gearbox" },
      { nameKey: "catalog.detail.gearbox_body_gearnum", field: "car.gearbox_body_gearnum" },
      { nameKey: "catalog.detail.gearbox_body_geartype", field: "car.gearbox_body_geartype" },
      { nameKey: "catalog.detail.gearbox_body_geartypejc", field: "car.gearbox_body_geartypejc" },
    ],
  },

  // Кузов (gearbox_body)
  {
    headerKey: "catalog.detail.gearbox_body_group_title",
    params: [
      { nameKey: "catalog.detail.gearbox_body_length", field: "car.gearbox_body_length", unitKey: "catalog.detail.mm" },
      { nameKey: "catalog.detail.gearbox_body_width", field: "car.gearbox_body_width", unitKey: "catalog.detail.mm" },
      { nameKey: "catalog.detail.gearbox_body_high", field: "car.gearbox_body_high", unitKey: "catalog.detail.mm" },
      { nameKey: "catalog.detail.gearbox_body_wheelbase", field: "car.gearbox_body_wheelbase", unitKey: "catalog.detail.mm" },
      { nameKey: "catalog.detail.gearbox_body_trackfront", field: "car.gearbox_body_trackfront", unitKey: "catalog.detail.mm" },
      { nameKey: "catalog.detail.gearbox_body_trackrear", field: "car.gearbox_body_trackrear", unitKey: "catalog.detail.mm" },
      { nameKey: "catalog.detail.gearbox_body_jjj", field: "car.gearbox_body_jjj", unitKey: "catalog.detail.mm" },
      { nameKey: "catalog.detail.gearbox_body_lqj", field: "car.gearbox_body_lqj", unitKey: "catalog.detail.mm" },
      { nameKey: "catalog.detail.gearbox_body_zxldjx", field: "car.gearbox_body_zxldjx" },
      { nameKey: "catalog.detail.gearbox_body_cms", field: "car.gearbox_body_cms" },
      { nameKey: "catalog.detail.gearbox_body_zws", field: "car.gearbox_body_zws" },
      { nameKey: "catalog.detail.gearbox_body_yxrj", field: "car.gearbox_body_yxrj", unitKey: "catalog.detail.l" },
      { nameKey: "catalog.detail.gearbox_body_xlxrj", field: "car.gearbox_body_xlxrj", unitKey: "catalog.detail.l" },
      { nameKey: "catalog.detail.gearbox_body_full_weight", field: "car.gearbox_body_full_weight", unitKey: "catalog.detail.kg" },
      { nameKey: "catalog.detail.gearbox_body_full_weight_max", field: "car.gearbox_body_full_weight_max", unitKey: "catalog.detail.kg" },
    ],
  },

  // Двигатель
  {
    headerKey: "catalog.detail.engine_group_title",
    params: [
      { nameKey: "catalog.detail.engine_engine_model", field: "car.engine_engine_model" },
      { nameKey: "catalog.detail.engine_displacement_ml", field: "car.engine_displacement_ml", unitKey: "catalog.detail.ml" },
      { nameKey: "catalog.detail.engine_displacement", field: "car.engine_displacement" },
      { nameKey: "catalog.detail.engine_jqxs", field: "car.engine_jqxs" },
      { nameKey: "catalog.detail.engine_fdjbj", field: "car.engine_fdjbj" },
      { nameKey: "catalog.detail.engine_qgplxs", field: "car.engine_qgplxs" },
      { nameKey: "catalog.detail.engine_qfs", field: "car.engine_qfs" },
      { nameKey: "catalog.detail.engine_mgqms", field: "car.engine_mgqms" },
      { nameKey: "catalog.detail.engine_ysb", field: "car.engine_ysb" },
      { nameKey: "catalog.detail.engine_pqjg", field: "car.engine_pqjg" },
      { nameKey: "catalog.detail.engine_gj", field: "car.engine_gj" },
      { nameKey: "catalog.detail.engine_xc", field: "car.engine_xc" },
      { nameKey: "catalog.detail.engine_zdgl", field: "car.engine_zdgl" }, // без unit, как в оригинале
      { nameKey: "catalog.detail.engine_zdglzs", field: "car.engine_zdglzs" },
      { nameKey: "catalog.detail.engine_zdnj", field: "car.engine_zdnj" },
      { nameKey: "catalog.detail.engine_zdnjzs", field: "car.engine_zdnjzs" },
      { nameKey: "catalog.detail.engine_zdjgl", field: "car.engine_zdjgl", unitKey: "catalog.detail.kw" },
      { nameKey: "catalog.detail.engine_ryxh", field: "car.engine_ryxh", unitKey: "catalog.detail.g_kwth" },
      { nameKey: "catalog.detail.engine_gyfs", field: "car.engine_gyfs" },
      { nameKey: "catalog.detail.engine_ggcl", field: "car.engine_ggcl" },
      { nameKey: "catalog.detail.engine_gtcl", field: "car.engine_gtcl" },
    ],
  },

  // Электрика
  {
    headerKey: "catalog.detail.electric_group_title",
    params: [
      { nameKey: "catalog.detail.electric_djlx", field: "car.electric_djlx" },
      { nameKey: "catalog.detail.electric_ddjzgl", field: "car.electric_ddjzgl", unitKey: "catalog.detail.kw" },
      { nameKey: "catalog.detail.electric_ddjznj", field: "car.electric_ddjznj", unitKey: "catalog.detail.nm" },
      { nameKey: "catalog.detail.electric_qddjzdgl", field: "car.electric_qddjzdgl", unitKey: "catalog.detail.kw" },
      { nameKey: "catalog.detail.electric_qddjzdnj", field: "car.electric_qddjzdnj", unitKey: "catalog.detail.nm" },
      { nameKey: "catalog.detail.electric_hddzdgl", field: "car.electric_hddzdgl", unitKey: "catalog.detail.kw" },
      { nameKey: "catalog.detail.electric_hdjzdnj", field: "car.electric_hdjzdnj", unitKey: "catalog.detail.nm" },
      { nameKey: "catalog.detail.electric_ztzhgl", field: "car.electric_ztzhgl", unitKey: "catalog.detail.kw" },
      { nameKey: "catalog.detail.electric_xtzhnj", field: "car.electric_xtzhnj", unitKey: "catalog.detail.nm" },
      { nameKey: "catalog.detail.electric_qddjs", field: "car.electric_qddjs" },
      { nameKey: "catalog.detail.electric_djbj", field: "car.electric_djbj" },
      { nameKey: "catalog.detail.electric_dclx", field: "car.electric_dclx" },
      { nameKey: "catalog.detail.electric_dxpp", field: "car.electric_dxpp" },
      { nameKey: "catalog.detail.electric_gxbcdxhlc", field: "car.electric_gxbcdxhlc", unitKey: "catalog.detail.km" },
      { nameKey: "catalog.detail.electric_dcnl", field: "car.electric_dcnl", unitKey: "catalog.detail.kwh" },
      { nameKey: "catalog.detail.electric_bglhdl", field: "car.electric_bglhdl", unitKey: "catalog.detail.ah" },
      { nameKey: "catalog.detail.electric_kcgl", field: "car.electric_kcgl", unitKey: "catalog.detail.kw" },
      { nameKey: "catalog.detail.electric_dczzb", field: "car.electric_dczzb" },
      { nameKey: "catalog.detail.electric_kcsj", field: "car.electric_kcsj", unitKey: "catalog.detail.hr" },
      { nameKey: "catalog.detail.electric_mcsj", field: "car.electric_mcsj", unitKey: "catalog.detail.hr" },
      { nameKey: "catalog.detail.electric_kcdl", field: "car.electric_kcdl", unitKey: "catalog.detail.kwh" },
      { nameKey: "catalog.detail.electric_cltc_xhlc", field: "car.electric_cltc_xhlc", unitKey: "catalog.detail.km" },
      { nameKey: "catalog.detail.electric_nedc_xhlc", field: "car.electric_nedc_xhlc", unitKey: "catalog.detail.km" },
    ],
  },

  // Шасси
  {
    headerKey: "catalog.detail.chassis_group_title",
    params: [
      { nameKey: "catalog.detail.chassis_number", field: "car.chassis_number", lockedField: "chassis_number_locked" },
      { nameKey: "catalog.detail.chassis_four_drive_form", field: "car.chassis_four_drive_form" },
      { nameKey: "catalog.detail.chassis_csqjg", field: "car.chassis_csqjg" },
      { nameKey: "catalog.detail.chassis_front_suspension_type", field: "car.chassis_front_suspension_type" },
      { nameKey: "catalog.detail.chassis_rear_suspension_type", field: "car.chassis_rear_suspension_type" },
      { nameKey: "catalog.detail.chassis_steering_type", field: "car.chassis_steering_type" },
      { nameKey: "catalog.detail.chassis_body_type", field: "car.chassis_body_type" },
      { nameKey: "catalog.detail.chassis_short_drive_type", field: "car.chassis_short_drive_type" },
    ],
  },

  // Колёса
  {
    headerKey: "catalog.detail.wheel_group_title",
    params: [
      { nameKey: "catalog.detail.wheel_front_brake_type", field: "car.wheel_front_brake_type" },
      { nameKey: "catalog.detail.wheel_rear_brake_type", field: "car.wheel_rear_brake_type" },
      { nameKey: "catalog.detail.wheel_parking_brake_type", field: "car.wheel_parking_brake_type" },
      { nameKey: "catalog.detail.wheel_front_tyre_size", field: "car.wheel_front_tyre_size" },
      { nameKey: "catalog.detail.wheel_rear_tyre_size", field: "car.wheel_rear_tyre_size" },
      { nameKey: "catalog.detail.wheel_spare_tyre_size", field: "car.wheel_spare_tyre_size" },
    ],
  },

  // Полный привод
  {
    headerKey: "catalog.detail.four_wheel_group_title",
    params: [
      { nameKey: "catalog.detail.four_wheel_drive_kbxj", field: "car.four_wheel_drive_kbxj" },
      { nameKey: "catalog.detail.four_wheel_drive_kqxj", field: "car.four_wheel_drive_kqxj" },
      { nameKey: "catalog.detail.four_wheel_drive_dcgyxj", field: "car.four_wheel_drive_dcgyxj" },
      { nameKey: "catalog.detail.four_wheel_drive_zycsqsz", field: "car.four_wheel_drive_zycsqsz" },
      { nameKey: "catalog.detail.four_wheel_drive_zdzx", field: "car.four_wheel_drive_zdzx" },
      { nameKey: "catalog.detail.four_wheel_drive_xhcsq", field: "car.four_wheel_drive_xhcsq" },
      { nameKey: "catalog.detail.four_wheel_drive_ssgy", field: "car.four_wheel_drive_ssgy" },
      { nameKey: "catalog.detail.four_wheel_drive_dssq", field: "car.four_wheel_drive_dssq" },
    ],
  },

  // Безопасность
  {
    headerKey: "catalog.detail.safetys_group_title",
    params: [
      { nameKey: "catalog.detail.safety_zfjsaqqn", field: "car.safety_zfjsaqqn" },
      { nameKey: "catalog.detail.safety_qhcqn", field: "car.safety_qhcqn" },
      { nameKey: "catalog.detail.safety_qhtbqn", field: "car.safety_qhtbqn" },
      { nameKey: "catalog.detail.safety_xbqn", field: "car.safety_xbqn" },
      { nameKey: "catalog.detail.safety_fjszdqn", field: "car.safety_fjszdqn" },
      { nameKey: "catalog.detail.safety_qpzjqn", field: "car.safety_qpzjqn" },
      { nameKey: "catalog.detail.safety_hpaqdsqn", field: "car.safety_hpaqdsqn" },
      { nameKey: "catalog.detail.safety_hpzyfxhqn", field: "car.safety_hpzyfxhqn" },
      { nameKey: "catalog.detail.safety_hpzyaqqn", field: "car.safety_hpzyaqqn" },
      { nameKey: "catalog.detail.safety_bdxrbh", field: "car.safety_bdxrbh" },
      { nameKey: "catalog.detail.safety_tyjc", field: "car.safety_tyjc" },
      { nameKey: "catalog.detail.safety_qqbqlt", field: "car.safety_qqbqlt" },
      { nameKey: "catalog.detail.safety_aqdwjts", field: "car.safety_aqdwjts" },
      { nameKey: "catalog.detail.safety_etzyjk", field: "car.safety_etzyjk" },
      { nameKey: "catalog.detail.safety_abs", field: "car.safety_abs" },
      { nameKey: "catalog.detail.safety_zdlfp", field: "car.safety_zdlfp" },
      { nameKey: "catalog.detail.safety_scfz", field: "car.safety_scfz" },
      { nameKey: "catalog.detail.safety_qylkz", field: "car.safety_qylkz" },
      { nameKey: "catalog.detail.safety_cswdkz", field: "car.safety_cswdkz" },
      { nameKey: "catalog.detail.safety_cdplyj", field: "car.safety_cdplyj" },
      { nameKey: "catalog.detail.safety_zdsc", field: "car.safety_zdsc" },
      { nameKey: "catalog.detail.safety_pljstx", field: "car.safety_pljstx" },
      { nameKey: "catalog.detail.safety_qfpzyj", field: "car.safety_qfpzyj" },
      { nameKey: "catalog.detail.safety_dljyhj", field: "car.safety_dljyhj" },
      { nameKey: "catalog.detail.safety_hfpzyj", field: "car.safety_hfpzyj" },
      { nameKey: "catalog.detail.safety_kmyj", field: "car.safety_kmyj" },
      { nameKey: "catalog.detail.safety_xzjly", field: "car.safety_xzjly" },
    ],
  },

  // Управление
  {
    headerKey: "catalog.detail.control_group_title",
    params: [
      { nameKey: "catalog.detail.control_jsmsqh", field: "car.control_jsmsqh" },
      { nameKey: "catalog.detail.control_nlhsxt", field: "car.control_nlhsxt" },
      { nameKey: "catalog.detail.control_zdzc", field: "car.control_zdzc" },
      { nameKey: "catalog.detail.control_spfz", field: "car.control_spfz" },
      { nameKey: "catalog.detail.control_dphj", field: "car.control_dphj" },
      { nameKey: "catalog.detail.control_kbzxb", field: "car.control_kbzxb" },
      { nameKey: "catalog.detail.control_dtbms", field: "car.control_dtbms" },
      { nameKey: "catalog.detail.control_fdjtq", field: "car.control_fdjtq" },
    ],
  },

  // Ассистирующее оборудование
  {
    headerKey: "catalog.detail.assisted_hardware_group_title",
    params: [
      { nameKey: "catalog.detail.assisted_driving_hardware_zcld", field: "car.assisted_driving_hardware_zcld" },
      { nameKey: "catalog.detail.assisted_driving_hardware_jsfzyx", field: "car.assisted_driving_hardware_jsfzyx" },
      { nameKey: "catalog.detail.assisted_driving_hardware_sxtsl", field: "car.assisted_driving_hardware_sxtsl" },
      { nameKey: "catalog.detail.assisted_driving_hardware_tmdp", field: "car.assisted_driving_hardware_tmdp" },
    ],
  },

  // Функции ассистента
  {
    headerKey: "catalog.detail.assisted_feature_group_title",
    params: [
      { nameKey: "catalog.detail.assisted_driving_feature_yhxt", field: "car.assisted_driving_feature_yhxt" },
      { nameKey: "catalog.detail.assisted_driving_feature_fzjsdj", field: "car.assisted_driving_feature_fzjsdj" },
      { nameKey: "catalog.detail.assisted_driving_feature_dcccyj", field: "car.assisted_driving_feature_dcccyj" },
      { nameKey: "catalog.detail.assisted_driving_feature_wxdh", field: "car.assisted_driving_feature_wxdh" },
      { nameKey: "catalog.detail.assisted_driving_feature_dhlkxx", field: "car.assisted_driving_feature_dhlkxx" },
      { nameKey: "catalog.detail.assisted_driving_feature_bxfz", field: "car.assisted_driving_feature_bxfz" },
      { nameKey: "catalog.detail.assisted_driving_feature_cdbcfz", field: "car.assisted_driving_feature_cdbcfz" },
      { nameKey: "catalog.detail.assisted_driving_feature_cdjzbc", field: "car.assisted_driving_feature_cdjzbc" },
      { nameKey: "catalog.detail.assisted_driving_feature_ysxt", field: "car.assisted_driving_feature_ysxt" },
      { nameKey: "catalog.detail.assisted_driving_feature_fzjsxt", field: "car.assisted_driving_feature_fzjsxt" },
      { nameKey: "catalog.detail.assisted_driving_feature_dljtsb", field: "car.assisted_driving_feature_dljtsb" },
      { nameKey: "catalog.detail.assisted_driving_feature_ykbc", field: "car.assisted_driving_feature_ykbc" },
      { nameKey: "catalog.detail.assisted_driving_feature_zdbc", field: "car.assisted_driving_feature_zdbc" },
      { nameKey: "catalog.detail.assisted_driving_feature_yczh", field: "car.assisted_driving_feature_yczh" },
      { nameKey: "catalog.detail.assisted_driving_feature_zdjsfzld", field: "car.assisted_driving_feature_zdjsfzld" },
    ],
  },

  // Внешние
  {
    headerKey: "catalog.detail.external_group_title",
    params: [
      { nameKey: "catalog.detail.external_lqcz", field: "car.external_lqcz" },
      { nameKey: "catalog.detail.external_ddhbx", field: "car.external_ddhbx" },
      { nameKey: "catalog.detail.external_gyhbx", field: "car.external_gyhbx" },
      { nameKey: "catalog.detail.external_ddhbxwzjy", field: "car.external_ddhbxwzjy" },
      { nameKey: "catalog.detail.external_fdjdzfs", field: "car.external_fdjdzfs" },
      { nameKey: "catalog.detail.external_cnzks", field: "car.external_cnzks" },
      { nameKey: "catalog.detail.external_yslx", field: "car.external_yslx" },
      { nameKey: "catalog.detail.external_wysqd", field: "car.external_wysqd" },
      { nameKey: "catalog.detail.external_wysjr", field: "car.external_wysjr" },
      { nameKey: "catalog.detail.external_wksjcm", field: "car.external_wksjcm" },
      { nameKey: "catalog.detail.external_ycqd", field: "car.external_ycqd" },
      { nameKey: "catalog.detail.external_dcyjr", field: "car.external_dcyjr" },
      { nameKey: "catalog.detail.external_ydwgtj", field: "car.external_ydwgtj" },
      { nameKey: "catalog.detail.external_jqgs", field: "car.external_jqgs" },
      { nameKey: "catalog.detail.external_cdxlj", field: "car.external_cdxlj" },
      { nameKey: "catalog.detail.external_ddrlb", field: "car.external_ddrlb" },
      { nameKey: "catalog.detail.external_ddxhcm", field: "car.external_ddxhcm" },
      { nameKey: "catalog.detail.external_chmxs", field: "car.external_chmxs" },
      { nameKey: "catalog.detail.external_wmbldlkq", field: "car.external_wmbldlkq" },
      { nameKey: "catalog.detail.external_ddbs", field: "car.external_ddbs" },
      { nameKey: "catalog.detail.external_ccjtp", field: "car.external_ccjtp" },
      { nameKey: "catalog.detail.external_ddkttb", field: "car.external_ddkttb" },
    ],
  },

  // Освещение
  {
    headerKey: "catalog.detail.light_group_title",
    params: [
      { nameKey: "catalog.detail.light_jgdg", field: "car.light_jgdg" },
      { nameKey: "catalog.detail.light_ygdg", field: "car.light_ygdg" },
      { nameKey: "catalog.detail.light_dgts", field: "car.light_dgts" },
      { nameKey: "catalog.detail.light_ledrjxcd", field: "car.light_ledrjxcd" },
      { nameKey: "catalog.detail.light_zsyyjg", field: "car.light_zsyyjg" },
      { nameKey: "catalog.detail.light_zdtd", field: "car.light_zdtd" },
      { nameKey: "catalog.detail.light_cqwd", field: "car.light_cqwd" },
      { nameKey: "catalog.detail.light_qddyw", field: "car.light_qddyw" },
      { nameKey: "catalog.detail.light_ddgdkt", field: "car.light_ddgdkt" },
      { nameKey: "catalog.detail.light_ddqxzz", field: "car.light_ddqxzz" },
      { nameKey: "catalog.detail.light_ddycgb", field: "car.light_ddycgb" },
      { nameKey: "catalog.detail.light_zxfzd", field: "car.light_zxfzd" },
      { nameKey: "catalog.detail.light_zxtd", field: "car.light_zxtd" },
      { nameKey: "catalog.detail.light_cmsydd", field: "car.light_cmsydd" },
      { nameKey: "catalog.detail.light_cnhjfwd", field: "car.light_cnhjfwd" },
    ],
  },

  // Стёкла/зеркала
  {
    headerKey: "catalog.detail.glass_group_title",
    params: [
      { nameKey: "catalog.detail.glass_tclx", field: "car.glass_tclx" },
      { nameKey: "catalog.detail.glass_ddcc", field: "car.glass_ddcc" },
      { nameKey: "catalog.detail.glass_ccyjsj", field: "car.glass_ccyjsj" },
      { nameKey: "catalog.detail.glass_ccfjs", field: "car.glass_ccfjs" },
      { nameKey: "catalog.detail.glass_dcgybl", field: "car.glass_dcgybl" },
      { nameKey: "catalog.detail.glass_hfdzyl", field: "car.glass_hfdzyl" },
      { nameKey: "catalog.detail.glass_hpcczyl", field: "car.glass_hpcczyl" },
      { nameKey: "catalog.detail.glass_hpcysbl", field: "car.glass_hpcysbl" },
      { nameKey: "catalog.detail.glass_cnhzj", field: "car.glass_cnhzj" },
      { nameKey: "catalog.detail.glass_hys", field: "car.glass_hys" },
      { nameKey: "catalog.detail.glass_gyys", field: "car.glass_gyys" },
      { nameKey: "catalog.detail.glass_jrpzh", field: "car.glass_jrpzh" },
      { nameKey: "catalog.detail.glass_xktc", field: "car.glass_xktc" },
      { nameKey: "catalog.detail.glass_whsj", field: "car.glass_whsj" },
      { nameKey: "catalog.detail.glass_nhsj", field: "car.glass_nhsj" },
    ],
  },

  // Интерьер
  {
    headerKey: "catalog.detail.internal_group_title",
    params: [
      { nameKey: "catalog.detail.internal_fxpcz", field: "car.internal_fxpcz" },
      { nameKey: "catalog.detail.internal_fxpwztj", field: "car.internal_fxpwztj" },
      { nameKey: "catalog.detail.internal_hdxs", field: "car.internal_hdxs" },
      { nameKey: "catalog.detail.internal_dgnfxp", field: "car.internal_dgnfxp" },
      { nameKey: "catalog.detail.internal_fxphd", field: "car.internal_fxphd" },
      { nameKey: "catalog.detail.internal_fxpjr", field: "car.internal_fxpjr" },
      { nameKey: "catalog.detail.internal_fxpjy", field: "car.internal_fxpjy" },
      { nameKey: "catalog.detail.internal_xcdnpm", field: "car.internal_xcdnpm" },
      { nameKey: "catalog.detail.internal_qyjybp", field: "car.internal_qyjybp" },
      { nameKey: "catalog.detail.internal_yjybcc", field: "car.internal_yjybcc" },
      { nameKey: "catalog.detail.internal_hudttszxs", field: "car.internal_hudttszxs" },
    ],
  },

  // Система связи
  {
    headerKey: "catalog.detail.interconnect_group_title",
    params: [
      { nameKey: "catalog.detail.interconnect_system_zkcspm", field: "car.interconnect_system_zkcspm" },
      { nameKey: "catalog.detail.interconnect_system_zkpmcc", field: "car.interconnect_system_zkpmcc" },
      { nameKey: "catalog.detail.interconnect_system_zkxpmcc", field: "car.interconnect_system_zkxpmcc" },
      { nameKey: "catalog.detail.interconnect_system_lydh", field: "car.interconnect_system_lydh" },
      { nameKey: "catalog.detail.interconnect_system_dljyhj", field: "car.interconnect_system_dljyhj" },
      { nameKey: "catalog.detail.interconnect_system_zkyjp", field: "car.interconnect_system_zkyjp" },
      { nameKey: "catalog.detail.interconnect_system_sjhl", field: "car.interconnect_system_sjhl" },
      { nameKey: "catalog.detail.interconnect_system_yysb", field: "car.interconnect_system_yysb" },
      { nameKey: "catalog.detail.interconnect_system_zcznxt", field: "car.interconnect_system_zcznxt" },
      { nameKey: "catalog.detail.interconnect_system_sskz", field: "car.interconnect_system_sskz" },
      { nameKey: "catalog.detail.interconnect_system_mmsb", field: "car.interconnect_system_mmsb" },
      { nameKey: "catalog.detail.interconnect_system_fjylp", field: "car.interconnect_system_fjylp" },
      { nameKey: "catalog.detail.interconnect_system_czds", field: "car.interconnect_system_czds" },
      { nameKey: "catalog.detail.interconnect_system_hpyjpm", field: "car.interconnect_system_hpyjpm" },
      { nameKey: "catalog.detail.interconnect_system_hpkzdmt", field: "car.interconnect_system_hpkzdmt" },
      { nameKey: "catalog.detail.interconnect_system_czcd", field: "car.interconnect_system_czcd" },
      { nameKey: "catalog.detail.interconnect_system_clw", field: "car.interconnect_system_clw" },
      { nameKey: "catalog.detail.interconnect_system_otasj", field: "car.interconnect_system_otasj" },
      { nameKey: "catalog.detail.interconnect_system_appyckz", field: "car.interconnect_system_appyckz" },
      { nameKey: "catalog.detail.interconnect_system_wifi", field: "car.interconnect_system_wifi" },
      { nameKey: "catalog.detail.interconnect_system_zdjz", field: "car.interconnect_system_zdjz" },
    ],
  },

  // Мультимедиа
  {
    headerKey: "catalog.detail.multimedia_group_title",
    params: [
      { nameKey: "catalog.detail.multimedia_ysqpp", field: "car.multimedia_ysqpp" },
      { nameKey: "catalog.detail.multimedia_ysqsl", field: "car.multimedia_ysqsl" },
      { nameKey: "catalog.detail.multimedia_cdjk", field: "car.multimedia_cdjk" },
      { nameKey: "catalog.detail.multimedia_usbsl", field: "car.multimedia_usbsl" },
      { nameKey: "catalog.detail.multimedia_sjwxcd", field: "car.multimedia_sjwxcd" },
      { nameKey: "catalog.detail.multimedia_power_220dy", field: "car.multimedia_power_220dy" },
      { nameKey: "catalog.detail.multimedia_xlxdy", field: "car.multimedia_xlxdy" },
    ],
  },

  // Сиденья
  {
    headerKey: "catalog.detail.seat_group_title",
    params: [
      { nameKey: "catalog.detail.seat_zycz", field: "car.seat_zycz" },
      { nameKey: "catalog.detail.seat_ydfgzy", field: "car.seat_ydfgzy" },
      { nameKey: "catalog.detail.seat_zzytjfs", field: "car.seat_zzytjfs" },
      { nameKey: "catalog.detail.seat_fzytjfs", field: "car.seat_fzytjfs" },
      { nameKey: "catalog.detail.seat_ddzytj", field: "car.seat_ddzytj" },
      { nameKey: "catalog.detail.seat_qpzygn", field: "car.seat_qpzygn" },
      { nameKey: "catalog.detail.seat_ddzyjy", field: "car.seat_ddzyjy" },
      { nameKey: "catalog.detail.seat_fjshptj", field: "car.seat_fjshptj" },
      { nameKey: "catalog.detail.seat_depzytj", field: "car.seat_depzytj" },
      { nameKey: "catalog.detail.seat_hpzyddtj", field: "car.seat_hpzyddtj" },
      { nameKey: "catalog.detail.seat_hpzygn", field: "car.seat_hpzygn" },
      { nameKey: "catalog.detail.seat_hpxzb", field: "car.seat_hpxzb" },
      { nameKey: "catalog.detail.seat_depdlzy", field: "car.seat_depdlzy" },
      { nameKey: "catalog.detail.seat_zybj", field: "car.seat_zybj" },
      { nameKey: "catalog.detail.seat_hpzydfxs", field: "car.seat_hpzydfxs" },
      { nameKey: "catalog.detail.seat_hpzyddfd", field: "car.seat_hpzyddfd" },
      { nameKey: "catalog.detail.seat_qhzyfs", field: "car.seat_qhzyfs" },
      { nameKey: "catalog.detail.seat_hpbj", field: "car.seat_hpbj" },
      { nameKey: "catalog.detail.seat_jrbj", field: "car.seat_jrbj" },
    ],
  },

  // Климат / холодильник
  {
    headerKey: "catalog.detail.fridge_group_title",
    params: [
      { nameKey: "catalog.detail.fridge_ktwdkz", field: "car.fridge_ktwdkz" },
      { nameKey: "catalog.detail.fridge_hpdlkt", field: "car.fridge_hpdlkt" },
      { nameKey: "catalog.detail.fridge_hzcfk", field: "car.fridge_hzcfk" },
      { nameKey: "catalog.detail.fridge_wdfqkz", field: "car.fridge_wdfqkz" },
      { nameKey: "catalog.detail.fridge_czkqjhq", field: "car.fridge_czkqjhq" },
      { nameKey: "catalog.detail.fridge_pm25zz", field: "car.fridge_pm25zz" },
      { nameKey: "catalog.detail.fridge_flzfsq", field: "car.fridge_flzfsq" },
      { nameKey: "catalog.detail.fridge_cnxfzz", field: "car.fridge_cnxfzz" },
      { nameKey: "catalog.detail.fridge_czbx", field: "car.fridge_czbx" },
    ],
  },
]

function buildParams(listing: ListingFull, t: TranslateFn): ParamPair[] {
  const res: ParamPair[] = []
  groups.forEach((g) => {
    if (g.headerKey) {
      res.push({ name: "group_header", value: t(g.headerKey) })
    }

    g.params.forEach((p) => {
      if (p.lockedField && getFlag(listing, p.lockedField)) {
        res.push({ name: t(p.nameKey), value: "", locked: true })

        return
      }

      let value: string | number | TranslatableParamValue = ""

      if (p.field === "options" && (listing.options_ru || listing.options_zh)) {
        value = {
          type: "translatable",
          data: {
            options_ru: listing.options_ru,
            options_zh: listing.options_zh,
            original_locale: listing.original_locale,
          },
          config: {
            keys: {
              ru: "options_ru",
              zh: "options_zh",
              original: "original_locale",
            },
          },
        }
      }
      else if (p.getter) {
        value = p.getter(listing, t)
      }
      else if (p.field) {
        let rawVal = get(listing, p.field)

        if (rawVal) {
          if (p.dictKey) {
            rawVal = translateIfExists(p.dictKey, rawVal)
          }
          if (p.unitKey) {
            rawVal = formatUnit(rawVal, t(p.unitKey))
          }
          value = rawVal
        }
      }

      const isValid = typeof value === "object" ? true : !!value

      if (isValid) {
        const showHybridTooltip = p.hybridField ? get(listing, p.hybridField) === PowerTypeHybrid : false
        res.push({ name: t(p.nameKey), value, ...(showHybridTooltip ? { showHybridTooltip: true } : {}) })
      }
    })
  })
  return res
}

const car = ref<ShortListingNullable>(null)

if (fetchedListing.value) {
  const fullListing = fetchedListing.value
  const shortData = buildShort(fullListing, t)
  shortData.params = buildParams(fullListing, t)
  car.value = shortData
  updateBreadcrumb(car.value?.title ?? "")
}

definePageMeta({
  auth: false,
  layout: "catalog",
  hideTitle: true,
})

const seoTitle = computed(() => buildListingSeoTitle(fetchedListing.value?.name ?? car.value?.title ?? ""))
const seoImage = computed(() => resolveListingShareImage(fetchedListing.value) || car.value?.imageOriginals?.[0] || car.value?.images?.[0] || "")

useSeoMeta({
  title: () => seoTitle.value,
  ogTitle: () => seoTitle.value,
  ogImage: () => seoImage.value,
  ogType: "website",
  twitterCard: "summary_large_image",
  twitterTitle: () => seoTitle.value,
  twitterImage: () => seoImage.value,
})

const currentUserBooking = ref<ListingRequest | null>(null)
const { getCurrentUserBooking, cancelBooking: cancelBookingApi } = useApiListingRequest()
const { store: storeListingRequest, alert: bookingAlert, clearAlert: clearBookingAlert } = useListingRequest(car.value as any)
const { isGeneratingLink, lastGeneratedShare, linkDurationOptions, handleGenerateLink } = useSharedLink(
  numericListingId.value,
  { getListing: () => fetchedListing.value ?? null },
)

const showVideoRequestModal = ref(false)
const showDiagnosticModal = ref(false)
const showCompensationModal = ref(false)
const showBookingConfirmation = ref(false)
const showBookingWarning = ref(false)
const isBookingSubmitting = ref(false)
const bookingSelectionRefreshKey = ref(0)
const similarCars = ref([])

const isListingHidden = computed(() => {
  if (isSharedLinkMode) {
    return false
  }
  return (fetchedListing.value as any)?.visibility === "hidden"
})

const { portOptions: deliveryPorts, reload: reloadPorts, portNameByCode } = usePorts()
const selectedPort = ref<string>("")

const calcResult = computed(() => {
  const portKey = selectedPort.value
  const calculationData = portKey ? car.value?.calculations?.[portKey] : undefined

  return {
    cost: calculationData?.cost ?? 0,
    chinaExpenses: calculationData?.china_expenses ?? 0,
    deliveryCost: calculationData?.delivery_cost ?? 0,
    total: calculationData?.total ?? 0,
    deliveryPort: portKey ? portNameByCode(portKey) : "",
  }
})

const hasVideos = computed(() => (car.value?.videos && car.value.videos.length > 0) || false)
const hasDiagnostics = computed(() => !!car.value?.diagnostics)
const hasCompensation = computed(() => car.value?.has_compensation === true)

function handleReserveClick() {
  if (isBookingSubmitting.value) {
    return
  }
  clearBookingAlert()
  showBookingConfirmation.value = hasVideos.value && hasDiagnostics.value && hasCompensation.value
  showBookingWarning.value = !hasVideos.value || !hasDiagnostics.value || !hasCompensation.value
}

async function onBookingConfirm(searchRequestId: number | null) {
  if (!car.value || isBookingSubmitting.value) {
    return
  }

  isBookingSubmitting.value = true
  try {
    const success = await storeListingRequest(numericListingId.value, RequestTypeBooking, undefined, searchRequestId)
    if (success) {
      hideWarning()
      await loadCurrentUserBooking()
    }
    else {
      bookingSelectionRefreshKey.value++
    }
  }
  finally {
    isBookingSubmitting.value = false
  }
}

const showBookingSuccess = computed(() => currentUserBooking.value !== null)
const bookingQueuePosition = computed(() => currentUserBooking.value?.queue_position || 1)
const bookingStatus = computed(() => currentUserBooking.value?.status || "new")
const hideReserveButton = computed(() => showBookingSuccess.value)

const isBookingDisabled = computed(() => {
  return !fetchedListing.value?.has_deposit
})

const bookingDisabledTitle = computed(() => {
  return isBookingDisabled.value ? t("catalog.detail.low_deposit_booking") : ""
})

function handleProceedToPurchase() {
  const booking = currentUserBooking.value
  const orderId = booking?.logistic_order_id
  if (orderId) {
    router.push({
      name: "personal-logistic-id-buyer",
      params: { id: orderId },
    })
  }
}

async function loadCurrentUserBooking() {
  if (!numericListingId.value || isGuestMode.value) {
    return
  }
  try {
    const response = await getCurrentUserBooking(numericListingId.value)
    currentUserBooking.value = response.data || null
    if (car.value && currentUserBooking.value) {
      car.value.booking_requested = true
    }
  }
  catch (error) {
    console.error("Failed to load current user booking:", error)
    currentUserBooking.value = null
  }
}

onMounted(async () => {
  await reloadPorts()
  if (!selectedPort.value && deliveryPorts.value.length > 0) {
    selectedPort.value = String(deliveryPorts.value[0].value)
  }
  await loadCurrentUserBooking()
})

async function handleCancelBooking() {
  if (!currentUserBooking.value || !numericListingId.value) {
    return
  }
  const confirmed = confirm(t("catalog.detail.confirm_cancel_booking"))
  if (!confirmed) {
    return
  }
  try {
    await cancelBookingApi(numericListingId.value, currentUserBooking.value.id)
    await loadCurrentUserBooking()
    hideWarning()
  }
  catch (error: any) {
    console.error("Failed to cancel booking:", error)
    const errorMessage = error.data?.message || t("error.base.generic")
    alert(errorMessage)
  }
}

function onVideoRequestSubmitted() {
  if (car.value) {
    car.value.video_requested = true
  }
}

function handleGoToDiagnostic() {
  if (car.value?.diagnostics) {
    window.open(car.value.diagnostics, "_blank")
  }
}

function handleRequestDiagnosticSubmit() {
  if (car.value) {
    car.value.diagnostic_requested = true
    car.value.diagnostic_subscribed = true
  }
}

function handleRequestCompensationSubmit() {
  if (car.value) {
    car.value.compensation_requested = true
    car.value.compensation_subscribed = true
  }
}

function handleOpenVideoModal() {
  showVideoRequestModal.value = true
}

function handleOpenDiagnosticModal() {
  showBookingConfirmation.value = false
  showBookingWarning.value = false
  showDiagnosticModal.value = true
}

function handleOpenCompensationModal() {
  showBookingConfirmation.value = false
  showBookingWarning.value = false
  showCompensationModal.value = true
}

function hideWarning() {
  showBookingConfirmation.value = false
  showBookingWarning.value = false
}
</script>

<style module>
.relativeBlock { @apply relative; }
.button { @apply whitespace-nowrap flex items-center; }
.priceActionsRow { @apply flex flex-wrap items-center justify-end gap-2; }
.priceActionBtn { @apply lg:min-w-[200px]; }
.icon { @apply w-5 h-5 inline-block mr-1; }
</style>
