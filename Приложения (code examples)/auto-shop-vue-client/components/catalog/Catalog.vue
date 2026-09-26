<template>
  <div>
    <div :class="$style.topBlock">
      <h1 :class="$style.title">
        {{ pageTitle }}
      </h1>
      <div
        v-if="isAuthenticated"
        :class="$style.actions"
      >
        <div
          v-if="showFilterInput"
          :class="$style.saveFilterContainer"
        >
          <FormInput
            v-model="filterName"
            :placeholder="t('catalog.filter.save_name')"
            :class="$style.filterNameInput"
          />
          <Button
            kind="lightgrey"
            :class="$style.saveBtn"
            :disabled="!filterName || isLoading"
            @click="saveFilter(filters, selectedTab)"
          >
            {{ t('common.save') }}
          </Button>
          <Button
            kind="primary"
            :class="$style.closeBtn"
            @click="closeFilterInput"
          >
            <XMarkIcon :class="$style.closeIcon" />
          </Button>
        </div>
        <Button
          v-else
          kind="lightgrey"
          :class="$style.saveBtn"
          @click="showFilterInput = true"
        >
          {{ t('catalog.list.save_filters') }}
        </Button>
        <MenuElips
          kind="lightgrey"
          :menu-action-groups="menuActionGroups"
        >
          <template #header>
            <div :class="$style.menuHeader">
              {{ t('catalog.list.saved_filters') }}
            </div>
          </template>
          <template #item="{ item }">
            <div
              v-if="item.template"
              :class="$style.menuItemRow"
            >
              <span :class="$style.menuItemName">{{ item.template.name }}</span>
              <span :class="$style.menuItemRight">{{ formatDate(item.template.timestamp) }}</span>
            </div>
            <span
              v-else
              :class="$style.menuItemName"
            >{{ item.label }}</span>
          </template>
        </MenuElips>
      </div>
    </div>

    <TabGroup
      :selected-index="selectedTab"
      as="div"
      @change="handleTabChange"
    >
      <TabList :class="$style.tabList">
        <template v-if="!isSeller">
          <Tab
            v-if="showInSaleTab"
            :class="$style.tab"
          >
            {{ tabLabels.inSale }}
          </Tab>

          <Tab
            v-if="showInDeliveryTab"
            :class="$style.tab"
          >
            <span class="relative inline-flex items-center">
              <span>{{ tabLabels.inDelivery }}</span>
              <Badge
                v-if="showBadgeOnDelivery"
                :value="totalActiveLogisticUnread"
                class="ml-1"
              />
            </span>
          </Tab>
          <Tab
            v-if="showBoughtTab"
            :class="$style.tab"
          >
            {{ tabLabels.bought }}
          </Tab>
          <Tab
            v-if="showArchiveTab"
            :class="$style.tab"
          >
            {{ tabLabels.archive }}
          </Tab>
          <Tab
            v-if="showFavoritesTab"
            :class="$style.tab"
          >
            {{ tabLabels.favorites }}
          </Tab>
        </template>

        <template v-else>
          <Tab :class="$style.tab">
            {{ tabLabels.inSale }}
          </Tab>
          <Tab
            v-if="showSoldTab"
            :class="$style.tab"
          >
            {{ tabLabels.sold }}
          </Tab>
          <Tab
            v-if="showWithdrawnTab"
            :class="$style.tab"
          >
            {{ tabLabels.withdrawn }}
          </Tab>
          <Tab
            v-if="showDeletedTab"
            :class="$style.tab"
          >
            {{ tabLabels.deleted }}
          </Tab>
        </template>
      </TabList>
    </TabGroup>

    <div :class="$style.catalogLayout">
      <div :class="$style.filterBlock">
        <NuxtLink
          v-if="isSeller"
          :to="{ name: 'personal-listings-id', params: { id: 0 } }"
        >
          <Button
            kind="green"
            :class="$style.addCarBtn"
          >
            <PlusIcon class="w-4 h-4 mr-2" />
            {{ t('catalog.actions.add_car') }}
          </Button>
        </NuxtLink>
        <Filter
          ref="filterComponent"
          v-model:filters="filters"
          :is-seller="isSeller"
          @apply-filters="applyFilters"
          @reset-filters="resetFilters"
        />
      </div>
      <div :class="$style.catalogBlock">
        <div
          ref="catalogHeaderRef"
          :class="$style.catalogHeader"
        >
          <div :class="$style.catalogNavigation">
            <div
              v-if="!isBookedTab && !isSoldTab && !isArchiveTab"
              :class="$style.viewSwitch"
            >
              <Button
                :kind="viewMode === 'list' ? 'black' : 'lightgrey'"
                @click="viewMode = 'list'"
              >
                <ListBulletIcon :class="$style.icon" />
              </Button>
              <Button
                :kind="viewMode === 'tile' ? 'black' : 'lightgrey'"
                @click="viewMode = 'tile'"
              >
                <Squares2X2Icon :class="$style.icon" />
              </Button>
            </div>
            <Pagination
              v-if="showPagination"
              :current-page="pagination.page"
              :total="pagination.total"
              :limit="pagination.perPage"
              :limits="pageSizes"
              :show-limits="false"
              :show-total="false"
              @change-page="onTopPaginationChange"
            />
          </div>
          <div :class="$style.catalogControls">
            <Select
              :model-value="pagination.perPage"
              :options="pageSizes"
              :required="true"
              :class="$style.pageSizeSelect"
              @update:model-value="onPageSizeChange"
            />
            <Select
              v-model="sortType"
              :options="sortOptions"
              :class="$style.sortSelect"
            />
          </div>
        </div>
        <div :class="$style.catalogContent">
          <template v-if="isLoadingLocal">
            <div>{{ t('catalog.list.loading') }}</div>
          </template>
          <template v-else-if="listings.length === 0 && lockedCardCount === 0">
            <div :class="$style.nf">
              {{ t('catalog.list.not_found') }}
            </div>
          </template>
          <template v-else>
            <template v-if="viewMode === 'list'">
              <div
                v-for="listing in listings"
                :key="listing.id"
                :class="$style.listItem"
              >
                <List
                  :name="listing.name"
                  :images="catalogCardImages(listing.photos)"
                  :description-parts="buildDescriptionParts(listing)"
                  :production-date="formatProductionDate(listing.release_year, listing.month)"
                  :price="listing.price"
                  :is-price-locked="listing.price_locked === true"
                  :is-seller="isSeller"
                  :link="getListingLink(listing.id)"
                  :has-diagnostics="!!listing.diagnostic_url"
                  :has-compensation="listing.has_compensation || false"
                  :has-videos="listing.videos.length > 0"
                  :original-paint="!!listing.original_paint"
                  :published-at="listing.created_at || ''"
                  :diagnostic-requested="listing.diagnostic_requested || false"
                  :compensation-requested="listing.compensation_requested || false"
                  :video-requested="listing.video_requested || false"
                  :diagnostic-loaded="listing.diagnostic_loaded || false"
                  :compensation-loaded="listing.compensation_loaded || false"
                  :video-loaded="listing.video_loaded || false"
                  :diagnostic-subscribed="listing.diagnostic_subscribed || false"
                  :booking-requested="listing.booking_requested || false"
                  :refresh-listings="() => handleRefresh()"
                  :visibility="listing.visibility"
                  :total-video="listing.total_video"
                  :total-diagnostic="listing.total_diagnostic"
                  :total-compensation="listing.total_compensation"
                  :total-booking="listing.total_booking"
                  :total-messages="unreadStore.getListingUnreadCount(listing.id)"
                  :kind="cardKind(listing)"
                  :seller-name="listing.seller_name"
                  :logistic-status="listing.logistic_status"
                  :logistic-status-date="listing.logistic_status_date"
                  :purchase-date="listing.purchase_date"
                  :logistic-order-id="listing.logistic_order_id"
                  :buyer-id="listing.buyer_id"
                  :buyer-name="listing.buyer_name"
                  :review-id="listing.review_id || undefined"
                  :deleted="filters.deleted"
                  :sale-status="listing.sale_status"
                  :withdrawn-at="listing.withdrawn_at || ''"
                  :listing-id="listing.id"
                  :show-favorite="showFavoriteButton"
                  :is-favorited="listing.is_favorited || false"
                  @favorite-change="(value) => handleFavoriteChange(listing.id, value)"
                />
              </div>
              <div
                v-for="slot in lockedCardCount"
                :key="`locked-${slot}`"
                :class="$style.listItem"
              >
                <LockedListingCard view="list" />
              </div>
            </template>
            <template v-else>
              <div :class="$style.tileGrid">
                <TileCard
                  v-for="listing in listings"
                  :key="listing.id"
                  :name="listing.name"
                  :images="catalogCardImages(listing.photos)"
                  :description-parts="buildDescriptionParts(listing)"
                  :production-date="formatProductionDate(listing.release_year, listing.month)"
                  :price="listing.price"
                  :is-price-locked="listing.price_locked === true"
                  :is-seller="isSeller"
                  :link="getListingLink(listing.id)"
                  :has-diagnostics="!!listing.diagnostic_url"
                  :has-compensation="listing.has_compensation || false"
                  :has-videos="listing.videos.length > 0"
                  :original-paint="!!listing.original_paint"
                  :published-at="listing.created_at || ''"
                  :diagnostic-requested="listing.diagnostic_requested || false"
                  :compensation-requested="listing.compensation_requested || false"
                  :video-requested="listing.video_requested || false"
                  :diagnostic-loaded="listing.diagnostic_loaded || false"
                  :compensation-loaded="listing.compensation_loaded || false"
                  :video-loaded="listing.video_loaded || false"
                  :diagnostic-subscribed="listing.diagnostic_subscribed || false"
                  :booking-requested="listing.booking_requested || false"
                  :refresh-listings="() => handleRefresh()"
                  :visibility="listing.visibility"
                  :total-video="listing.total_video"
                  :total-diagnostic="listing.total_diagnostic"
                  :total-compensation="listing.total_compensation"
                  :total-booking="listing.total_booking"
                  :total-messages="unreadStore.getListingUnreadCount(listing.id)"
                  :deleted="filters.deleted"
                  :sale-status="listing.sale_status"
                  :listing-id="listing.id"
                  :show-favorite="showFavoriteButton"
                  :is-favorited="listing.is_favorited || false"
                  @favorite-change="(value) => handleFavoriteChange(listing.id, value)"
                />
                <LockedListingCard
                  v-for="slot in lockedCardCount"
                  :key="`locked-${slot}`"
                  view="tile"
                />
              </div>
            </template>
          </template>
        </div>
        <Pagination
          v-if="showPagination"
          :current-page="pagination.page"
          :total="pagination.total"
          :limit="pagination.perPage"
          :limits="pageSizes"
          :show-limits="false"
          :show-total="false"
          @change-page="onBottomPaginationChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed, toRefs, nextTick } from "vue"
