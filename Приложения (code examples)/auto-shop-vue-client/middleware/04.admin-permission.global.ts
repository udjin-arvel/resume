import { useUserStore } from "@/stores/user"
import { adminPage, loginPage } from "@/constants/pages"
import { RoleAdmin, RoleLogistic } from "@/constants/roles"

const logistAllowedPrefix = "/admin/calc"

export default defineNuxtRouteMiddleware((to, _from) => {
  if (!to.path.startsWith(adminPage)) {
    return
  }

  const { isAuthenticated, user } = useUserStore()
  if (!isAuthenticated) {
    return navigateTo({
      path: loginPage,
      query: {
        redirect: to.fullPath,
      },
    })
  }

  if (user?.role === RoleAdmin) {
    return
  }

  if (user?.role === RoleLogistic && to.path.startsWith(logistAllowedPrefix)) {
    return
  }

  return navigateTo({
    path: "/",
  })
})
