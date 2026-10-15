export default defineNuxtPlugin(async () => {
  const config = useRuntimeConfig()
  const { isShareDomain } = useShareDomain()

  if (isShareDomain.value) {
    return
  }

  const { fetch, startRefreshLoop } = useAuth()
  const { refreshToken } = useTokenStore()

  if (import.meta.client) {
    refreshToken()
    await nextTick()
    await fetch()
    if (config.public.auth.refresh_enabled) {
      startRefreshLoop()
    }
  }

  if (import.meta.server) {
    await nextTick()
    await fetch()
  }
})
