import * as Sentry from "@sentry/vue"
import type Response from "@/types/responses/response"
import { toCamelCase, toSnakeCase } from "@/utils/caseTransform"
import { loginPage, personalPage } from "@/constants/pages"
import type { ApiFetchOptions } from "@/types/common/api"

const RETRY_STATUS_CODES = [408, 425, 500, 502, 503, 504]

const SAFE_METHODS = ["GET", "HEAD", "OPTIONS"]

const RETRY_ATTEMPTS = 2

const RETRY_DELAY_MS = 600

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  const route = useRoute()
  const { isShareDomain } = useShareDomain()
  const localeCookie = useCookie<string | null>("preferred_lang", { readonly: true })
  const i18n = nuxtApp.$i18n as { locale?: { value?: string } } | undefined

  const $apiRaw = $fetch.create({
    baseURL: config.public.apiBase,
    onRequest({ options }) {
      const { token } = useTokenStore()

      let headers: { [key: string]: any } = {
        accept: "application/json",
        ...options?.headers,
      }
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }

      const locale = i18n?.locale?.value || localeCookie.value
      if (locale) {
        headers["Accept-Language"] = locale
      }

      if (import.meta.server) {
        headers = {
          ...headers,
          ...useRequestHeaders(["cookie", "x-forwarded-for", "x-real-ip"]),
          referer: config.public.apiBase,
        }
      }

      for (const k in headers) {
        options.headers.set(k, headers[k])
      }
      options.credentials = "include"
    },
    onResponse({ response }) {
      const notificationsStore = useNotificationsStore()
      const { status, _data } = response
      const data: Response<any> = _data as Response<any>

      if (data?.message && status < 400) {
        if (data?.notify) {
          notificationsStore.notify(data.notify, data.message)
        }
        else {
          notificationsStore.successNotify(data.message)
        }
      }

      if (!data?.message && (status === 201 || status === 202)) {
        notificationsStore.successNotify("succeeded")
      }

      if (data?.redirect && data.redirect.to) {
        navigateTo(data.redirect.to, {
          external: data.redirect.external ? data.redirect.external : false,
        })
      }
    },
    async onResponseError({ response, options }) {
      const { errorNotify } = useNotificationsStore()
      const tokenStore = useTokenStore()
      const userStore = useUserStore()
      const { status, _data } = response

      const retriesLeft = typeof options.retry === "number" ? options.retry : 0
      if (retriesLeft > 0 && RETRY_STATUS_CODES.includes(status)) {
        return
      }
      const navigateToLogin = async () => {
        if (route.path !== loginPage) {
          await navigateTo({
            path: loginPage,
            replace: true,
            query: { redirect: route.fullPath },
          })
        }
      }

      if (status === 401) {
        tokenStore.clearToken()
        userStore.clearUser()
        const isForgotRoute = route.name === "personal-password-forgot"
        if (route.path.startsWith(personalPage) && !isForgotRoute) {
          await navigateToLogin()
        }

        if (!isShareDomain.value) {
          errorNotify("response_status.auth_error")
        }
      }

      if (status === 403) {
        errorNotify("response_status.forbidden")
      }

      if (status === 400) {
        errorNotify("response_status.bad_request")
      }

      if (status === 422) {
        const apiOptions = options as ApiFetchOptions

        if (!apiOptions.skipValidationNotify) {
          const data = _data as Response<any> | undefined
          const fieldErrors = data?.errors
          const hasFieldErrors = Boolean(
            fieldErrors && typeof fieldErrors === "object" && Object.keys(fieldErrors).length > 0,
          )
          const backendMessage = typeof data?.message === "string" ? data.message.trim() : ""

          if (!hasFieldErrors && backendMessage) {
            errorNotify(backendMessage)
          }
          else {
            errorNotify("response_status.validation_error")
          }
        }
      }

      if (status === 419) {
        errorNotify("response_status.refresh_token_expired")
      }

      if (status === 429) {
        errorNotify("response_status.throttle_error")
      }

      if (status >= 500) {
        errorNotify("response_status.server_error")
      }
      else if (![400, 401, 403, 410, 419, 422, 429].includes(status)) {
        errorNotify("response_status.unknown_error")
      }
    },
  }) as (url: string, opts?: any) => Promise<any>

  nuxtApp.provide("api", async (url: string, opts: any = {}) => {
    const { camelize = false, snakeParams = false, ...fetchOpts } = opts
    const finalOpts = { ...fetchOpts }

    if (snakeParams) {
      if (finalOpts.params && typeof finalOpts.params === "object") {
        finalOpts.params = toSnakeCase(finalOpts.params)
      }
      if (finalOpts.body && typeof finalOpts.body === "object") {
        finalOpts.body = toSnakeCase(finalOpts.body)
      }
    }

    const method = String(finalOpts.method || "GET").toUpperCase()

    if (SAFE_METHODS.includes(method) && finalOpts.retry === undefined) {
      finalOpts.retry = RETRY_ATTEMPTS
      finalOpts.retryDelay = RETRY_DELAY_MS
      finalOpts.retryStatusCodes = RETRY_STATUS_CODES
    }

    try {
      const body: any = await $apiRaw(url, finalOpts)
      if (camelize) {
        return toCamelCase(body)
      }
      return body
    }
    catch (error: any) {
      const status = error?.response?.status ?? error?.statusCode
      if (config.public.sentryDsn && (!status || status >= 500)) {
        Sentry.captureException(error, {
          tags: { type: "api_request" },
          extra: { url, method, status },
        })
      }

      if (camelize) {
        if (error._data) {
          error._data = toCamelCase(error._data)
        }
        else if (error.data && Object.getOwnPropertyDescriptor(error, "data")?.writable) {
          error.data = toCamelCase(error.data)
        }
      }
      throw error
    }
  })
})
