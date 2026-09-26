import * as Sentry from "@sentry/vue"

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  const dsn = config.public.sentryDsn

  if (!dsn) {
    return
  }

  Sentry.init({
    app: nuxtApp.vueApp,
    dsn,
    environment: config.public.sentryEnv || "production",
    tracesSampleRate: 0,
  })
})
