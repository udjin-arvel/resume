export const useTokenStore = defineStore("auth", () => {
  const configAuth = useRuntimeConfig().public.auth

  const cookie = useCookie<string | null>(configAuth.jwt_cookie_name, {
    default: () => null,
    maxAge: configAuth.jwt_ttl_second,
    httpOnly: false,
  })

  const token = ref<string | null>(cookie.value)

  const setToken = (_token: string | null): void => {
    token.value = _token
    cookie.value = _token
  }

  const clearToken = (): void => {
    setToken(null)
  }

  const refreshToken = (): void => {
    setToken(cookie.value)
  }

  return {
    token,
    setToken,
    clearToken,
    refreshToken,
  }
})
