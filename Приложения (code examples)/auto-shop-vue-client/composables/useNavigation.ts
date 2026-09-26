import { DocumentTextIcon } from "@heroicons/vue/24/outline"
import { storeToRefs } from "pinia"
import { computed } from "vue"
import type { NavigationItem } from "@/types/common/navigation"
import { useUserStore } from "@/stores/user"
import { useUnreadCountStore } from "@/stores/unreadCount"

export function useNavigation() {
  const { hasRequiredRoles } = usePermission()
  const router = useRouter()
  const userStore = useUserStore()
  const unreadStore = useUnreadCountStore()

  const { isAdmin, isDirector, isSellerContent } = storeToRefs(userStore)
  const { counts, totalLogisticUnread } = storeToRefs(unreadStore)

  const listingRequestsTotal = computed(() => counts.value.listingRequests)

  const withCount = (key: string, count?: number) => {
    const n = count ?? 0
    return n > 0 ? { key: `navigation.${key}`, count: n } : { key: `navigation.${key}`, count: null }
  }

  const personalInfoNavigation = [
    { name: "personal-info-offer", icon: DocumentTextIcon },
    { name: "personal-info-policy", icon: DocumentTextIcon },
  ]

  const personalProfileNavigation = computed(() => {
    if (isAdmin.value) {
      return [
        { name: "personal-profile" },
        { name: "admin-clients-balances" },
        { name: "admin-clients-companies" },
        { name: "admin-clients-users" },
        { name: "personal-reviews" },
        { name: "admin-brands" },
        { name: "admin-source-checks" },
        { name: "admin-notification-stats" },
      ]
    }

    return [
      { name: "personal-profile" },
      ...(isDirector.value ? [{ name: "personal-users" }] : []),
      ...(isDirector.value ? [{ name: "personal-china-expenses" }] : []),
      ...(isDirector.value ? [{ name: "personal-balances-main" }] : []),
      ...(isDirector.value ? [{ name: "personal-balances-deposits" }] : []),
    ]
  })

  const personalTopNavigation = computed<Array<NavigationItem>>(() => {
    const items: Array<NavigationItem> = [
      { name: "catalog" },
      { name: "cars" },
      { name: "personal-listings" },
      { name: "personal-events", label: withCount("personal-events", listingRequestsTotal.value) },
      { name: "personal-calc" },
      { name: "personal-needs", label: withCount("personal-needs", counts.value.chatsBySubject?.search_request ?? 0) },
      { name: "personal-links", label: withCount("personal-links", counts.value.carLinks) },
      { name: "personal-chats", label: withCount("personal-chats", counts.value.chats) },
      { name: "personal-logistic", label: withCount("personal-logistic", totalLogisticUnread.value) },
    ]

    if (isSellerContent.value) {
      const restrictedForContent = ["personal-needs", "personal-logistic", "personal-links"]
      return items.filter(item => !restrictedForContent.includes(item.name))
    }

    return items
  })

  const name = (n: string) => "navigation." + n
  const description = (n: string) => "navigation." + n + "_description"

  const current = (item: NavigationItem): boolean => {
    const route = useRoute()
    if (!route.name) {
      return false
    }
    const currentName = route.name.toString()
    const baseName = item.name.toString()
    if (currentName === baseName || currentName.startsWith(`${baseName}-`)) {
      return true
    }
    if (item.children?.some(child => currentName === child.name || currentName.startsWith(`${child.name}-`))) {
      return true
    }
    return false
  }

  const checkPermission = (item: NavigationItem) => {
    const routeRoles = router.resolve({ name: item.name }).meta.roles
    if (!routeRoles) {
      return true
    }
    return hasRequiredRoles(routeRoles)
  }

  return {
    personalInfoNavigation,
    personalProfileNavigation,
    personalTopNavigation,
    name,
    description,
    current,
    checkPermission,
  }
}
