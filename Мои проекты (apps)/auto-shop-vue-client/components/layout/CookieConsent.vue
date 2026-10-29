<template>
  <div
    v-show="!hasCookieConsent"
    :class="$style.cookie"
  >
    <p :class="$style.cookie__title">
      {{ t('land.cookieTitle') }}
    </p>
    <p :class="$style.cookie__text">
      <span>{{ t('land.cookie1') }}</span>
      <NuxtLink
        :to="{ name: 'privacy' }"
        :class="$style.cookie__link"
      >{{ t('land.cookie2') }}
      </NuxtLink>
      <span>{{ t('land.cookie3') }}</span>
    </p>
    <button
      id="btn-agreement"
      :class="$style.cookie__btn"
      @click="acceptCookies"
    >
      {{ t('land.cookie4') }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n"

const { t } = useI18n()
const { hasCookieConsent, acceptCookies } = useCookieConsent()
</script>

<style module>
.cookie {
  @apply fixed w-[520px] max-w-[calc(100%-32px)] bottom-4 left-4 rounded-xl shadow-lg bg-neutral-800 p-4 text-white z-50;
}
.cookie__link {
  @apply underline hover:text-primary transition-colors duration-300;
}
.cookie__title {
  @apply mb-3 font-semibold;
}
.cookie__text {
  @apply mb-3;
}
.cookie__btn {
  @apply w-full sm:w-auto min-h-[44px] bg-red-600 text-white px-4 py-2 rounded-md mt-1 hover:bg-red-700 transition-colors duration-300;
}
</style>
