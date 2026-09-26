<template>
  <div :class="$style.wrapper">
    <header :class="$style.header">
      <LanguageDropdown />
    </header>

    <main :class="$style.main">
      <slot />
    </main>

    <footer :class="$style.footer">
      © {{ currentYear }}
    </footer>
  </div>
</template>

<script setup lang="ts">
import LanguageDropdown from "~/components/common/LanguageDropdown.vue"

const currentYear = new Date().getFullYear()
</script>

<style module>
.wrapper {
  @apply min-h-screen flex flex-col;
}
.header {
  @apply flex justify-end items-center px-4 sm:px-6 lg:px-8 py-3 border-b border-gray-200;
}
.main {
  @apply flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6;
}
.footer {
  @apply text-center text-sm text-gray-500 py-4 border-t border-gray-200;
}
</style>
