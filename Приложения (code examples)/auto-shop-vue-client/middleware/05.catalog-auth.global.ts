import { catalogPage } from "@/constants/pages"
import { useUserStore } from "@/stores/user"

export default defineNuxtRouteMiddleware(async (to) => {
  if (!to.path.startsWith(catalogPage)) {
    return
  }

  const { isShareDomain } = useShareDomain()

  if (isShareDomain.value) {
    return
  }

  const userStore = useUserStore()

  if (!userStore.isAuthenticated) {
    return
  }

  const requiredRoles = to.meta.roles as string[] | undefined

  if (requiredRoles && Array.isArray(requiredRoles) && requiredRoles.length > 0) {
    const userRole = userStore.user?.role

    if (!userRole || !requiredRoles.includes(userRole)) {
      throw createError({ statusCode: 403, statusMessage: "Forbidden" })
    }
  }
})