import { onBeforeRouteLeave } from "vue-router"
import { TabGroup, TabList, Tab } from "@headlessui/vue"
import { storeToRefs } from "pinia"
import { useI18n } from "vue-i18n"
import { ListBulletIcon, Squares2X2Icon, XMarkIcon } from "@heroicons/vue/24/outline"
import pkg from "lodash"
import { PlusIcon } from "@heroicons/vue/24/solid"
import MenuElips from "@/components/common/MenuElips.vue"
import Button from "@/components/common/Button.vue"
import Select from "@/components/form/Select.vue"
import List from "~/components/catalog/ListCard.vue"
import TileCard from "~/components/catalog/TileCard.vue"
import LockedListingCard from "~/components/catalog/LockedListingCard.vue"
import Filter from "@/components/catalog/Filter.vue"
import Pagination from "@/components/common/Pagination.vue"
import Badge from "@/components/common/Badge.vue"
import { useApiListing } from "~/composables/api/useApiListing"
import useCatalogFilter from "~/composables/useCatalogFilter"
import { useUnreadCountStore } from "@/stores/unreadCount"
import { formatProductionDate } from "@/utils/formatters"
import { SaleStatusBooked, SaleStatusSold, SaleStatusWithdrawn } from "~/constants/catalog"
import type { Filters, SavedFilter, FilterComponent } from "@/types/catalog/filter"
import { catalogCardImages } from "@/utils/catalogImages"
import type { Listing } from "@/types/responses/listing"
import {
  hasCatalogFilterQuery,
  parseCatalogFilterQuery,
  serializeCatalogFilters,
  withoutCatalogFilterQuery,
} from "@/utils/catalogFilterQuery"

