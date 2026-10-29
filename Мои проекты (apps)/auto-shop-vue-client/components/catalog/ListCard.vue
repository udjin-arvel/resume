<template>
  <div :class="[$style.carBlock, isSpecialLayout ? $style.deliveryLayout : '']">
    <div :class="isSpecialLayout ? $style.deliveryImageCol : $style.regularImageCol">
      <div :class="$style.imgWrapper">
        <div
          ref="sliderRef"
          class="keen-slider"
          :class="$style.slider"
          @mousemove="handleMouseMove"
          @mouseleave="handleMouseLeave"
        >
          <div
            v-for="(img, idx) in displayImages"
            :key="`${img.original}-${idx}`"
            class="keen-slider__slide"
            :class="[$style.slide, (images && images.length > 0) ? $style.slideZoom : '']"
            @click="(images && images.length > 0) && openFullscreen(idx)"
          >
            <CatalogCardPicture
              :image="img"
              :alt="name"
              :picture-class="$style.carPicture"
              :image-class="$style.carImage"
              @load="onImageLoad"
            />
            <div
              v-if="visibility === 'hidden'"
              :class="$style.hiddenOverlay"
            >
              <span :class="$style.hiddenText">
                <EyeSlashIcon :class="$style.hiddenIcon" />
                {{ t('catalog.common.hidden') }}
              </span>
            </div>
          </div>
          <div
            v-if="images && displayImages.length > 1"
            :class="$style.stripes"
          >
            <button
              v-for="(img, idx) in displayImages"
              :key="idx"
              :class="[$style.stripe, currentSlide === idx ? $style.stripeActive : '']"
              :aria-label="t('common.go_to_slide')"
              type="button"
              @click.stop.prevent="goToSlide(idx)"
            />
          </div>
        </div>
        <transition name="fade">
          <div
            v-if="fullscreen.active"
            :class="$style.fullscreenOverlay"
            @click.self="closeFullscreen"
          >
            <button
              type="button"
              :class="$style.fullscreenClose"
              :aria-label="t('common.close')"
              @click="closeFullscreen"
            >
              <XMarkIcon :class="$style.fullscreenCloseIcon" />
            </button>
            <button
              type="button"
              :class="$style.fullscreenArrowLeft"
              :aria-label="t('common.previous')"
              @click.stop="fullscreenPrev"
            >
              <ChevronLeftIcon :class="$style.sliderArrowIcon" />
            </button>
            <button
              type="button"
              :class="$style.fullscreenArrowRight"
              :aria-label="t('common.next')"
              @click.stop="fullscreenNext"
            >
              <ChevronRightIcon :class="$style.sliderArrowIcon" />
            </button>
            <CarPreviewImage
              :key="fullscreen.idx"
              :src="displayImages[fullscreen.idx].original"
              :fallback-src="displayImages[fullscreen.idx].mobile"
              :alt="name"
              :image-class="$style.fullscreenImg"
            />
          </div>
        </transition>
      </div>
    </div>

    <template v-if="kind === 'delivery'">
      <div :class="$style.deliveryContentGrid">
        <div :class="$style.deliveryHeaderLeft">
          <NuxtLink
            :to="link"
            :class="$style.deliveryTitle"
          >
            {{ name }}
          </NuxtLink>
          <div :class="$style.deliveryDescription">
            <ListingDescription
              :parts="descriptionParts"
              :fallback="description"
            />
          </div>
          <div :class="$style.deliverySeller">
            <span :class="$style.deliverySellerLabel">{{ t('catalog.common.seller') }}:</span> {{ sellerName }}
          </div>
          <div
            v-if="isDirector || isAdmin"
            :class="$style.deliverySeller"
          >
            <span :class="$style.deliverySellerLabel">{{ t('catalog.common.buyer') }}:</span> {{ buyerName }}
          </div>
        </div>

        <div :class="$style.deliveryHeaderRight">
          <div :class="$style.deliveryPriceBlock">
            <div :class="$style.deliveryPriceLabel">
              {{ t('catalog.common.purchase_price') }}
            </div>
            <div :class="$style.deliveryPriceValue">
              {{ formattedPrice }} <span>{{ yuanSymbol }}</span>
            </div>
          </div>
          <div :class="$style.deliveryDateBlock">
            <div :class="$style.deliveryDateLabel">
              {{ t('catalog.common.purchase_date') }}
            </div>
            <div :class="$style.deliveryDateValue">
              {{ purchaseDate }}
            </div>
          </div>
        </div>

        <div :class="$style.deliveryBottomBlock">
          <div :class="$style.deliveryStatusRow">
            <Label
              :text="logisticStatusLabel"
              :kind="logisticStatusKind"
            />
            <span :class="$style.deliveryStatusDate">{{ logisticStatusDate }}</span>
          </div>

          <div
            v-if="!isSeller"
            :class="$style.deliveryButtons"
          >
            <Button
              :kind="logisticActionButtonKind"
              size="sm"
              :class="$style.deliveryActionButton"
              @click="handleLogisticAction"
            >
              {{ logisticActionButtonText }}
              <ArrowRightIcon
                v-if="showGoToLogisticsArrow"
                :class="$style.deliveryArrowIcon"
              />
            </Button>
            <ToChat
              v-if="buyerId"
              type="listing"
              :listing-id="Number(listingId)"
              :buyer-id="buyerId"
              :disabled="!buyerId"
              :class="$style.deliveryChatLink"
            >
              <template #default="{ chatLoading, clickDisabled, goToChat }">
                <Button
                  kind="lightgrey"
                  size="sm"
                  :class="$style.deliveryChatButton"
                  :disabled="clickDisabled"
                  :aria-busy="chatLoading || undefined"
                  @click="goToChat"
                >
                  <ChatBubbleOvalLeftIcon :class="$style.chatIcon" />
                  {{ t('catalog.common.chat') }}
                </Button>
              </template>
            </ToChat>
          </div>
        </div>

        <div
          v-if="isSeller && kind !== 'delivery'"
          :class="$style.deliveryMenuWrapper"
        >
          <MenuElips
            kind="lightgrey"
            :menu-action-groups="menuActionGroups"
          >
            <template #item="{ item }">
              <span :class="[$style.menuItemName, item.style === 'red' ? $style.redMenuItem : '']">{{ item.label }}</span>
            </template>
          </MenuElips>
        </div>
      </div>
    </template>

    <template v-else-if="kind === 'bought'">
      <div :class="$style.boughtContentGrid">
        <div :class="$style.boughtHeaderLeft">
          <NuxtLink
            :to="link"
            :class="$style.boughtTitle"
          >
            {{ name }}
          </NuxtLink>
          <div :class="$style.boughtDescription">
            <ListingDescription
              :parts="descriptionParts"
              :fallback="description"
            />
          </div>
          <div :class="$style.boughtSeller">
            <span :class="$style.boughtSellerLabel">{{ t('catalog.common.seller') }}:</span> {{ sellerName }}
          </div>
          <div
            v-if="isDirector || isAdmin"
            :class="$style.boughtSeller"
          >
            <span :class="$style.boughtSellerLabel">{{ t('catalog.common.buyer') }}:</span> {{ buyerName }}
          </div>
        </div>

        <div :class="$style.boughtHeaderRight">
          <div :class="$style.boughtPriceBlock">
            <div :class="$style.boughtPriceLabel">
              {{ t('catalog.common.purchase_price') }}
            </div>
            <div :class="$style.boughtPriceValue">
              {{ formattedPrice }} <span>{{ yuanSymbol }}</span>
            </div>
          </div>
          <div :class="$style.boughtDateBlock">
            <div :class="$style.boughtDateLabel">
              {{ t('catalog.common.purchase_date') }}
            </div>
            <div :class="$style.boughtDateValue">
              {{ purchaseDate }}
            </div>
          </div>
        </div>

        <div :class="$style.boughtBottomBlock">
          <div
            v-if="!isSeller"
            :class="$style.boughtButtons"
          >
            <NuxtLink
              v-if="reviewId"
              :to="{ name: 'personal-reviews-id', params: { id: reviewId } }"
              :class="$style.boughtReviewLink"
            >
              <ChatBubbleBottomCenterIcon :class="$style.boughtReviewIcon" />
              {{ t('catalog.common.read_review') }}
            </NuxtLink>
            <Button
              v-else
              kind="lightgrey"
              size="sm"
              :class="$style.boughtActionButton"
              @click="handleWriteReview"
            >
              <PencilIcon :class="$style.boughtReviewIconWrite" />
              {{ t('catalog.common.write_review') }}
            </Button>

            <ToChat
              v-if="buyerId"
              type="listing"
              :listing-id="Number(listingId)"
              :buyer-id="buyerId"
              :disabled="!buyerId"
              :class="$style.boughtChatLink"
            >
              <template #default="{ chatLoading, clickDisabled, goToChat }">
                <Button
                  kind="lightgrey"
                  size="sm"
                  :class="$style.boughtChatButton"
                  :disabled="clickDisabled"
                  :aria-busy="chatLoading || undefined"
                  @click="goToChat"
                >
                  <ChatBubbleOvalLeftIcon :class="$style.chatIcon" />
                  {{ t('catalog.common.chat') }}
                </Button>
              </template>
            </ToChat>
          </div>
        </div>
      </div>
    </template>

    <template v-else-if="kind === 'archive'">
      <div :class="$style.regularMiddleCol">
        <NuxtLink
          :to="link"
          :class="$style.regularTitle"
        >
          {{ name }}
        </NuxtLink>
        <div :class="$style.regularDescription">
          <ListingDescription
            :parts="descriptionParts"
            :fallback="description"
          />
        </div>
        <div
          v-if="productionDate"
          :class="$style.regularProductionDate"
        >
          <span :class="$style.regularProductionDateLabel">{{ t('catalog.list.production_date') }}:</span> {{ productionDate }}
        </div>
        <div :class="$style.regularLabels">
          <Label
            :text="isWithdrawn ? t('catalog.list.withdrawn') : t('catalog.list.sold')"
            kind="black"
          />
        </div>
        <div :class="$style.archiveActions">
          <NuxtLink :to="{ name: 'personal-needs-create' }">
            <Button
              kind="lightgrey"
              size="sm"
            >
              {{ t('catalog.detail.search_request_btn') }}
            </Button>
          </NuxtLink>
        </div>
      </div>

      <div :class="$style.regularRightCol">
        <div :class="$style.regularPriceRow">
          <div :class="$style.archivePriceBlock">
            <div :class="$style.archivePriceLabel">
              {{ isWithdrawn ? t('catalog.common.price') : t('catalog.common.purchase_price') }}
            </div>
            <AuthLockInline
              v-if="isPriceLocked"
              size="md"
              :align-end="true"
            />
            <div
              v-else
              :class="$style.regularPrice"
            >
              {{ formattedPrice }} <span>{{ yuanSymbol }}</span>
            </div>
          </div>
          <FavoriteButton
            v-if="showFavorite"
            :listing-id="Number(listingId)"
            :is-favorited="isFavorited"
            @change="emit('favoriteChange', $event)"
          />
        </div>
        <div :class="$style.regularPublishedBlock">
          <div :class="$style.regularPublishedText">
            <span :class="$style.regularPublishedLabel">{{ isWithdrawn ? t('catalog.common.withdrawn_date') : t('catalog.common.purchase_date') }}</span>
            {{ isWithdrawn ? withdrawnAt : purchaseDate }}
          </div>
        </div>
      </div>
    </template>

    <template v-else>
      <div :class="$style.regularMiddleCol">
        <NuxtLink
          :to="link"
          :class="$style.regularTitle"
        >
          {{ name }}
        </NuxtLink>
        <div :class="$style.regularDescription">
          <ListingDescription
            :parts="descriptionParts"
            :fallback="description"
          />
        </div>
        <div
          v-if="productionDate"
          :class="$style.regularProductionDate"
        >
          <span :class="$style.regularProductionDateLabel">{{ t('catalog.list.production_date') }}:</span> {{ productionDate }}
        </div>
        <div
          v-if="(isAdmin || isAnySeller) && sellerName"
          :class="$style.regularSellerRow"
        >
          <span :class="$style.regularSellerLabel">{{ t('catalog.common.assigned_manager') }}:</span> {{ sellerName }}
        </div>
        <div :class="$style.regularBadges">
          <LabelTooltip
            v-if="hasVideos"
            :icon="PlayIconOutline"
            :tooltip-text="t('common.has_video')"
            kind="gray"
          />
          <LabelTooltip
            v-if="hasDiagnostics"
            :icon="Activity"
            :tooltip-text="t('common.has_diagnostics')"
            kind="gray"
          />
          <LabelTooltip
            v-if="hasCompensation"
            :icon="ClipboardDocumentCheckIcon"
            :tooltip-text="t('common.has_compensation')"
            kind="gray"
          />
          <LabelTooltip
            v-if="originalPaint"
            :icon="PaintBucket"
            :tooltip-text="t('common.original_paint')"
            kind="gray"
          />
        </div>
        <div :class="$style.regularLabels">
          <template v-if="showSellerStats">
            <Label
              v-if="totalBooking && totalBooking > 0"
              :text="`${t('catalog.common.booking_requested')} (${totalBooking})`"
              kind="gray"
            />
            <Label
              v-if="totalDiagnostic && totalDiagnostic > 0"
              :text="`${t('catalog.common.diagnostic_requested')} (${totalDiagnostic})`"
              kind="gray"
            />
            <Label
              v-if="totalCompensation && totalCompensation > 0"
              :text="`${t('catalog.common.compensation_requested')} (${totalCompensation})`"
              kind="gray"
            />
            <Label
              v-if="totalVideo && totalVideo > 0"
              :text="`${t('catalog.common.video_requested')} (${totalVideo})`"
              kind="gray"
            />
          </template>

          <template v-else>
            <Label
              v-if="bookingRequested"
              :text="t('catalog.common.booking_requested')"
              kind="gray"
            />
            <Label
              v-if="diagnosticRequested"
              :text="t('catalog.common.diagnostic_requested')"
              kind="gray"
            />
            <Label
              v-if="compensationRequested"
              :text="t('catalog.common.compensation_requested')"
              kind="gray"
            />
            <Label
              v-if="diagnosticLoaded && !diagnosticRequested"
              :text="t('catalog.common.diagnostic_loaded')"
              kind="green"
            />
            <Label
              v-if="compensationLoaded && !compensationRequested"
              :text="t('catalog.common.compensation_loaded')"
              kind="green"
            />
            <Label
              v-if="diagnosticSubscribed"
              :text="t('catalog.common.diagnostic_subscribed')"
              kind="yellow"
            />
            <Label
              v-if="videoRequested"
              :text="t('catalog.common.video_requested')"
              kind="gray"
            />
            <Label
              v-if="videoLoaded && !videoRequested"
              :text="t('catalog.common.video_loaded')"
              kind="green"
            />
          </template>
        </div>
      </div>

      <div :class="$style.regularRightCol">
        <div :class="$style.regularPriceRow">
          <AuthLockInline
            v-if="isPriceLocked"
            size="md"
            :align-end="true"
          />
          <div
            v-else
            :class="$style.regularPrice"
          >
            {{ formattedPrice }} <span>{{ yuanSymbol }}</span>
          </div>
          <FavoriteButton
            v-if="showFavorite"
            :listing-id="Number(listingId)"
            :is-favorited="isFavorited"
            @change="emit('favoriteChange', $event)"
          />
          <div
            v-if="isSeller"
            :class="$style.menuWrapper"
          >
            <MenuElips
              kind="lightgrey"
              :menu-action-groups="menuActionGroups"
            >
              <template #item="{ item }">
                <span :class="[$style.menuItemName, item.style === 'red' ? $style.redMenuItem : '']">{{ item.label }}</span>
              </template>
            </MenuElips>
          </div>
        </div>
        <div :class="$style.regularPublishedBlock">
          <div :class="$style.regularPublishedText">
            <span :class="$style.regularPublishedLabel">{{ isWithdrawn ? t('catalog.common.withdrawn_date') : t('catalog.common.published') }}</span>
            {{ isWithdrawn ? withdrawnAt : publishedAt }}
          </div>
        </div>
      </div>
    </template>

    <AddListingToRequestModal
      :is-open="isAddToRequestModalOpen"
      :listing-id="Number(listingId)"
      @close="closeAddToRequestModal"
    />

    <ReturnToSaleModal
      :is-open="isReturnToSaleModalOpen"
      :listing-id="Number(listingId)"
      @close="closeReturnToSaleModal"
      @success="refreshListingsAfterReturn"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed } from "vue"
