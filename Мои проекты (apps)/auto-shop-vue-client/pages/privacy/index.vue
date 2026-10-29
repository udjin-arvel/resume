<template>
  <div>
    <h1 :class="$style.title">
      {{ t('privacy.h1p') }}
    </h1>
    <div class="max-w-4xl">
      <p class="mb-6">
        {{ t('privacy.p1') }}
      </p>
      <p class="mb-6">
        {{ t('privacy.p2') }}
      </p>
      <p class="mb-6">
        {{ t('privacy.p3') }}
      </p>
      <p class="mb-6">
        {{ t('privacy.p4') }}
      </p>
      <p class="mb-6">
        {{ t('privacy.p5') }}
      </p>
      <p class="mb-6">
        {{ t('privacy.p6') }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
</script>

<style module>
.title {
  @apply text-3xl font-bold text-gray-900 mb-8;
}
</style>
