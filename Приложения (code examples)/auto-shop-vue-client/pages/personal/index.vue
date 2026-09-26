<template>
  <div :class="$style.wrapper">
    <div :class="$style.layoutGrid">
      <aside :class="$style.sidebar">
        <DashboardMenu :items="menuItems" />
      </aside>

      <main :class="$style.content">
        <div :class="$style.cardsGrid">
          <DashboardWidget
            v-for="card in dashboardCards"
            :key="card.id"
            :title="card.title"
            :description="card.description"
            :count="card.count"
            :route-name="card.routeName"
            :route-state="card.routeState"
          />
          <DashboardWidget
            v-if="isAdmin || isLogist"
            :title="t('admin_main.calc_title')"
            route-name="admin-calc-delivery"
            :description="''"
          >
            <div :class="$style.adminLinks">
              <NuxtLink
                :to="{ name: 'admin-calc-delivery' }"
                :class="$style.adminLink"
              >
                {{ t('admin_main.calc_delivery') }}
              </NuxtLink>

              <NuxtLink
                :to="{ name: 'admin-calc-expenses' }"
                :class="$style.adminLink"
              >
                {{ t('admin_main.china_expenses') }}
              </NuxtLink>
            </div>
          </DashboardWidget>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { storeToRefs } from "pinia"
import { useI18n } from "vue-i18n"
import { useUserStore } from "~/stores/user"
import { useUnreadCountStore } from "~/stores/unreadCount"
import { useNavigation } from "~/composables/useNavigation"
import { useApiDashboard } from "~/composables/api/useApiDashboard"
import DashboardMenu, { type MenuItem } from "~/components/dashboard/Menu.vue"
import DashboardWidget from "~/components/dashboard/Widget.vue"
import type { DashboardData } from "~/types/responses/dashboard"

definePageMeta({
  auth: true,
  layout: "personal",
  hideBread: true,
  hideTitle: true,
})

const { t } = useI18n()
const userStore = useUserStore()
const unreadStore = useUnreadCountStore()
const { checkPermission } = useNavigation()

const { isBuyer, isLogist, isAdmin, isSellerContent, isSellerSearch, isAnySeller } = storeToRefs(userStore)
const { counts: unreadCounts, totalActiveLogisticUnread } = storeToRefs(unreadStore)

const apiDashboard = useApiDashboard()

const { data: dashboardRes } = await useAsyncData(
  "personal-dashboard",
  () => apiDashboard.show(),
)

const dashboard = computed<DashboardData | null>(() => dashboardRes.value?.data ?? null)

const carsCount = computed<number | undefined>(() => {
  const d = dashboard.value
  if (!d) {
    return undefined
  }
  return isBuyer.value ? d.listingsOnSale : d.activeListings
})

const historyCount = computed<number | undefined>(() => {
  const d = dashboard.value
  if (!d) {
    return undefined
  }
  return isBuyer.value ? d.purchasedListings : d.soldListings
})

const chatsCount = computed<number>(() => unreadCounts.value?.chats || 0)

const logisticCount = computed<number>(() => {
  const d = dashboard.value
  if (isBuyer.value) {
    return totalActiveLogisticUnread.value || 0
  }
  if ((isLogist.value || isAdmin.value) && d?.activeLogisticOrders != null) {
    return d.activeLogisticOrders
  }
  return 0
})

const listingRequestsCount = computed<number>(() => {
  const d = dashboard.value
  if (isBuyer.value || isAnySeller.value) {
    return unreadCounts.value?.listingRequests || 0
  }
  if (isAdmin.value && d?.activeListingRequests != null) {
    return d.activeListingRequests
  }
  return 0
})

const searchRequestsCount = computed<number>(() => {
  const d = dashboard.value
  if (isBuyer.value || isSellerSearch.value) {
    return unreadCounts.value?.searchRequests || 0
  }
  if (isAdmin.value && d?.activeSearchRequests != null) {
    return d.activeSearchRequests
  }
  return 0
})

const carLinksCount = computed<number>(() => {
  const d = dashboard.value
  if (isAdmin.value && d?.unreadCarLinks != null) {
    return d.unreadCarLinks
  }
  return unreadCounts.value?.carLinks || 0
})

