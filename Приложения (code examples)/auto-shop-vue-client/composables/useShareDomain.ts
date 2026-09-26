import { computed } from "vue"

export function useShareDomain() {
  const config = useRuntimeConfig()

  const toHostname = (url: string) =>
    url.replace(/^https?:\/\//, "").split("/")[0].split(":")[0]

  const shareHost = computed(() => toHostname((config.public.shareDomain as string) || ""))
  const anonymousHost = computed(() => toHostname((config.public.anonymousShareDomain as string) || ""))

  const host = import.meta.server
    ? (useRequestHeaders(["host"]).host || "")
    : (import.meta.client ? window.location.host : "")
  const currentHostname = host.split(":")[0]

  const isAnonymousDomain = computed(() =>
    !!anonymousHost.value && currentHostname === anonymousHost.value,
  )
  const isShareDomain = computed(() =>
    isAnonymousDomain.value || (!!shareHost.value && currentHostname === shareHost.value),
  )

  return { isShareDomain, isAnonymousDomain, currentHostname }
}