import { useRouter } from "vue-router"
import "keen-slider/keen-slider.min.css"
import { useKeenSlider } from "keen-slider/vue"
import {
  PlayIcon as PlayIconOutline,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  EyeSlashIcon,
  ChatBubbleOvalLeftIcon,
  ArrowRightIcon,
  PencilIcon,
  ChatBubbleBottomCenterIcon,
  ClipboardDocumentCheckIcon,
} from "@heroicons/vue/24/outline"
import { useI18n } from "vue-i18n"
import { storeToRefs } from "pinia"
import { useMoney } from "@/composables/useMoney"
import { SaleStatusWithdrawn } from "@/constants/catalog"
import CatalogCardPicture from "@/components/catalog/CatalogCardPicture.vue"
import CarPreviewImage from "@/components/common/CarPreviewImage.vue"
import { displayCatalogImages, type CatalogCardImage } from "@/utils/catalogImages"
import currency from "@/lang/ru/currency.json"
import orderStatuses from "@/lang/ru/orderStatuses.json"
import Activity from "@/components/icon/Activity.vue"
import PaintBucket from "@/components/icon/PaintBucket.vue"
import LabelTooltip from "@/components/common/LabelTooltip.vue"
import Label from "@/components/common/Label.vue"
import MenuElips from "@/components/common/MenuElips.vue"
import Button from "@/components/common/Button.vue"
import { useCatalogCardMenu } from "@/composables/useCatalogCardMenu"
import { useUserStore } from "@/stores/user"
import { LogisticOrderStatuses } from "~/constants/orderStatuses"
import ToChat from "@/components/chat/ToChat.vue"
import AddListingToRequestModal from "@/components/listing/AddListingToRequestModal.vue"
import ReturnToSaleModal from "@/components/listing/ReturnToSaleModal.vue"
import ListingDescription, { type DescriptionPart } from "@/components/catalog/ListingDescription.vue"
import FavoriteButton from "@/components/catalog/FavoriteButton.vue"
import AuthLockInline from "@/components/common/AuthLockInline.vue"

