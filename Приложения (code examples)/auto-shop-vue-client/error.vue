<template>
  <NuxtLayout :name="isAnonymousDomain ? 'public' : '404'">
    <div :class="$style.wrapper">
      <h1 :class="$style.title">
        {{ error?.statusCode }}
      </h1>

      <p :class="$style.subtitle">
        {{ t(titleKey, t("error.default.title")) }}
      </p>

      <div :class="$style.description">
        <p> {{ t(descriptionKey, t("error.default.description")) }}</p>
        <p v-if="showRawMessage">
          {{ error?.message }}
        </p>
      </div>
      <CommonButton
        v-if="!isAnonymousDomain"
        kind="primary"
        size="lg"
        @click="handleError"
      >
        {{ t(buttonKey) }}
      </CommonButton>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import type { NuxtError } from "#app"
import { useUserStore } from "@/stores/user"

const props = defineProps({
  error: Object as () => NuxtError,
})
const { t, te } = useNuxtApp().$i18n
const config = useRuntimeConfig()
const userStore = useUserStore()
const { isShareDomain, isAnonymousDomain } = useShareDomain()

const mainDomainUrl = computed(() => ((config.public.mainDomain as string) || "").replace(/\/$/, ""))

const leadsToMainDomain = computed(() => isShareDomain.value && !isAnonymousDomain.value && !!mainDomainUrl.value)

const titleKey = computed(() => `error.${props.error?.statusCode}.title`)

const descriptionKey = computed(() => {
  if (props.error?.statusCode === 410 && isAnonymousDomain.value) {
    return "error.410.description_anonymous"
  }

  return `error.${props.error?.statusCode}.description`
})

const showRawMessage = computed(() => !!props.error?.message && !te(titleKey.value))

const buttonKey = computed(() => leadsToMainDomain.value ? "navigation.go_to_main_site" : "navigation.go_back_home")

const handleError = () => {
  if (leadsToMainDomain.value) {
    return navigateTo(mainDomainUrl.value, { external: true })
  }

  const redirectPath = userStore.isAuthenticated ? "/personal" : "/"

  clearError({ redirect: redirectPath })
}

useHead({
  title: () => isAnonymousDomain.value
    ? t("navigation.error")
    : t("navigation.error") + " - " + t("about.name"),
  link: isAnonymousDomain.value
    ? [{ rel: "icon", href: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGNgAAIAAAUAAen63NgAAAAASUVORK5CYII=" }]
    : [],
})
</script>

<style module>
.wrapper {
  @apply grid min-h-96 place-content-center bg-white text-center py-16;
}

.title {
  @apply text-9xl font-black text-gray-200;
}

.subtitle {
  @apply text-2xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-2;
}

.description {
  @apply mb-4 text-gray-500;
}
</style>
