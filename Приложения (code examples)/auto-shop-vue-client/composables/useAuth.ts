import { ref } from "vue"
import type { SigIn as SigInRequest, EmailPhonePayload } from "@/types/requests/auth/sigIn"
import type { SigUp as SigUpRequest } from "@/types/requests/auth/sigUp"
import type { LoginCodeRequest } from "@/types/requests/auth/loginCode"
import type { VerifyEmail as VerifyEmailRequest } from "@/types/requests/auth/verifyEmail"
import type { SignInOptions } from "@/types/common/signInOptions"
import type { AuthMiddlewareMeta, AuthMiddlewareMetaNormalized } from "@/types/common/authMiddlewareMeta"
import type Response from "@/types/responses/response"
import { loginPage, personalPage } from "@/constants/pages"
import { useNotificationStore } from "@/stores/notification"
import Errors from "@/classes/errors"

let refreshTimer: ReturnType<typeof setInterval> | null = null

export default function useAuth() {
  const { profile: _profile } = useApiProfile()
  const {
    login: _login,
    register: _register,
    refresh: _refresh,
    logout: _logout,
    verifyEmail: _verifyEmail,
    requestCode: _requestCode,
    loginWithCode: _loginWithCode,
    resetWithCode: _resetWithCode,
  } = useApiAuth()

  const errors = ref(new Errors())

  const clearErrors = (field?: string) => {
    errors.value.clear(field)
  }

  function normalizeUserOptions(userOptions: AuthMiddlewareMeta | undefined): AuthMiddlewareMetaNormalized | undefined {
    if (typeof userOptions === "boolean" || userOptions === undefined) {
      return userOptions !== false
        ? {
            unauthenticatedOnly: false,
            navigateAuthenticatedTo: personalPage,
            navigateUnauthenticatedTo: undefined,
          } as AuthMiddlewareMetaNormalized
        : undefined
    }

    if (typeof userOptions === "object") {
      if (userOptions.unauthenticatedOnly === undefined) {
        userOptions.unauthenticatedOnly = true
      }

      return {
        unauthenticatedOnly: userOptions.unauthenticatedOnly,
        navigateAuthenticatedTo: userOptions.navigateAuthenticatedTo ?? personalPage,
        navigateUnauthenticatedTo: userOptions.navigateUnauthenticatedTo,
      } as AuthMiddlewareMetaNormalized
    }
  }

  async function handleAuthResponse(
    apiCall: () => Promise<Response<any>>,
    signInOptions?: SignInOptions,
  ): Promise<any> {
    const tokenStore = useTokenStore()
    const userStore = useUserStore()
    errors.value.clear()
    try {
      const response = await apiCall()
      if (!response.data?.access_token) {
        return
      }
      if (!response.data?.user) {
        return
      }
      tokenStore.setToken(response.data.access_token)
      userStore.setUser(response.data.user)

      await fetch()

      const { callbackUrl = undefined } = signInOptions ?? {}
      if (callbackUrl) {
        return navigateTo(callbackUrl)
      }
    }
    catch (error: any) {
      const _error = (error?.data as Response<any>) || {}
      if (_error.errors) {
        Object.entries(_error.errors).forEach(([key, value]) => {
          errors.value.set({ path: key, value: value as string })
        })
      }
      throw error
    }
  }

  const signIn = async (param: SigInRequest, signInOptions?: SignInOptions): Promise<any> => {
    return handleAuthResponse(() => _login(param), signInOptions)
  }

  const signUp = async (param: SigUpRequest, signInOptions?: SignInOptions): Promise<any> => {
    errors.value.clear()
    try {
      await _register(param)
      const { callbackUrl = undefined } = signInOptions ?? {}
      if (callbackUrl) {
        return navigateTo(callbackUrl)
      }
    }
    catch (error: any) {
      const _error = (error?.data as Response<any>) || {}
      if (_error.errors) {
        Object.entries(_error.errors).forEach(([key, value]) => {
          errors.value.set({ path: key, value: value as string })
        })
      }
      throw error
    }
  }

  const signOut = async (signInOptions?: SignInOptions): Promise<any> => {
    const tokenStore = useTokenStore()
    const userStore = useUserStore()
    const notificationStore = useNotificationStore()
    await _logout()
    tokenStore.clearToken()
    userStore.clearUser()
    notificationStore.clear()
    await nextTick()
    const { callbackUrl = undefined } = signInOptions ?? {}
    return navigateTo(callbackUrl ?? loginPage)
  }
  const fetch = async (): Promise<any> => {
    const tokenStore = useTokenStore()
    const userStore = useUserStore()
    const route = useRoute()

    if (!tokenStore.token) {
      return !route.path.startsWith(personalPage) || navigateTo(loginPage)
    }

    const response = await _profile()
    if (!response.data) {
      tokenStore.clearToken()
      userStore.clearUser()
      return !route.path.startsWith(personalPage) || navigateTo(loginPage)
    }
    userStore.setUser(response.data)

    const requestStore = useListingRequestStore()
    const unreadStore = useUnreadCountStore()

    const listingUnread = response.data.notifications_count?.listing_requests ?? 0
    const chatUnread = response.data.notifications_count?.chats ?? 0
    const logisticUnread = response.data.notifications_count?.logistic_orders ?? {}
    const searchRequestsUnread = response.data.notifications_count?.search_requests ?? 0
    const chatsByListingRaw = response.data.notifications_count?.chats_by_listing ?? []
    const chatsBySearchRequestRaw = response.data.notifications_count?.chats_by_search_request
    const chatsBySubject = response.data.notifications_count?.chats_by_subject ?? {}
    const carLinksUnread = response.data.notifications_count?.car_links ?? 0
    const notificationsUnread = response.data.notifications_count?.notifications ?? 0

    const chatsByListingMap: Record<number, number> = {}
    for (const item of chatsByListingRaw) {
      if (item.listing_id) {
        chatsByListingMap[item.listing_id] = item.unread
      }
    }

    let chatsBySearchRequestMap: Record<number, number> | undefined
    if (Array.isArray(chatsBySearchRequestRaw)) {
      chatsBySearchRequestMap = {}
      for (const item of chatsBySearchRequestRaw) {
        if (item.search_request_id) {
          chatsBySearchRequestMap[item.search_request_id] = item.unread
        }
      }
    }

    requestStore.setTotalUnread(listingUnread)
    try {
      unreadStore.setAll({
        listingRequests: listingUnread,
        chats: chatUnread,
        chatsByListing: chatsByListingMap,
        chatsBySearchRequest: chatsBySearchRequestMap,
        chatsBySubject: chatsBySubject,
        logisticOrders: logisticUnread as any,
        searchRequests: searchRequestsUnread,
        carLinks: carLinksUnread,
        notifications: notificationsUnread,
      })
    }
    catch {
      unreadStore.reset()
    }
  }

  const refresh = async (): Promise<any> => {
    const tokenStore = useTokenStore()
    const userStore = useUserStore()
    const route = useRoute()

    if (!tokenStore.token) {
      return !route.path.startsWith(personalPage) || navigateTo(loginPage)
    }

    const response = await _refresh()
    if (!response.data?.access_token || !response.data?.user) {
      tokenStore.clearToken()
      userStore.clearUser()
      return !route.path.startsWith(personalPage) || navigateTo(loginPage)
    }

    tokenStore.setToken(response.data.access_token)
    userStore.setUser(response.data.user)
  }

  const startRefreshLoop = () => {
    if (refreshTimer) {
      return
    }
    refreshTimer = setInterval(async () => {
      await refresh()
    }, useRuntimeConfig().public.auth.jwt_refresh_second * 1000)
  }

  const verify = async (id: string, hash: string, query: VerifyEmailRequest, signInOptions?: SignInOptions): Promise<any> => {
    await _verifyEmail(id, hash, query)
    await fetch()
    const { callbackUrl = undefined } = signInOptions ?? {}
    if (callbackUrl) {
      return navigateTo(callbackUrl)
    }
  }

  const loginWithCode = async (param: LoginCodeRequest, signInOptions?: SignInOptions): Promise<any> => {
    return handleAuthResponse(() => _loginWithCode(param), signInOptions)
  }

  const requestCode = async (param: EmailPhonePayload, signInOptions?: SignInOptions): Promise<any> => {
    errors.value.clear()
    try {
      await _requestCode(param)
      const { callbackUrl = undefined } = signInOptions ?? {}
      if (callbackUrl) {
        return navigateTo(callbackUrl)
      }
    }
    catch (error: any) {
      const _error = (error?.data as Response<any>) || {}
      if (_error.errors) {
        Object.entries(_error.errors).forEach(([key, value]) => {
          errors.value.set({ path: key, value: value as string })
        })
      }
      throw error
    }
  }

  const resetWithCodeAndAuth = async (param: any, signInOptions?: SignInOptions): Promise<any> => {
    return handleAuthResponse(() => _resetWithCode(param), signInOptions)
  }

  return {
    signIn,
    signUp,
    signOut,
    fetch,
    refresh,
    startRefreshLoop,
    verify,
    loginWithCode,
    requestCode,
    resetWithCodeAndAuth,
    errors,
    clearErrors,
    normalizeUserOptions,
  }
}
