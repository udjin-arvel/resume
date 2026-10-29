<template>
  <nav
    :class="$style.nav"
    aria-label="Breadcrumb"
  >
    <ol
      role="list"
      :class="$style.navItems"
    >
      <li
        v-for="(page, k) in breadcrumbs"
        :key="k"
      >
        <div :class="$style.navItem">
          <span
            v-if="k > 0"
            :class="$style.navSlash"
            aria-hidden="true"
          >/</span>

          <template v-if="k === breadcrumbs.length - 1">
            <span :class="$style.navActive">
              {{ page.meta?.breadcrumb || page.name }}
            </span>
          </template>

          <template v-else>
            <NuxtLink
              :to="page.path"
              :class="$style.navLink"
            >
              {{ page.meta?.breadcrumb || page.name }}
            </NuxtLink>
          </template>
        </div>
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
const { breadcrumbs } = useBreadcrumbs()
</script>

<style module>
.nav {
  @apply mb-8 hidden lg:flex;
}
.navItems {
  @apply flex items-center space-x-1;
}
.navItem {
  @apply flex items-center;
}
.navSlash {
  @apply mx-1.5 text-gray-400 select-none;
}
.navLink {
  @apply flex items-center space-x-2 text-sm font-medium text-black cursor-pointer hover:text-gray-700;
  text-decoration: none;
}
.navActive {
  @apply flex items-center space-x-2 text-sm font-medium text-gray-400 cursor-default select-none;
}
.navIcon {
  @apply h-5 w-5 flex-shrink-0;
}
</style>