const router = useRouter()
const userStore = useUserStore()
const { isDirector, isBuyer, isSellerContent, isSellerSearch, isAnySeller, isAdmin } = storeToRefs(userStore)

interface Props {
  name: string
  images: CatalogCardImage[]
  description?: string
  descriptionParts?: DescriptionPart[]
  productionDate?: string
  price: string | number
  isPriceLocked?: boolean
  link: string | { name: string, params: { id: string | number } }
  hasDiagnostics: boolean
  hasCompensation?: boolean
  hasVideos: boolean
  originalPaint?: boolean
  publishedAt: string
  diagnosticRequested: boolean
  compensationRequested: boolean
  videoRequested: boolean
  diagnosticLoaded: boolean
  compensationLoaded: boolean
  diagnosticSubscribed: boolean
  videoLoaded: boolean
  bookingRequested: boolean
  isSeller?: boolean
  visibility?: string
  refreshListings?: () => void
  totalVideo?: number
  totalDiagnostic?: number
  totalCompensation?: number
  totalBooking?: number
  totalMessages?: number
  kind?: "sale" | "delivery" | "bought" | "archive"
  sellerName?: string
  logisticStatus?: string
  logisticStatusDate?: string
  purchaseDate?: string
  logisticOrderId?: number
  buyerId?: number
  buyerName?: string
  reviewId?: number
  deleted?: boolean
  saleStatus?: string | null
  withdrawnAt?: string | null
  listingId?: number
  showFavorite?: boolean
  isFavorited?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  kind: "sale",
  sellerName: "",
  buyerName: "",
  logisticStatus: "",
  logisticStatusDate: "",
  purchaseDate: "",
  deleted: false,
  withdrawnAt: "",
  showFavorite: false,
  isFavorited: false,
})
const emit = defineEmits<{
  favoriteChange: [isFavorited: boolean]
}>()
const buyerNextStatusMap: Partial<Record<string, string>> = {
  [LogisticOrderStatuses.AwaitingBuyerData]: LogisticOrderStatuses.AddedBuyerData,
  [LogisticOrderStatuses.AddedBuyerData]: LogisticOrderStatuses.InvoiceIssued,
  [LogisticOrderStatuses.InvoiceIssued]: LogisticOrderStatuses.PaymentDocsUploaded,
  [LogisticOrderStatuses.PreparedForRuDispatch]: LogisticOrderStatuses.AttachDispatchData,
}
const hasBuyerAction = computed(() => {
  if (!isBuyer.value) {
    return false
  }
  const status = props.logisticStatus || ""
  return Boolean(buyerNextStatusMap[status])
})

