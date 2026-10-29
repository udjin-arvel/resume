<template>
  <div
    :class="$style.wrap"
  >
    <div :class="$style.left">
      <svg
        :class="$style.noAvatar"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>

      <div :class="$style.leftContent">
        <NuxtLink
          :to="{ name: 'personal-users-id', params: { id: user.id } }"
          :class="$style.name"
        >
          <span :class="$style.nameAbsolute" />
          {{ user.name }}
        </NuxtLink>
        <p :class="$style.email">
          {{ user.email }}
        </p>
      </div>
    </div>
    <div :class="$style.rightContent">
      <div :class="$style.info">
        <p :class="$style.client">
          {{ user.client?.name }}
        </p>
        <p :class="$style.role">
          {{ t("roles." + user.role) }}
        </p>
      </div>
      <ChevronRightIcon
        :class="$style.disclosure"
        aria-hidden="true"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChevronRightIcon } from "@heroicons/vue/20/solid"
import type { User } from "@/types/responses/user"

defineProps<{
  user: User
}>()

const { t } = useI18n()
</script>

<style module>
.wrap {
  @apply relative flex justify-between gap-x-6 px-4 py-5 hover:bg-gray-50 sm:px-6;
}

.left {
  @apply flex min-w-0 gap-x-4;
}

.noAvatar {
  @apply overflow-hidden rounded-full bg-gray-50 size-12 text-gray-300;
}

.leftContent {
  @apply min-w-0 flex-auto;
}

.rightContent {
  @apply flex shrink-0 items-center gap-x-4;
}

.name {
  @apply text-sm/6 font-semibold text-gray-900;
}

.nameAbsolute {
  @apply absolute inset-x-0 -top-px bottom-0;
}

.email {
  @apply relative truncate mt-1 flex text-xs/5 text-gray-500;
}

.info {
  @apply hidden sm:flex sm:flex-col sm:items-end
}

.client {
  @apply text-sm/6 text-gray-900;
}

.role {
  @apply mt-1 text-xs/5 text-gray-500;
}

.disclosure {
  @apply size-5 flex-none text-gray-400;
}
</style>