interface DescriptionPart {
  text: string
  type?: "powerType" | string
  value?: string
}

const { formatDateTime } = useDate()

const userStore = useUserStore()
const { isSellerClient, isAdmin, isAuthenticated } = storeToRefs(userStore)
const unreadStore = useUnreadCountStore()
const totalActiveLogisticUnread = computed(() => unreadStore.totalActiveLogisticUnread)

interface TabConfig {
  inSale: boolean
  inDelivery: boolean
  inDeliveryShowBadge: boolean
  bought: boolean
  sold: boolean
  withdrawn: boolean
  deleted: boolean
  archive: boolean
  favorites?: boolean
}

const props = withDefaults(defineProps<{
  isSeller?: boolean
  title?: string
  tabConfig?: TabConfig
}>(), {
  isSeller: false,
  tabConfig: () => ({
    inSale: true,
    inDelivery: false,
    inDeliveryShowBadge: true,
    bought: false,
    sold: false,
    withdrawn: false,
    deleted: false,
    archive: false,
    favorites: false,
  }),
})

const { isSeller } = toRefs(props)
const { debounce } = pkg
const isTemporaryState = ref(false)
const { t } = useI18n()
const { index } = useApiListing()
const {
  filterName,
  showFilterInput,
  savedFilters,
  isLoading,
  saveFilter,
  loadSavedFilter,
  fetchSavedFilters,
} = useCatalogFilter()

const filterComponent = ref<FilterComponent | null>(null)

const closeFilterInput = () => {
  showFilterInput.value = false
  filterName.value = ""
}

const selectedTab = ref(0)
const viewMode = ref<"list" | "tile">("list")
const listings = ref<Listing[]>([])
const catalogHeaderRef = ref<HTMLElement | null>(null)
const isLoadingLocal = ref(false)
const pagination = ref({
  page: 1,
  perPage: 20,
  total: 0,
})
const sortType = ref("created_at_desc")
const defaultPageSize = 20
const pageSizes = [
  { id: 1, value: 10, name: 10, disabled: false },
  { id: 2, value: 20, name: 20, disabled: false },
  { id: 3, value: 50, name: 50, disabled: false },
  { id: 4, value: 100, name: 100, disabled: false },
  { id: 5, value: 200, name: 200, disabled: false },
]
const allowedPageSizes = new Set(pageSizes.map(({ value }) => value))
const route = useRoute()
const router = useRouter()
const storageKeySuffix = `${encodeURIComponent(route.path)}:${isAuthenticated.value ? "user" : "guest"}`
const catalogStateKey = `catalogState:${storageKeySuffix}`
const catalogScrollKey = `catalogScrollY:${storageKeySuffix}`
const guestArchiveLockedSlots = 8

const catalogPageSizeKey = "catalogPageSize"
const legacyCatalogPageSizeKeys = [
  "/catalog",
  "/cars",
  "/personal/listings",
].map(path => `catalogPageSize:${encodeURIComponent(path)}`)

const isInitializingCatalog = ref(true)

const showInSaleTab = computed(() => props.tabConfig.inSale)
const showInDeliveryTab = computed(() => props.tabConfig.inDelivery)
const showBoughtTab = computed(() => props.tabConfig.bought)
const showSoldTab = computed(() => props.tabConfig.sold)
const showWithdrawnTab = computed(() => props.tabConfig.withdrawn)
const showDeletedTab = computed(() => props.tabConfig.deleted)
const showArchiveTab = computed(() => props.tabConfig.archive)
const showFavoritesTab = computed(() => !!props.tabConfig.favorites)
const showBadgeOnDelivery = computed(() => props.tabConfig.inDeliveryShowBadge)

const tabLabels = computed(() => ({
  inSale: t("catalog.list.tab_in_sale"),
  inDelivery: t("catalog.list.tab_in_delivery"),
  bought: t("catalog.list.tab_bought"),
  sold: t("catalog.list.tab_sold"),
  withdrawn: t("catalog.list.tab_withdrawn"),
  deleted: t("catalog.list.tab_deleted"),
  archive: t("catalog.list.tab_archive"),
  favorites: t("catalog.list.tab_favorites"),
}))