const showSellerStats = computed(() => {
  if (!props.isSeller) {
    return false
  }
  if (isSellerContent.value || isSellerSearch.value) {
    return false
  }

  return true
})

const buyerActionLabelKey = computed(() => {
  const status = props.logisticStatus || ""
  const next = buyerNextStatusMap[status]
  return next ? `order_status.actions.${next}` : ""
})

const { formatNumberWithSpace } = useMoney()
const { t } = useI18n()
const formattedPrice = computed(() => formatNumberWithSpace(Number(props.price)))
const yuanSymbol = currency.CNY_symbol

const listingId = computed(() => {
  if (props.listingId) {
    return props.listingId
  }

  return typeof props.link === "string" ? props.link : props.link.params.id
})
const totalVideoRef = computed(() => props.totalVideo || 0)
const totalDiagnosticRef = computed(() => props.totalDiagnostic || 0)
const totalCompensationRef = computed(() => props.totalCompensation || 0)
const totalBookingRef = computed(() => props.totalBooking || 0)
const totalMessagesRef = computed(() => props.totalMessages || 0)

const { menuActionGroups, isAddToRequestModalOpen, closeAddToRequestModal, isReturnToSaleModalOpen, closeReturnToSaleModal } = useCatalogCardMenu(
  listingId.value,
  props.refreshListings || (() => {}),
  props.visibility || "all",
  totalVideoRef,
  totalDiagnosticRef,
  totalCompensationRef,
  totalBookingRef,
  totalMessagesRef,
  props.deleted,
  props.saleStatus ?? null,
)

