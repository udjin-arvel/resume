<template>
  <div>
    <div :class="$style.addNewWrap">
      <NuxtLink
        :to="{ name: 'admin-clients-companies' }"
        :class="$style.addNewLink"
      >
        <CommonButton kind="white">
          {{ $t('actions.to_companies') }}
        </CommonButton>
      </NuxtLink>
      <NuxtLink
        :to="{ name: 'admin-clients-users' }"
        :class="$style.addNewLink"
      >
        <CommonButton kind="white">
          {{ $t('actions.to_users') }}
        </CommonButton>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RoleAdmin } from "~/constants/roles"

definePageMeta({
  auth: true,
  layout: "personal",
  roles: [RoleAdmin],
})
</script>

<style module>
.addNewWrap {
  @apply my-4 flex gap-4;
}
.addNewLink {
  @apply text-sm font-medium text-primary-600 hover:text-primary-500;
}
</style>
