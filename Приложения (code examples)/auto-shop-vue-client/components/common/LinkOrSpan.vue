<script setup lang="ts">
import type { RouteLocationRaw } from "vue-router"

defineOptions({ inheritAttrs: false })

defineProps<{
  to?: RouteLocationRaw | null
}>()
</script>

<template>
  <NuxtLink
    v-if="to"
    v-bind="$attrs"
    :to="to"
  >
    <slot />
  </NuxtLink>
  <span v-else>
    <slot />
  </span>
</template>