const refreshListingsAfterReturn = () => {
  props.refreshListings?.()
}

const isWithdrawn = computed(() => props.saleStatus === SaleStatusWithdrawn)

const displayImages = computed(() => displayCatalogImages(props.images))

const logisticStatusLabel = computed(() => {
  if (!props.logisticStatus) {
    return ""
  }
  return orderStatuses.catalog[props.logisticStatus as keyof typeof orderStatuses.catalog] || props.logisticStatus
})

const logisticStatusKind = computed<"gray" | "violet">(() => {
  const status = props.logisticStatus || ""
  const violetStatuses = [
    "awaiting_buyer_data",
    "added_buyer_data",
    "invoice_issued",
    "prepared_for_ru_dispatch",
  ]
  if (violetStatuses.includes(status)) {
    return "violet"
  }
  return "gray"
})

const isSpecialLayout = computed(() => ["delivery", "bought"].includes(props.kind))

const nextActionKey = computed(() => {
  const status = props.logisticStatus
  if (!status) {
    return "go_to_logistics"
  }

  const statusToNextAction: Record<string, keyof typeof orderStatuses.actions> = {
    awaiting_buyer_data: "added_buyer_data",
    added_buyer_data: "invoice_issued",
    invoice_issued: "payment_docs_uploaded",
    prepared_for_ru_dispatch: "attach_dispatch_data",
  }

  return statusToNextAction[status] || "go_to_logistics"
})

const logisticActionButtonText = computed(() => {
  if (props.kind === "delivery" && isBuyer.value && hasBuyerAction.value) {
    return t(buyerActionLabelKey.value)
  }
  return t("catalog.logistic.go_to_logistics")
})

const showGoToLogisticsArrow = computed(() => {
  return !(props.kind === "delivery" && isBuyer.value && hasBuyerAction.value)
})

const logisticActionButtonKind = computed<"white" | "redOutline">(() => {
  if (props.kind === "delivery" && isBuyer.value && hasBuyerAction.value) {
    return "redOutline"
  }
  return "white"
})

const logisticLink = computed(() => {
  const orderId = props.logisticOrderId
  if (!orderId) {
    return "/personal/logistic"
  }

  const status = props.logisticStatus
  if (!status || nextActionKey.value === "go_to_logistics") {
    return `/personal/logistic`
  }

  if (nextActionKey.value === "added_buyer_data") {
    return `/personal/logistic/${orderId}/buyer`
  }
  if (nextActionKey.value === "invoice_issued") {
    return `/personal/logistic/${orderId}/invoice`
  }
  if (nextActionKey.value === "payment_docs_uploaded") {
    return `/personal/logistic/${orderId}/payment`
  }

  return `/personal/logistic/`
})