const activeTabs = computed(() => {
  const tabs = []

  if (props.tabConfig.inSale) {
    tabs.push("inSale")
  }

  if (props.tabConfig.inDelivery) {
    tabs.push("inDelivery")
  }

  if (props.tabConfig.bought) {
    tabs.push("bought")
  }

  if (props.tabConfig.sold) {
    tabs.push("sold")
  }

  if (props.tabConfig.withdrawn) {
    tabs.push("withdrawn")
  }

  if (props.tabConfig.deleted) {
    tabs.push("deleted")
  }

  if (props.tabConfig.archive) {
    tabs.push("archive")
  }

  if (props.tabConfig.favorites) {
    tabs.push("favorites")
  }

  return tabs
})

const isBookedTab = computed(() => {
  if (isSeller.value) {
    const status = filters.value.sale_status
    return !!status && [SaleStatusBooked, SaleStatusSold].includes(status)
  }
  return filters.value.sale_status === SaleStatusBooked
})

const isSoldTab = computed(() => {
  if (isSeller.value) {
    return false
  }
  return filters.value.sale_status === SaleStatusSold
})

const isArchiveTab = computed(() => !!filters.value.archive)
const isFavoritesTab = computed(() => !!filters.value.favorites)
const showFavoriteButton = computed(() => !isSeller.value)

const isGuestArchive = computed(() => isArchiveTab.value && !isAuthenticated.value)

const lockedCardCount = computed(() => {
  if (!isGuestArchive.value) {
    return 0
  }

  const hidden = pagination.value.total - listings.value.length

  return Math.min(Math.max(hidden, 0), guestArchiveLockedSlots)
})

const showPagination = computed(() => !isGuestArchive.value && pagination.value.total > pagination.value.perPage)

const filters = ref<Filters>({
  status: [],
  buyer: undefined,
  seller_id: isSellerClient.value ? "mine" : undefined,
  condition: "all",
  vin: "",
  internal_number: "",
  brand: undefined,
  model: undefined,
  year: { left: undefined, right: undefined },
  displacement: { left: undefined, right: undefined },
  equipment: [],
  price: undefined,
  mileage: undefined,
  gearbox: "all",
  power_type: "all",
  drive_type: "all",
  scale: "all",
  color: "all",
  visibility: "all",
  hasDiagnostics: false,
  hasCompensation: false,
  hasVideo: false,
  original_paint: false,
  sale_status: null,
  bought_at: null,
  deleted: false,
  archive: false,
  favorites: false,
})

const listKind = computed(() => {
  if (isArchiveTab.value) {
    return "archive"
  }
  if (isSoldTab.value) {
    return "bought"
  }
  if (isBookedTab.value) {
    return "delivery"
  }
  return "sale"
})

function cardKind(listing: Listing): "sale" | "delivery" | "bought" | "archive" {
  if (isFavoritesTab.value) {
    if (
      listing.sale_status === SaleStatusWithdrawn
      || listing.sale_status === SaleStatusSold
      || listing.sale_status === SaleStatusBooked
    ) {
      return "archive"
    }

    return "sale"
  }

  return listKind.value
}

const menuActionGroups = computed(() => [
  savedFilters.value.map((filter: SavedFilter) => ({
    label: "",
    template: {
      id: filter.id,
      name: filter.name,
      timestamp: filter.timestamp,
    },
    action: () => handleLoadSavedFilter(filter.id),
    disabled: false,
  })),
])

const baseSortOptions = [
  { id: 0, value: "created_at_desc", name: t("catalog.list.sort_created_at_desc"), disabled: false },
  { id: 1, value: "price_asc", name: t("catalog.list.sort_price_asc"), disabled: false },
  { id: 2, value: "price_desc", name: t("catalog.list.sort_price_desc"), disabled: false },
  { id: 3, value: "year_desc", name: t("catalog.list.sort_year_desc"), disabled: false },
  { id: 4, value: "year_asc", name: t("catalog.list.sort_year_asc"), disabled: false },
  { id: 5, value: "mileage_asc", name: t("catalog.list.sort_mileage_asc"), disabled: false },
  { id: 6, value: "mileage_desc", name: t("catalog.list.sort_mileage_desc"), disabled: false },
  { id: 7, value: "created_at_asc", name: t("catalog.list.sort_created_at_asc"), disabled: false },
]

const deliverySortOptions = [
  { id: 0, value: "created_at_desc", name: t("catalog.list.sort_booked_created_at_desc"), disabled: false },
  { id: 1, value: "created_at_asc", name: t("catalog.list.sort_booked_created_at_asc"), disabled: false },
]

const guestSortOptions = computed(() => baseSortOptions.filter(
  option => option.value !== "price_asc" && option.value !== "price_desc",
))

const sortOptions = computed(() => {
  if (isBookedTab.value || isSoldTab.value) {
    return deliverySortOptions
  }

  return isAuthenticated.value ? baseSortOptions : guestSortOptions.value
})

const translateIfExists = (key: string, value?: string | null): string => {
  if (!value || !t(`${key}.${value}`) || t(`${key}.${value}`) === `${key}.${value}`) {
    return value ?? ""
  }
  return t(`${key}.${value}`)
}