const usersCount = computed<number>(() => dashboard.value?.activeUsers || 0)
const companiesCount = computed<number>(() => dashboard.value?.activeCompanies || 0)
const brandsCount = computed<number>(() => dashboard.value?.activeBrands || 0)
const reviewsCount = computed<number>(() => dashboard.value?.reviewsCount || 0)

interface DashboardItemConfig {
  id: string
  menuLabel: string
  cardTitle: string
  cardDesc: string
  routeName: string
  routeState?: Record<string, any>
  count?: number
  showInMenu?: boolean
  showInCards?: boolean
}

const allItems = computed<DashboardItemConfig[]>(() => [
  {
    id: "cars",
    menuLabel: isBuyer.value ? t("dashboard.menu.cars_desc_buyer") : t("dashboard.menu.cars_desc_seller"),
    cardTitle: t("dashboard.index.cars_title"),
    cardDesc: isBuyer.value ? t("dashboard.index.cars_desc_buyer") : t("dashboard.index.cars_desc_seller"),
    routeName: isBuyer.value ? "catalog" : "personal-listings",
    routeState: {
      tabIndex: 0,
      temporary: true,
    },
    count: carsCount.value,
    showInMenu: true,
    showInCards: true,
  },
  {
    id: "chats",
    menuLabel: t("dashboard.menu.chats"),
    cardTitle: t("dashboard.index.chats_title"),
    cardDesc: isBuyer.value ? t("dashboard.index.chats_desc_buyer") : t("dashboard.index.chats_desc_seller"),
    routeName: "personal-chats",
    count: chatsCount.value,
    showInMenu: true,
    showInCards: true,
  },
  {
    id: "requests",
    menuLabel: t("dashboard.menu.listing_requests"),
    cardTitle: "",
    cardDesc: "",
    routeName: "personal-events",
    count: listingRequestsCount.value,
    showInMenu: true,
    showInCards: false,
  },
  {
    id: "history",
    menuLabel: isBuyer.value ? t("dashboard.menu.history_buyer") : t("dashboard.menu.history_seller"),
    cardTitle: "",
    cardDesc: "",
    routeName: isBuyer.value ? "catalog" : "personal-listings",
    routeState: {
      tabIndex: 1,
      temporary: true,
    },
    count: historyCount.value,
    showInMenu: true,
    showInCards: false,
  },
  {
    id: "needs",
    menuLabel: t("dashboard.menu.needs"),
    cardTitle: t("dashboard.index.needs_title"),
    cardDesc: isBuyer.value ? t("dashboard.index.needs_desc_buyer") : t("dashboard.index.needs_desc_seller"),
    routeName: "personal-needs",
    count: searchRequestsCount.value,
    showInMenu: true,
    showInCards: true,
  },
  {
    id: "links",
    menuLabel: t("dashboard.menu.links"),
    cardTitle: t("dashboard.index.links_title"),
    cardDesc: isBuyer.value ? t("dashboard.index.links_desc_buyer") : t("dashboard.index.links_desc_seller"),
    routeName: "personal-links",
    count: carLinksCount.value,
    showInMenu: true,
    showInCards: true,
  },
  {
    id: "calc",
    menuLabel: t("dashboard.menu.calc"),
    cardTitle: t("dashboard.index.calc_title"),
    cardDesc: t("dashboard.index.calc_desc"),
    routeName: "personal-calc",
    showInMenu: true,
    showInCards: true,
  },
  {
    id: "logistic",
    menuLabel: t("dashboard.menu.logistic"),
    cardTitle: t("dashboard.index.logistic_title"),
    cardDesc: t("dashboard.index.logistic_desc"),
    routeName: "personal-logistic",
    count: logisticCount.value,
    showInMenu: true,
    showInCards: true,
  },
  {
    id: "china_expenses",
    menuLabel: t("dashboard.menu.china_expenses"),
    cardTitle: "",
    cardDesc: "",
    routeName: "personal-china-expenses",
    showInMenu: true,
    showInCards: false,
  },
  {
    id: "reviews",
    menuLabel: t("dashboard.menu.reviews"),
    cardTitle: "",
    cardDesc: "",
    routeName: isAdmin.value
      ? "personal-reviews"
      : (isBuyer.value ? "catalog" : "personal-listings"),
    routeState: isAdmin.value
      ? undefined
      : {
          tabIndex: isBuyer.value ? 2 : 1,
          temporary: true,
        },
    showInMenu: true,
    showInCards: false,
    count: reviewsCount.value,
  },
  {
    id: "admin_balances",
    menuLabel: t("dashboard.menu.balances"),
    cardTitle: "", cardDesc: "",
    routeName: "admin-clients-balances",
    showInMenu: true,
    showInCards: false,
  },
  {
    id: "admin_companies",
    menuLabel: t("dashboard.menu.companies"),
    cardTitle: "", cardDesc: "",
    routeName: "admin-clients-companies",
    showInMenu: true,
    showInCards: false,
    count: companiesCount.value,
  },
  {
    id: "admin_china_expenses",
    menuLabel: t("dashboard.menu.admin_china_expenses"),
    cardTitle: "", cardDesc: "",
    routeName: "admin-china-expenses",
    showInMenu: true,
    showInCards: false,
  },
  {
    id: "admin_users",
    menuLabel: t("dashboard.menu.users"),
    cardTitle: "", cardDesc: "",
    routeName: "admin-clients-users",
    showInMenu: true,
    showInCards: false,
    count: usersCount.value,
  },
  {
    id: "admin_brands",
    menuLabel: t("dashboard.menu.brands"),
    cardTitle: "", cardDesc: "",
    routeName: "admin-brands",
    showInMenu: true,
    showInCards: false,
    count: brandsCount.value,
  },
  {
    id: "admin_subscriptions",
    menuLabel: t("dashboard.menu.subscriptions"),
    cardTitle: t("dashboard.index.subscriptions_title"),
    cardDesc: t("dashboard.index.subscriptions_desc"),
    routeName: "admin-subscriptions",
    showInMenu: true,
    showInCards: true,
  },
  {
    id: "admin_auto_assign",
    menuLabel: t("dashboard.menu.auto_assign"),
    cardTitle: "", cardDesc: "",
    routeName: "admin-settings-auto-assign",
    showInMenu: true,
    showInCards: false,
  },
])

