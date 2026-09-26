<template>
  <main :class="[$style.mainContainer, route.meta.fillHeight ? $style.fill : '']">
    <div :class="[$style.container, route.meta.fillHeight ? $style.fill : '']">
      <CommonBreadcrumbs v-if="!route.meta.hideBread && !isShareDomain" />
      <h1
        v-if="!(route.meta.compact || route.meta.hideTitle)"
        :class="$style.title"
      >
        {{ route.name ? t("navigation." + String(route.name)) : "" }}
      </h1>

      <div :class="route.meta.fillHeight ? $style.fill : ''">
        <NuxtPage />
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
const route = useRoute()
const { t } = useI18n()
const { isShareDomain } = useShareDomain()
</script>

<style module>
.mainContainer {
  @apply py-6;
}
.container {
  @apply px-4 sm:px-6 lg:px-8;
}

.fill {
  @apply flex-1 flex flex-col min-h-0;
}
.title {
  @apply text-3xl font-bold text-gray-900 mb-8;
}
</style>
