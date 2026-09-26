import type { User as UserResponses } from "@/types/responses/user"
import {
  RoleAdmin,
  RoleCompany,
  RoleDirector,
  RoleEmployee,
  RoleLogistic,
  RoleSellerClient,
  RoleSellerContent,
  RoleSellerSearch,
} from "@/constants/roles"

export const useUserStore = defineStore("user", () => {
  const user: Ref<UserResponses | null> = ref(null)
  const isAuthenticated = computed(() => !!user.value)
  const isVerified = computed(() => !!user.value?.email_verified_at)
  const role = computed<string | null>(() => user.value?.role ?? null)
  const currentUserId = computed<number | null>(() => user.value?.id ?? null)

  const isAdmin = computed(() => role.value === RoleAdmin)
  const isSeller = computed(() => role.value === RoleSellerContent)
  const isLogist = computed(() => role.value === RoleLogistic)
  const isBuyer = computed(() => {
    return role.value === RoleCompany
      || role.value === RoleDirector
      || role.value === RoleEmployee
  })
  const isSellerContent = computed(() => role.value === RoleSellerContent)
  const isSellerSearch = computed(() => role.value === RoleSellerSearch)
  const isSellerClient = computed(() => role.value === RoleSellerClient)
  const isAnySeller = computed(() => {
    return role.value === RoleSellerContent
      || role.value === RoleSellerSearch
      || role.value === RoleSellerClient
  })
  const isDirector = computed(() => role.value === RoleDirector)
  const isEmployee = computed(() => role.value === RoleEmployee)
  const canViewNotifications = computed(() => {
    return isAdmin.value
      || isSellerClient.value
      || isSellerSearch.value
      || isSellerContent.value
      || isDirector.value
      || isEmployee.value
  })

  const setUser = (_user: UserResponses | null) => {
    user.value = _user
  }

  const clearUser = (): void => {
    setUser(null)
  }

  return {
    user,
    isAuthenticated,
    isVerified,
    setUser,
    clearUser,
    currentUserId,
    isAdmin,
    isSeller,
    isBuyer,
    isLogist,
    isSellerContent,
    isSellerSearch,
    isSellerClient,
    isAnySeller,
    isDirector,
    isEmployee,
    canViewNotifications,
  }
})
