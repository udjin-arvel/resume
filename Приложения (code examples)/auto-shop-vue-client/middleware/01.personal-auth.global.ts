import { loginPage, personalPage } from "@/constants/pages"
import useAuth from "@/composables/useAuth"

export default defineNuxtRouteMiddleware(async (to) => {
  if (!to.path.startsWith(personalPage)) {
    return
  }

  const { normalizeUserOptions } = useAuth()
  const options = normalizeUserOptions(to.meta.auth)
  if (!options) {
    return
  }

  const { isAuthenticated, user } = useUserStore()

  if (
    isAuthenticated
    && user?.must_change_password
    && to.path !== `${personalPage}/password/reset`
  ) {
    return navigateTo(`${personalPage}/password/reset`)
  }

  if (isAuthenticated && (to.path === loginPage || to.path === personalPage)) {
    const redirectQuery = to.query.redirect as string

    if (redirectQuery) {
      return navigateTo(redirectQuery)
    }

    if (to.path === loginPage) {
      return navigateTo(personalPage)
    }
  }

  const isGuestMode = options.unauthenticatedOnly

  if (isGuestMode) {
    if (!isAuthenticated) {
      return
    }
    else {
      return navigateTo(options.navigateAuthenticatedTo || personalPage)
    }
  }

  if (isAuthenticated) {
    return
  }

  if (loginPage === to.path) {
    return
  }

  const matchedRoute = to.matched.length > 0
  if (!matchedRoute) {
    return
  }

  if (options.navigateUnauthenticatedTo) {
    return navigateTo(options.navigateUnauthenticatedTo)
  }

  return navigateTo({
    path: loginPage,
    query: {
      redirect: to.fullPath,
    },
  })
})