const allowedIds = computed<string[]>(() => {
  if (isSellerContent.value) {
    return ["cars", "chats", "requests"]
  }
  if (isSellerSearch.value) {
    return ["cars", "chats", "requests", "needs"]
  }
  if (isLogist.value) {
    return ["logistic", "chats", "calc"]
  }
  const ids = [
    "cars", "chats", "requests", "history", "needs", "links", "calc", "logistic", "china_expenses", "reviews",
    "admin_balances", "admin_companies", "admin_china_expenses", "admin_users", "admin_brands", "admin_subscriptions", "admin_auto_assign",
  ]

  return isAdmin.value ? ids.filter(itemId => itemId !== "china_expenses") : ids
})

const menuItems = computed<MenuItem[]>(() => {
  const list: MenuItem[] = [
    {
      label: t("dashboard.menu.main"),
      routeName: "personal",
    },
  ]

  const items = allItems.value
    .filter(item => item.showInMenu && allowedIds.value.includes(item.id))
    .filter(item => checkPermission({ name: item.routeName }))
    .map(item => ({
      label: item.menuLabel,
      routeName: item.routeName,
      count: item.count,
      routeState: item.routeState,
    }))

  return [...list, ...items]
})

interface DashboardCard {
  id: string
  title: string
  count?: number
  description: string
  routeName: string
  routeState?: Record<string, any>
}

const dashboardCards = computed<DashboardCard[]>(() => {
  return allItems.value
    .filter(item => item.showInCards && allowedIds.value.includes(item.id))
    .filter(item => checkPermission({ name: item.routeName }))
    .map(item => ({
      id: item.id,
      title: item.cardTitle,
      description: item.cardDesc,
      routeName: item.routeName,
      count: item.count,
      routeState: item.routeState,
    }))
})
</script>

<style module>
.wrapper {
  @apply w-full py-8;
}

.layoutGrid {
  @apply flex flex-col md:flex-row gap-6 items-stretch;
}

.sidebar {
  @apply w-full md:w-1/4 lg:w-1/5;
}

.content {
  @apply w-full md:w-3/4 lg:w-4/5;
}

.cardsGrid {
  @apply grid grid-cols-1 md:grid-cols-2 gap-6;
}

.adminLinks {
  @apply flex flex-col gap-3;
}

.adminLink {
  @apply text-blue-600 hover:text-blue-800 hover:underline font-medium text-base;
}
</style>