function buildDescriptionParts(listing: Listing): DescriptionPart[] {
  const parts: DescriptionPart[] = []

  if (listing.car?.displacement) {
    const hp = listing.car.horse_power
    const literPart = `${listing.car.displacement} ${t("catalog.list.liter")}`
    const hpPart = hp ? ` (${hp} ${t("catalog.detail.hp")})` : ""
    parts.push({ text: `${literPart}${hpPart}` })
  }

  if (listing.car?.short_power_type || listing.car?.power_type) {
    const engineType = (listing.car.short_power_type || listing.car.power_type) as string
    parts.push({
      text: translateIfExists("cars.power_type", engineType),
      type: "powerType",
      value: engineType,
    })
  }

  if (listing.car?.gearbox) {
    parts.push({ text: translateIfExists("cars.gearbox", listing.car.gearbox) })
  }

  if (listing.car?.common_short_gearbox) {
    parts.push({ text: t("cars.gearbox." + listing.car.common_short_gearbox) })
  }

  if (listing.car?.drive_type) {
    parts.push({ text: translateIfExists("cars.drive_type", listing.car.drive_type) })
  }

  if (listing.mileage) {
    parts.push({
      text: `${t("catalog.list.mileage")} ${new Intl.NumberFormat("ru-RU", {}).format(listing.mileage)} ${t("catalog.list.km")}`,
    })
  }

  if (parts.length === 0) {
    return [{ text: t("catalog.list.no_description").toLowerCase() }]
  }

  return parts.map(part => ({
    ...part,
    text: part.text.toLowerCase(),
  }))
}

const formatDate = (isoDate: string): string => {
  const date = new Date(isoDate)
  return date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" })
}

function handleLoadSavedFilter(filterId: number) {
  if (filterComponent.value?.validateOptions) {
    loadSavedFilter(
      filterId,
      filters.value,
      applyFilters,
      filterComponent.value.validateOptions,
      (tabIndex: number) => {
        selectedTab.value = tabIndex
        if (!isSeller.value && tabIndex === 1) {
          viewMode.value = "list"
        }
      },
    )
  }
}