function handleLogisticAction() {
  const orderId = props.logisticOrderId

  if (!orderId) {
    router.push({ name: "personal-logistic" })
    return
  }

  if (
    props.kind === "delivery"
    && isBuyer.value
    && nextActionKey.value === "attach_dispatch_data"
  ) {
    router.push({
      name: "personal-logistic-tracking-id-status-status",
      params: {
        id: orderId,
        status: 0,
      },
    })
    return
  }

  if (
    props.kind === "delivery"
    && isBuyer.value
    && nextActionKey.value === "payment_received"
  ) {
    router.push({
      name: "personal-logistic-tracking-id",
      params: {
        id: orderId,
        status: 0,
      },
    })
    return
  }

  if (props.logisticStatus && nextActionKey.value !== "go_to_logistics") {
    router.push(logisticLink.value)
    return
  }

  router.push({
    name: "personal-logistic-tracking-id",
    params: { id: orderId },
  })
}

function handleWriteReview() {
  if (props.logisticOrderId) {
    router.push({
      name: "personal-logistic-id-review",
      params: { id: props.logisticOrderId },
    })
  }
}

const [sliderRef, slider] = useKeenSlider({
  loop: false,
  slides: { perView: 1 },
})
const currentSlide = ref(0)
const hoverSlideIndex = ref(-1)

watch(
  slider,
  (instance) => {
    if (instance) {
      instance.on("slideChanged", (s) => {
        currentSlide.value = s.track.details.rel
      })
    }
  },
  { immediate: true },
)

function updateSlider() {
  if (slider.value) {
    slider.value.update()
  }
}

let resizeObserver: ResizeObserver | null = null
onMounted(() => {
  if (sliderRef.value && slider.value) {
    slider.value.update()
    setTimeout(() => {
      slider.value?.update()
    }, 100)
    resizeObserver = new ResizeObserver(() => {
      slider.value?.update()
    })
    resizeObserver.observe(sliderRef.value)
  }
})

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
  slider.value?.destroy()
})

const fullscreen = ref<{ active: boolean, idx: number }>({ active: false, idx: 0 })

function openFullscreen(idx: number) {
  fullscreen.value = { active: true, idx }
}
function closeFullscreen() {
  fullscreen.value = { active: false, idx: 0 }
}
function fullscreenPrev(e?: Event) {
  if (e) {
    e.stopPropagation()
  }
  const imgs = displayImages.value
  fullscreen.value.idx = (fullscreen.value.idx - 1 + imgs.length) % imgs.length
}
function fullscreenNext(e?: Event) {
  if (e) {
    e.stopPropagation()
  }
  const imgs = displayImages.value
  fullscreen.value.idx = (fullscreen.value.idx + 1) % imgs.length
}
function goToSlide(idx: number) {
  if (slider.value) {
    slider.value.moveToIdx(idx, true, { duration: 0 })
  }
}
function handleMouseMove(event: MouseEvent) {
  if (fullscreen.value.active) {
    return
  }
  const sliderElement = sliderRef.value
  if (!sliderElement || !slider.value) {
    return
  }
  const rect = sliderElement.getBoundingClientRect()
  const mouseX = event.clientX - rect.left
  const totalSlides = displayImages.value.length
  const sectionWidth = rect.width / totalSlides
  const newIdx = Math.floor(mouseX / sectionWidth)
  const clampedIdx = Math.max(0, Math.min(newIdx, totalSlides - 1))
  if (hoverSlideIndex.value !== clampedIdx) {
    hoverSlideIndex.value = clampedIdx
    slider.value.moveToIdx(clampedIdx, true, { duration: 0 })
  }
}
function handleMouseLeave() {
  hoverSlideIndex.value = -1
}
const publishedAt = computed(() => props.publishedAt)
const loadedImages = ref(0)
function onImageLoad() {
  loadedImages.value += 1
  if (loadedImages.value === displayImages.value.length) {
    updateSlider()
  }
}
</script>

      <style module>
.carBlock {
  @apply flex flex-wrap w-full;
  }

.deliveryLayout {
  @apply flex-col md:flex-row gap-0 md:gap-6;
  }

.deliveryImageCol {
  @apply w-full md:w-auto;
    flex: 0 0 auto;
  }

@media (min-width: 768px) {
  .deliveryImageCol {
      flex: 0 0 300px;
      width: 300px;
    }
  }

.regularImageCol {
  @apply w-full md:w-[300px] flex-shrink-0;
  }

.deliveryContentGrid {
  @apply p-4 md:p-0 flex-1;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    min-width: 450px;
  }

@media (min-width: 768px) {
  .deliveryContentGrid {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      grid-template-rows: auto auto;
      column-gap: 1.5rem;
      row-gap: 1rem;
    }
  }

