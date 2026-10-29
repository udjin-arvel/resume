<template>
  <span class="relative inline-flex items-center">
    <template v-if="typeof item.label === 'object'">
      <span>{{ t(item.label.key) }}</span>
      <Badge
        :value="item.label.count || 0"
        class="ml-1"
      />
    </template>
    <template v-else>
      {{ t(item.label ?? `navigation.${item.name}`) }}
    </template>
  </span>
</template>

<script setup lang="ts">
import Badge from "@/components/common/Badge.vue"
import type { NavigationItem } from "@/types/common/navigation"

defineProps<{
  item: NavigationItem
}>()

const { t } = useI18n()
</script>
