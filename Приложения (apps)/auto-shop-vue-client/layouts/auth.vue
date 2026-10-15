<template>
  <div :class="$style.wrapper">
    <div :class="$style.header__top">
      <NuxtLink :to="{ name: 'index' }">
        <img
          :class="$style.logoImage"
          src="/logo.svg"
          :alt="t('about.name')"
        >
      </NuxtLink>
      <div :class="$style.actions">
        <NuxtLink :to="{ name: 'tracking' }">
          <CommonButton
            kind="unset"
            size="sm"
          >{{ t('common.tracking') }}</CommonButton>
        </NuxtLink>
        <NuxtLink :to="{ name: 'personal-register' }">
          <CommonButton
            kind="white"
            size="sm"
          >{{ t("common.registration") }}</CommonButton>
        </NuxtLink>
        <NuxtLink :to="{ name: 'personal-login' }">
          <CommonButton
            :class="$style.loginButton"
            kind="black"
            size="sm"
          >{{ t("common.sign_in") }}</CommonButton>
        </NuxtLink>
        <LanguageDropdown />
      </div>
    </div>

    <div :class="$style.contentWrapper">
      <div :class="$style.header">
        <h1
          v-if="!(route.meta.compact || false)"
          :class="$style.title"
        >
          {{ route.name ? t("navigation." + String(route.name)) : "" }}
        </h1>
      </div>
      <div :class="$style.pageContent">
        <slot />
      </div>
    </div>

    <footer :class="$style.footer">
      <div :class="$style.footerContent">
        <div :class="$style.footerRow">
          <p :class="$style.footerText">
            © {{ t('common.main_footer_text', { year: currentYear }) }}
          </p>
          <NuxtLink
            to="/"
            :class="$style.footerLink"
          >
            {{ t('common.terms') }}
          </NuxtLink>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n"
import LanguageDropdown from "~/components/common/LanguageDropdown.vue"
import { useRoute } from "#app"

const { t } = useI18n()
const route = useRoute()
const currentYear = new Date().getFullYear()
</script>

<style module>
.wrapper {
  @apply min-h-screen flex flex-col;
}
.contentWrapper {
  @apply flex min-h-full flex-1 flex-col justify-center pt-1 sm:px-6 lg:px-8;
}
.header {
  @apply sm:mx-auto sm:w-full sm:max-w-lg;
}
.header__top {
  @apply mt-3 bg-white flex items-center justify-between border-b border-gray-300 px-4 sm:px-6 md:px-20 pb-2 md:ml-10 md:mr-10;
}
.logoImage {
  @apply h-8 w-auto;
}
.title {
  @apply mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900;
  font-size: 48px;
}
.actions {
  @apply flex items-center space-x-4;
}
.pageContent {
  @apply mt-10 sm:mx-auto sm:w-full sm:max-w-[480px];
}
.loginButton {
  @apply lg:mr-4;
}
.footer {
  @apply p-4 sm:px-6 md:px-20 border-t mt-5 border-gray-300 md:ml-10 md:mr-10;
}
.footerContent {
  @apply flex flex-col items-center space-y-2;
}
.footerRow {
  @apply flex flex-row items-center gap-2;
}
.footerText,
.footerLink {
  @apply text-sm text-gray-600 text-center;
}
.footerLink {
  @apply underline;
}
.footerLink:hover {
  @apply text-black;
}
.footerDev {
  @apply mt-8 text-center text-xs text-gray-600;
}
</style>