@media (min-width: 1024px) {
  .deliveryContentGrid {
      grid-template-columns: minmax(0, 1fr) 200px;
      column-gap: 2rem;
      row-gap: 1.5rem;
    }
  }

.deliveryHeaderLeft {
  @apply w-full;
    min-width: 0;
    grid-column: 1 / 2;
    grid-row: 1 / 2;
  }

.deliveryTitle {
  @apply text-lg font-semibold hover:text-red-600 hover:underline mb-1 block;
  }

.deliveryDescription {
  @apply text-gray-500 text-sm mb-2;
  }

.deliverySeller {
  @apply text-sm text-gray-700 mt-2;
  }

.deliverySellerLabel {
  @apply text-gray-500;
  }

.deliveryHeaderRight {
  @apply w-full pt-3 md:pt-0 md:pl-6;
  }

@media (min-width: 768px) {
  .deliveryHeaderRight {
      grid-column: 2 / 3;
      grid-row: 1 / 2;
    @apply flex flex-col pt-0;
      min-width: 160px;
    }
  }

@media (min-width: 1024px) {
  .deliveryHeaderRight {
      min-width: 180px;
    }
  }

.deliveryPriceBlock {
  @apply mb-2 md:mb-4 flex flex-row md:flex-col justify-between w-full;
  }

.deliveryPriceLabel {
  @apply text-sm text-gray-500 mb-0 md:mb-1 mr-2 md:mr-0;
  }

.deliveryPriceValue {
  @apply text-xl font-bold leading-none whitespace-nowrap;
  }

.deliveryDateBlock {
  @apply flex flex-row md:flex-col justify-between w-full;
  }

.deliveryDateLabel {
  @apply text-sm text-gray-500 mb-0 md:mb-1 mr-2 md:mr-0;
  }

.deliveryDateValue {
  @apply text-sm font-medium whitespace-nowrap;
  }

.deliveryBottomBlock {
  @apply w-full mt-auto;
  }

@media (min-width: 768px) {
  .deliveryBottomBlock {
      grid-column: 1 / 3;
      grid-row: 2 / 3;
    @apply flex flex-col justify-end;
    }
  }

.deliveryStatusRow {
  @apply flex items-center gap-3 mb-4 flex-wrap;
  }

.deliveryStatusDate {
  @apply text-xs text-gray-500;
  }

.deliveryButtons {
  @apply flex gap-3 w-full flex-col sm:flex-row;
  }

.deliveryActionButton {
  @apply flex-grow justify-center;
  }

.deliveryArrowIcon {
  @apply w-4 h-4 ml-2;
  }

.deliveryChatLink {
  @apply w-full sm:w-auto;
  }

.deliveryChatButton {
  @apply whitespace-nowrap px-4 w-full sm:w-auto justify-center;
  }

.deliveryMenuWrapper {
  @apply absolute top-4 right-4 md:static md:flex md:items-end md:justify-end md:pb-1;
  }

@media (min-width: 768px) {
  .deliveryMenuWrapper {
      grid-column: 2 / 3;
      grid-row: 2 / 3;
    }
  }

.boughtContentGrid {
  @apply p-4 md:p-0 flex-1;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    min-width: 450px;
  }

@media (min-width: 768px) {
  .boughtContentGrid {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      grid-template-rows: auto auto;
      column-gap: 1.5rem;
      row-gap: 1rem;
    }
  }

@media (min-width: 1024px) {
  .boughtContentGrid {
      grid-template-columns: minmax(0, 1fr) 200px;
      column-gap: 2rem;
      row-gap: 1.5rem;
    }
  }

.boughtHeaderLeft {
  @apply w-full;
    min-width: 0;
    grid-column: 1 / 2;
    grid-row: 1 / 2;
  }

.boughtTitle {
  @apply text-lg font-semibold hover:text-red-600 hover:underline mb-1 block;
  }

.boughtDescription {
  @apply text-gray-500 text-sm mb-2;
  }

.boughtSeller {
  @apply text-sm text-gray-700 mt-2;
  }

.boughtSellerLabel {
  @apply text-gray-500;
  }

.boughtHeaderRight {
  @apply w-full pt-3 md:pt-0 md:pl-6;
  }
.boughtReviewLink {
  @apply inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors;
}

@media (min-width: 768px) {
  .boughtHeaderRight {
      grid-column: 2 / 3;
      grid-row: 1 / 2;
    @apply flex flex-col pt-0;
      min-width: 160px;
    }
  }

@media (min-width: 1024px) {
  .boughtHeaderRight {
      min-width: 180px;
    }
  }

.boughtPriceBlock {
  @apply mb-2 md:mb-4 flex flex-row md:flex-col justify-between w-full;
  }

.boughtPriceLabel {
  @apply text-sm text-gray-500 mb-0 md:mb-1 mr-2 md:mr-0;
  }

.boughtPriceValue {
  @apply text-xl font-bold leading-none whitespace-nowrap;
  }

.boughtDateBlock {
  @apply flex flex-row md:flex-col justify-between w-full;
  }

.boughtDateLabel {
  @apply text-sm text-gray-500 mb-0 md:mb-1 mr-2 md:mr-0;
  }

