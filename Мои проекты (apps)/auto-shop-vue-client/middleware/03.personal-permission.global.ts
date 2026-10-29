import { personalPage } from "@/constants/pages"
import { useUserStore } from "@/stores/user"

export default defineNuxtRouteMiddleware((to, from) => {
  const isCatalogList = to.path === "/catalog" || to.path === "/catalog/"

  if (!to.path.startsWith(personalPage) && !isCatalogList) {
    return
  }

  if (isCatalogList && !useUserStore().isAuthenticated) {
    return
  }

  const { hasRequiredRoles } = usePermission()
  const notificationsStore = useNotificationsStore()
  const routeRoles = to.meta.roles

  if (!routeRoles) {
    return
  }

  if (hasRequiredRoles(routeRoles)) {
    return
  }

  notificationsStore.errorNotify("permission_forbidden")
  if (from.fullPath !== to.fullPath) {
    return from.fullPath
  }

  return navigateTo({
    path: personalPage,
  })
})
