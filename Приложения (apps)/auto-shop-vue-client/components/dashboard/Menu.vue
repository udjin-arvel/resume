<template>
  <nav :class="$style.menu">
    <ul :class="$style.menuList">
      <li
        v-for="item in items"
        :key="item.label"
      >
        <NuxtLink
          :to="{ name: item.routeName, state: item.routeState }"
          :class="$style.menuItem"
          :active-class="$style.active"
        >
          <span :class="$style.itemText">{{ item.label }}</span>

          <Badge
            v-if="item.count !== undefined"
            :value="item.count"
            kind="gray"
          />
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
import Badge from "~/components/common/Badge.vue"

export interface MenuItem {
  label: string
  routeName: string
  count?: number
  routeState?: Record<string, any>
}

defineProps<{
  items: MenuItem[]
}>()
</script>

<style module>
.menu {
  @apply border border-gray-200 rounded-lg overflow-hidden bg-white h-full;
}

.menuList {
  @apply flex flex-col p-2;
}

.menuItem {
  @apply flex items-center justify-between px-4 py-3 rounded-md transition-colors duration-200 mb-1 no-underline cursor-pointer hover:bg-gray-100 text-gray-700;
}

.active {
  @apply bg-gray-100 text-black font-medium;
}

.itemText {
  @apply font-medium;
}
</style>