.boughtDateValue {
  @apply text-sm font-medium whitespace-nowrap;
  }

.boughtBottomBlock {
  @apply w-full mt-auto;
  }

@media (min-width: 768px) {
  .boughtBottomBlock {
    @apply flex flex-col justify-end;
    grid-column: 1 / 3;
    grid-row: 2 / 3;
  }
}

.boughtButtons {
  @apply flex gap-3 w-full flex-col sm:flex-row;
}

.boughtActionButton {
  @apply justify-center;
}

.boughtReviewIcon {
  @apply w-4 h-4;
}

.boughtReviewIconWrite {
  @apply w-4 h-4 mr-2;
}

.boughtChatLink {
  @apply w-full sm:w-auto;
}

.boughtChatButton {
  @apply whitespace-nowrap px-4 w-full sm:w-auto justify-center;
}

.regularMiddleCol {
  @apply flex-1 flex flex-col justify-start px-4 pt-4 md:pt-0 min-w-0;
}

.regularTitle {
  @apply text-xl font-semibold hover:text-red-600 hover:underline mb-2;
}

.regularDescription {
  @apply text-gray-500 text-sm mb-2;
}

.regularProductionDate {
  @apply text-sm text-gray-700 mb-2;
}

.regularProductionDateLabel {
  @apply text-gray-500;
}

.regularSellerRow {
  @apply text-sm text-gray-700 mt-1 mb-1;
}

.regularSellerLabel {
  @apply text-gray-500;
}

.regularBadges {
  @apply flex gap-2 mt-2 mb-3;
}

.regularLabels {
  @apply flex flex-wrap gap-1.5 mt-auto items-start;
}

.regularRightCol {
  @apply w-full md:w-[220px] flex-shrink-0 flex flex-col justify-start pr-2 px-4 md:px-0 pb-4 md:pb-0 md:text-right;
}

.regularPriceRow {
  @apply flex items-center justify-between md:justify-end gap-3 mt-4 md:mt-0;
}

.regularPrice {
  @apply text-2xl font-bold;
}

.regularPublishedBlock {
  @apply flex flex-col md:justify-end flex-1 w-full items-start md:items-end;
}

.regularPublishedText {
  @apply text-xs text-gray-400 mt-2 mb-0;
  }

.regularPublishedLabel {
  @apply block;
  }

.imgWrapper {
  @apply relative;
  }

.slider {
  @apply relative w-full h-[240px] sm:h-[280px] md:h-[240px] overflow-hidden;
  }

.slide {
  @apply flex items-center justify-center bg-gray-100 w-full h-full min-h-0 min-w-0 p-0 relative cursor-zoom-in pointer-events-auto;
  }

.slideZoom {
  @apply cursor-zoom-in;
  }

.carPicture {
  @apply w-full h-full block;
  }

.carImage {
  @apply w-full h-full object-cover block;
  }

.stripes {
  @apply absolute bottom-0 left-0 w-full flex justify-center items-end gap-2 pb-2 z-10;
  }

.stripe {
  @apply w-8 h-[6px] rounded bg-white opacity-60 transition-all border-none outline-none cursor-pointer;
  }

.stripeActive {
  @apply opacity-100 bg-white shadow-lg;
  }

.fullscreenOverlay {
  @apply fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-95;
    animation: fadeIn 0.2s;
  }

.fullscreenImg {
  @apply max-w-full max-h-full shadow-2xl bg-[#111] !object-contain;
    box-shadow: 0 0 40px 8px rgba(0, 0, 0, 0.7);
  }

.fullscreenClose {
  @apply absolute top-6 right-6 z-10 bg-black bg-opacity-60 rounded-full p-2 hover:bg-opacity-90 transition;
  }

.fullscreenCloseIcon {
  @apply w-7 h-7 text-white;
  }

.fullscreenArrowLeft,
.fullscreenArrowRight {
  @apply absolute top-1/2 z-10 bg-white bg-opacity-80 rounded-full p-2 shadow-md border border-gray-200 transition hover:bg-primary-600 hover:text-white flex items-center justify-center w-10 h-10;
    transform: translateY(-50%);
  }

.fullscreenArrowLeft {
  @apply left-8;
  }

.fullscreenArrowRight {
  @apply right-8;
  }

.sliderArrowIcon {
  @apply w-6 h-6;
  }

.chatIcon {
  @apply w-4 h-4 mr-1;
  }

.menuWrapper {
  @apply flex items-center;
  }

.menuItemName {
  @apply text-sm text-black;
  }

.redMenuItem {
  @apply text-red-600;
  }

.hiddenOverlay {
  @apply absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-30;
  }

.hiddenText {
  @apply flex items-center gap-2 text-white text-lg font-semibold bg-black bg-opacity-70 rounded-full px-4 py-2;
  }

.hiddenIcon {
  @apply w-5 h-5 text-white;
  }

.archivePriceBlock {
  @apply flex flex-col;
  }

.archivePriceLabel {
  @apply text-sm text-gray-500 mb-1;
  }

.archiveActions {
  @apply mt-3;
  }
  </style>
