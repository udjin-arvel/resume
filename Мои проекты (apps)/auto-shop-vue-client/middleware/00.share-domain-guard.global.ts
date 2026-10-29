import { catalogPage, diagnosticPage, compensationPage, loginPage, trackingPage } from "@/constants/pages"

export default defineNuxtRouteMiddleware((to) => {
  const config = useRuntimeConfig()
  const { isShareDomain, isAnonymousDomain } = useShareDomain()

  if (!isShareDomain.value) {
    return
  }

  if (isAnonymousDomain.value && to.path === "/") {
    return navigateTo(trackingPage)
  }

  const isAllowedPage = to.path.startsWith(catalogPage)
    || to.path.startsWith(diagnosticPage)
    || to.path.startsWith(compensationPage)
    || (isAnonymousDomain.value && to.path.startsWith(trackingPage))

  if (to.path === loginPage) {
    const mainDomainUrl = config.public.mainDomain as string || ""
    if (mainDomainUrl) {
      const redirectUrl = mainDomainUrl.replace(/\/$/, "") + to.fullPath
      return navigateTo(redirectUrl, {
        external: true,
        redirectCode: 302,
      })
    }
  }

  if (!isAllowedPage) {
    throw createError({
      statusCode: 404,
      statusMessage: "Page not found",
      fatal: true,
    })
  }

  if (isAnonymousDomain.value) {
    setPageLayout("public")
  }
})