const debouncedFetchListings = debounce(async (
  page: number = pagination.value.page,
  perPage: number = pagination.value.perPage,
  scrollToList = false,
) => {
  if (isLoadingLocal.value) {
    return
  }
  isLoadingLocal.value = true
  let shouldScrollAfterLoading = false
  try {
    const params: Record<string, any> = {
      offset: (page - 1) * perPage,
      limit: perPage,
      isSeller: isSeller.value,
    }

    const sortMap: Record<string, { sortKey: string, sortDirection: string }> = {
      price_asc: { sortKey: "price", sortDirection: "ascending" },
      price_desc: { sortKey: "price", sortDirection: "descending" },
      year_asc: { sortKey: "release_year", sortDirection: "ascending" },
      year_desc: { sortKey: "release_year", sortDirection: "descending" },
      mileage_asc: { sortKey: "mileage", sortDirection: "ascending" },
      mileage_desc: { sortKey: "mileage", sortDirection: "descending" },
      created_at_asc: { sortKey: "created_at", sortDirection: "ascending" },
      created_at_desc: { sortKey: "created_at", sortDirection: "descending" },
    }
    if (sortMap[sortType.value]) {
      params.sortKey = sortMap[sortType.value].sortKey
      params.sortDirection = sortMap[sortType.value].sortDirection
    }

    params.filter = {}
    if (filters.value.sale_status) {
      params.filter.sale_status = filters.value.sale_status
    }
    if (Array.isArray(filters.value.status) && filters.value.status.length > 0) {
      params.filter.status = filters.value.status
    }
    else if (typeof filters.value.status === "string" && filters.value.status !== "all") {
      params.filter.status = filters.value.status
    }
    if (filters.value.power_type !== "all") {
      params.filter["car.short_power_type"] = filters.value.power_type
    }
    if (filters.value.scale !== "all") {
      params.filter["car.short_scale_type"] = filters.value.scale
    }
    if (filters.value.color !== "all") {
      params.filter["color"] = filters.value.color
    }

    params.filter["deleted"] = filters.value.deleted
    params.filter["archive"] = filters.value.archive
    params.filter["favorites"] = filters.value.favorites

    if (filters.value.gearbox !== "all") {
      params.filter["car.common.short_gearbox"] = filters.value.gearbox
    }
    if (filters.value.drive_type !== "all") {
      params.filter["car.chassis.short_drive_type"] = filters.value.drive_type
    }
    if (filters.value.vin && filters.value.vin.trim()) {
      params.filter.vin = filters.value.vin.trim()
    }
    if ((isSeller.value || isAdmin.value) && filters.value.internal_number && filters.value.internal_number.trim()) {
      params.filter.internal_number = filters.value.internal_number.trim()
    }
    if (filters.value.bought_at && Array.isArray(filters.value.bought_at)) {
      params.filter.bought_at = {}
      if (filters.value.bought_at[0]) {
        params.filter.bought_at.left = formatDateTime(filters.value.bought_at[0], "YYYY-MM-DD")
      }
      if (filters.value.bought_at[1]) {
        params.filter.bought_at.right = formatDateTime(filters.value.bought_at[1], "YYYY-MM-DD")
      }
    }
    if (filters.value.mileage) {
      params.filter["mileage"] = filters.value.mileage
    }
    if (filters.value.price) {
      params.filter["price"] = filters.value.price
    }
    if (filters.value.year.left?.value || filters.value.year.right?.value) {
      params.filter.release_year = {}
      if (filters.value.year.left?.value) {
        params.filter.release_year.left = filters.value.year.left.value
      }
      if (filters.value.year.right?.value) {
        params.filter.release_year.right = filters.value.year.right.value
      }
    }
    if (filters.value.displacement.left?.value || filters.value.displacement.right?.value) {
      params.filter.displacement = {}
      if (filters.value.displacement.left?.value) {
        params.filter.displacement.left = filters.value.displacement.left.value
      }
      if (filters.value.displacement.right?.value) {
        params.filter.displacement.right = filters.value.displacement.right.value
      }
    }
    if (filters.value.condition !== "all") {
      params.filter.condition = filters.value.condition
    }
    if (filters.value.brand && filters.value.brand !== "all") {
      params.filter["car.brand_id"] = filters.value.brand
    }
    if (filters.value.model && filters.value.model !== "all") {
      params.filter["car.model_id"] = filters.value.model
    }
    if (Array.isArray(filters.value.equipment) && filters.value.equipment.length > 0) {
      params.filter["car_id"] = filters.value.equipment
    }
    if (filters.value.buyer && filters.value.buyer !== "all") {
      params.filter.buyer_id = filters.value.buyer
    }
    if (filters.value.seller_id) {
      params.filter.seller_id = filters.value.seller_id
    }
    if (filters.value.visibility && filters.value.visibility !== "all") {
      params.filter.visibility = filters.value.visibility
    }
    if (isSeller.value && filters.value.visibility !== undefined) {
      params.filter.visibility = filters.value.visibility
    }
    if (filters.value.hasVideo) {
      params.filter.hasVideo = filters.value.hasVideo
    }
    if (filters.value.hasDiagnostics) {
      params.filter.hasDiagnostics = filters.value.hasDiagnostics
    }
    if (filters.value.hasCompensation) {
      params.filter.hasCompensation = filters.value.hasCompensation
    }
    if (filters.value.original_paint) {
      params.filter.original_paint = filters.value.original_paint
    }

    const response = await index(params)
    listings.value = response.data || []
    pagination.value = {
      page,
      perPage,
      total: response.meta?.total || 0,
    }

    shouldScrollAfterLoading = scrollToList
  }
  catch {
    listings.value = []
    pagination.value = {
      page: 1,
      perPage,
      total: 0,
    }
  }
  finally {
    isLoadingLocal.value = false

    if (shouldScrollAfterLoading) {
      await nextTick()
      catalogHeaderRef.value?.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }
}, 300)

async function fetchListings(
  page: number = pagination.value.page,
  perPage: number = pagination.value.perPage,
  scrollToList = false,
) {
  await debouncedFetchListings(page, perPage, scrollToList)
}

async function syncFiltersToQuery(filtersToSerialize: Filters = filters.value) {
  await router.replace({
    query: {
      ...withoutCatalogFilterQuery(route.query),
      ...serializeCatalogFilters(filtersToSerialize),
    },
  })
}

async function applyFilters() {
  await syncFiltersToQuery()
  void fetchListings(1)
}

const handleRefresh = async () => {
  await fetchListings(1)
  filterComponent.value?.reloadOptions?.()
}

async function resetFilters() {
  filters.value = {
    status: [],
    buyer: undefined,
    condition: "all",
    vin: "",
    internal_number: "",
    brand: undefined,
    model: undefined,
    year: { left: undefined, right: undefined },
    displacement: { left: undefined, right: undefined },
    equipment: [],
    price: undefined,
    mileage: undefined,
    gearbox: "all",
    power_type: "all",
    drive_type: "all",
    scale: "all",
    color: "all",
    visibility: "all",
    hasDiagnostics: false,
    hasCompensation: false,
    hasVideo: false,
    original_paint: false,
    sale_status: null,
    bought_at: null,
    deleted: false,
    archive: false,
    favorites: filters.value.favorites,
  }
  await syncFiltersToQuery()
  void fetchListings(1)
}

function handleFavoriteChange(listingId: number, isFavorited: boolean) {
  listings.value = listings.value.map(listing => listing.id === listingId
    ? { ...listing, is_favorited: isFavorited }
    : listing)

  if (!isFavoritesTab.value || isFavorited) {
    return
  }

  listings.value = listings.value.filter(listing => listing.id !== listingId)
  pagination.value = {
    ...pagination.value,
    total: Math.max(0, pagination.value.total - 1),
  }

  if (listings.value.length === 0 && pagination.value.page > 1) {
    void fetchListings(pagination.value.page - 1)
  }
}

function handlePaginationChange(
  { currentPage, limit }: { currentPage: number, limit: number },
  scrollOnPageChange: boolean,
) {
  const page = limit === pagination.value.perPage ? currentPage : 1
  const shouldScrollToList = scrollOnPageChange
    && limit === pagination.value.perPage
    && page !== pagination.value.page

  if (import.meta.client && allowedPageSizes.has(limit)) {
    localStorage.setItem(catalogPageSizeKey, limit.toString())
  }

  fetchListings(page, limit, shouldScrollToList)
}

function onTopPaginationChange(data: { currentPage: number, limit: number }) {
  handlePaginationChange(data, false)
}

function onBottomPaginationChange(data: { currentPage: number, limit: number }) {
  handlePaginationChange(data, true)
}

function onPageSizeChange(value: string | number | undefined) {
  const limit = Number(value)

  if (!allowedPageSizes.has(limit)) {
    return
  }

  pagination.value = {
    ...pagination.value,
    page: 1,
    perPage: limit,
  }
  handlePaginationChange({ currentPage: 1, limit }, false)
}

function getListingLink(listingId: number) {
  if (isSeller.value) {
    return { name: "personal-listings-id", params: { id: listingId } }
  }

  if (route.name === "cars") {
    return { name: "catalog-id", params: { id: listingId }, query: { from: "cars" } }
  }

  return { name: "catalog-id", params: { id: listingId } }
}

watch(sortType, () => {
  if (isInitializingCatalog.value) {
    return
  }
  fetchListings(1)
}, { immediate: false })

function resetTabFilters() {
  filters.value = {
    sale_status: filters.value.sale_status,
    visibility: filters.value.visibility,
    status: [],
    buyer: undefined,
    condition: "all",
    brand: undefined,
    model: undefined,
    year: { left: undefined, right: undefined },
    displacement: { left: undefined, right: undefined },
    equipment: [],
    price: undefined,
    mileage: undefined,
    gearbox: "all",
    power_type: "all",
    drive_type: "all",
    scale: "all",
    color: "all",
    hasVideo: false,
    original_paint: false,
    hasDiagnostics: false,
    hasCompensation: false,
    vin: "",
    internal_number: "",
    bought_at: null,
    deleted: filters.value.deleted,
    archive: filters.value.archive,
    favorites: false,
  }
}

async function handleTabChange(index: number, shouldFetch = true, shouldSyncQuery = true) {
  selectedTab.value = index
  const tabType = activeTabs.value[index]

  resetTabFilters()

  if (tabType === "inSale") {
    filters.value.sale_status = null
    filters.value.visibility = "all"
    filters.value.deleted = false
    filters.value.archive = false
    filters.value.favorites = false
  }
  else if (tabType === "inDelivery") {
    filters.value.sale_status = SaleStatusBooked
    filters.value.visibility = undefined
    filters.value.deleted = false
    filters.value.archive = false
    filters.value.favorites = false
    viewMode.value = "list"
    sortType.value = "created_at_desc"
  }
  else if (tabType === "bought") {
    filters.value.sale_status = SaleStatusSold
    filters.value.visibility = undefined
    filters.value.deleted = false
    filters.value.archive = false
    filters.value.favorites = false
    sortType.value = "created_at_desc"
  }
  else if (tabType === "sold") {
    filters.value.sale_status = SaleStatusBooked
    filters.value.visibility = undefined
    filters.value.deleted = false
    filters.value.archive = false
    filters.value.favorites = false
  }
  else if (tabType === "withdrawn") {
    filters.value.sale_status = SaleStatusWithdrawn
    filters.value.visibility = undefined
    filters.value.deleted = false
    filters.value.archive = false
    filters.value.favorites = false
  }
  else if (tabType === "deleted") {
    filters.value.sale_status = null
    filters.value.deleted = true
    filters.value.archive = false
    filters.value.favorites = false
  }
  else if (tabType === "archive") {
    filters.value.sale_status = null
    filters.value.visibility = undefined
    filters.value.deleted = false
    filters.value.archive = true
    filters.value.favorites = false
  }
  else if (tabType === "favorites") {
    filters.value.sale_status = null
    filters.value.visibility = "all"
    filters.value.deleted = false
    filters.value.archive = false
    filters.value.favorites = true
  }

  if (shouldSyncQuery) {
    await syncFiltersToQuery()
  }

  if (shouldFetch) {
    void fetchListings(1)
  }
  filterComponent.value?.reloadOptions?.()
}

const pageTitle = computed(() => {
  if (props.title) {
    return props.title
  }
  const onlyInSale = props.tabConfig.inSale && !props.tabConfig.inDelivery && !props.tabConfig.bought
  return onlyInSale ? t("catalog.list.title") : t("catalog.my_cars_title")
})

onBeforeRouteLeave(() => {
  if (import.meta.client && !isTemporaryState.value) {
    sessionStorage.setItem(catalogScrollKey, window.scrollY.toString())
    sessionStorage.setItem(catalogStateKey, JSON.stringify({
      filters: filters.value,
      pagination: pagination.value,
      selectedTab: selectedTab.value,
      viewMode: viewMode.value,
      sortType: sortType.value,
    }))
  }
  else if (import.meta.client) {
    sessionStorage.removeItem(catalogScrollKey)
    sessionStorage.removeItem(catalogStateKey)
  }
})

onMounted(async () => {
  const rawStoredPageSize = localStorage.getItem(catalogPageSizeKey)
  let preferredPageSize = Number(rawStoredPageSize)

  if (rawStoredPageSize === null) {
    const currentLegacyKey = `catalogPageSize:${storageKeySuffix}`
    const orderedLegacyKeys = [
      currentLegacyKey,
      ...legacyCatalogPageSizeKeys.filter(key => key !== currentLegacyKey),
    ]
    const legacyPageSize = orderedLegacyKeys
      .map(key => Number(localStorage.getItem(key)))
      .find(value => allowedPageSizes.has(value))

    preferredPageSize = legacyPageSize ?? defaultPageSize
  }
  else if (!allowedPageSizes.has(preferredPageSize)) {
    preferredPageSize = defaultPageSize
  }

  localStorage.setItem(catalogPageSizeKey, preferredPageSize.toString())
  legacyCatalogPageSizeKeys.forEach((key) => {
    localStorage.removeItem(key)
  })
  pagination.value.perPage = preferredPageSize

  if (props.tabConfig.inDelivery && !props.tabConfig.inSale) {
    sessionStorage.removeItem(catalogStateKey)
    sessionStorage.removeItem(catalogScrollKey)
  }

  const stateTab = window.history.state?.tabIndex
  const isTemporary = window.history.state?.temporary === true
  const hasStateTab = stateTab !== undefined && stateTab !== null

  if (hasCatalogFilterQuery(route.query)) {
    await handleTabChange(0, false, false)
    await nextTick()

    const queryFilters = parseCatalogFilterQuery(route.query, filters.value)
    if (filterComponent.value?.validateOptions) {
      const validated = await filterComponent.value.validateOptions(queryFilters)
      filters.value = validated.filters
    }
    else {
      filters.value = queryFilters
    }

    pagination.value.page = 1
    await syncFiltersToQuery()
    isInitializingCatalog.value = false
    await fetchListings(1, pagination.value.perPage)
    if (isAuthenticated.value) {
      await fetchSavedFilters()
    }
    return
  }

  let savedState: any = null

  if (!hasStateTab && import.meta.client) {
    const rawState = sessionStorage.getItem(catalogStateKey)
    if (rawState) {
      savedState = JSON.parse(rawState)
    }
  }

  if (hasStateTab) {
    isTemporaryState.value = isTemporary
    await handleTabChange(Number(stateTab))
  }
  else if (savedState && props.tabConfig.inSale) {
    const expectedSaleStatus = props.tabConfig.inSale ? null : SaleStatusBooked
    const savedSaleStatus = savedState.filters?.sale_status

    if (savedSaleStatus !== expectedSaleStatus) {
      sessionStorage.removeItem(catalogStateKey)
      sessionStorage.removeItem(catalogScrollKey)
      isTemporaryState.value = false
      await handleTabChange(0)
    }
    else {
      isTemporaryState.value = false
      filters.value = {
        ...savedState.filters,
        status: Array.isArray(savedState.filters?.status)
          ? savedState.filters.status
          : (!savedState.filters?.status || savedState.filters.status === "all" ? [] : [savedState.filters.status]),
      }
      const savedPerPage = Number(savedState.pagination?.perPage)
      pagination.value = {
        ...savedState.pagination,
        page: savedPerPage === preferredPageSize ? savedState.pagination.page : 1,
        perPage: preferredPageSize,
      }
      selectedTab.value = savedState.selectedTab
      viewMode.value = savedState.viewMode
      sortType.value = savedState.sortType

      await syncFiltersToQuery()
      await fetchListings(pagination.value.page, pagination.value.perPage)

      const savedScrollY = sessionStorage.getItem(catalogScrollKey)
      if (savedScrollY) {
        setTimeout(() => window.scrollTo(0, parseInt(savedScrollY)), 300)
      }
    }
  }
  else {
    isTemporaryState.value = false
    await handleTabChange(0)
  }

  isInitializingCatalog.value = false
  if (isAuthenticated.value) {
    await fetchSavedFilters()
  }
})
</script>

<style module>
.topBlock {
  @apply flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6;
}

.title {
  @apply text-3xl font-extrabold;
}

.actions {
  @apply flex flex-row gap-2 items-center justify-end;
}

.saveFilterContainer {
  @apply flex items-center gap-2;
}

.filterNameInput {
  @apply border border-gray-300 rounded p-2 min-w-[200px];
}

.saveBtn {
  @apply whitespace-nowrap;
}

.closeBtn {
  @apply p-2 h-10 w-10 flex items-center justify-center;
}

.closeIcon {
  @apply w-4 h-4;
}

.menuHeader {
  @apply px-3 py-2 text-sm text-gray-500 font-normal;
}

.menuItemRow {
  @apply flex flex-row items-center justify-between w-full cursor-pointer;
}

.menuItemName {
  @apply text-sm text-black mr-2;
}

.menuItemRight {
  @apply text-sm text-gray-500 text-right flex-1;
}

.tabList {
  @apply flex mb-8;
}

.tab {
  @apply px-4 py-2 focus:outline-none transition-colors duration-150 border-b text-center cursor-pointer whitespace-nowrap;
}

.tab[data-headlessui-state~='selected'] {
  @apply bg-transparent font-bold border-b-2 border-b-black;
}

.tab[data-headlessui-state~='unselected'] {
  @apply bg-gray-100 border-b border-gray-300;
}

.catalogLayout {
  @apply flex flex-col gap-6;
}

.filterBlock {
  @apply w-full;
}

.catalogBlock {
  @apply w-full;
}

.catalogHeader {
  @apply flex items-center justify-between mb-6 mt-7;
  scroll-margin-top: 1rem;
}

.catalogControls {
  @apply flex items-center gap-4 ml-auto;
}

.catalogNavigation {
  @apply flex items-center gap-4;
}

.viewSwitch {
  @apply flex gap-2;
}

.icon {
  @apply w-5 h-5;
}

.sortSelect {
  @apply w-64;
}

.pageSizeSelect {
  @apply w-32;
}

.catalogContent {
  @apply rounded-xl border border-gray-100 bg-white p-6 mb-5;
}

.listItem {
  @apply pb-6 mb-6 border-b border-gray-200 last:mb-0 last:pb-0 last:border-b-0 w-full;
}

.tileGrid {
  @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6;
}

.nf {
  @apply relative px-4 py-5 sm:px-6 text-center text-gray-500 italic;
}

.addCarBtn {
  @apply mb-4 w-full md:w-auto;
}

@media (max-width: 640px) {
  .catalogHeader {
    @apply flex-wrap gap-4;
  }

  .catalogControls {
    @apply w-full ml-0;
  }

  .catalogNavigation {
    @apply w-full flex-wrap;
  }

  .pageSizeSelect {
    @apply w-1/3;
  }

  .sortSelect {
    @apply flex-1 w-auto;
  }
}
</style>
