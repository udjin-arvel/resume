<template>
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
  <OnlineChat />
</template>

<script setup lang="ts">
import OnlineChat from "~/components/chat/OnlineChat.vue"

const { t } = useI18n()
const currentYear = new Date().getFullYear()
</script>

<style module>
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

@media (max-width: 640px) {
  .footerRow {
    flex-direction: column;
    gap: 0.25rem;
    align-items: center;
  }
  .footerText,
  .footerLink {
    text-align: center;
    width: 100%;
  }
}
</style>
