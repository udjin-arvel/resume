<template>
  <div ref="page">
    <LandingHero />
    <LandingMarket :total="listingsTotal" />
    <LandingRequests />
    <LandingHistory />
    <LandingDiagnostics />
    <LandingBooking />
    <LandingChat />
    <LandingLinks />
    <LandingEvents />
    <LandingPurchases />
    <LandingLogistics />
    <LandingFinalCta @request-access="isModalOpen = true" />
    <MainFeedbackModal
      :is-open="isModalOpen"
      @update:is-open="isModalOpen = $event"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from "vue"
import { useI18n } from "vue-i18n"
import { useRevealOnScroll } from "@/composables/useRevealOnScroll"
import { useApiListing } from "@/composables/api/useApiListing"
import "~/assets/css/landing.css"

definePageMeta({
  layout: "landing",
})

const { t } = useI18n()
const { getPublicListingsCount } = useApiListing()

const { data: listingsTotal } = await useAsyncData(
  "landing-listings-count",
  async () => {
    try {
      const response = await getPublicListingsCount()
      return response.data?.total ?? null
    }
    catch {
      return null
    }
  },
  { server: true, default: () => null },
)

usePageSeoMeta({
  title: t("landing.meta.title"),
  ogTitle: t("landing.meta.title"),
  description: t("landing.meta.description"),
  ogDescription: t("landing.meta.description"),
})

const page = ref<HTMLElement | null>(null)
useRevealOnScroll(page)

const isModalOpen = ref(false)
const { hasCookieConsent } = useCookieConsent()
let modalTimeout: ReturnType<typeof setTimeout> | null = null
let stopConsentWatch: (() => void) | undefined

onMounted(() => {
  stopConsentWatch = watch(hasCookieConsent, (hasConsent) => {
    if (modalTimeout !== null) {
      clearTimeout(modalTimeout)
      modalTimeout = null
    }

    if (!hasConsent || sessionStorage.getItem("feedback_modal_shown")) {
      return
    }

    modalTimeout = setTimeout(() => {
      modalTimeout = null
      if (!hasCookieConsent.value || sessionStorage.getItem("feedback_modal_shown")) {
        return
      }
      isModalOpen.value = true
      sessionStorage.setItem("feedback_modal_shown", "true")
    }, 30000)
  }, { immediate: true })
})

onBeforeUnmount(() => {
  stopConsentWatch?.()
  if (modalTimeout !== null) {
    clearTimeout(modalTimeout)
  }
})
</script>
