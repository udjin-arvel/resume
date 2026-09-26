<template>
  <div>
    <LayoutHeader variant="landing" />
    <main class="ld-page">
      <slot />
      <LandingFooter />
    </main>
    <LayoutCookieConsent />
  </div>
</template>

<script setup lang="ts">
useJivoChat()
</script>
