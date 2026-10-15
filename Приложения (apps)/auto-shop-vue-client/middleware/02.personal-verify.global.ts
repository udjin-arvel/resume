import { personalPage } from "@/constants/pages"

export default defineNuxtRouteMiddleware((to) => {
  if (!to.path.startsWith(personalPage)) {
    return
  }

  const { isAuthenticated, isVerified } = useUserStore()
  const needVerify = isAuthenticated && !isVerified
  const isVerifyRoute = to.name === "personal-verify-email" || to.name === "personal-verify-email-id-hash"

  if (!isAuthenticated && isVerifyRoute) {
    return
  }

  if (!needVerify && isVerifyRoute) {
    return navigateTo({
      name: "personal",
    })
  }

  if (needVerify && !isVerifyRoute) {
    return navigateTo({
      name: "personal-verify-email",
    })
  }
})
