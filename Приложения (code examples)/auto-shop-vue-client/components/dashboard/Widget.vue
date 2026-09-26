<template>
  <div :class="$style.card">
    <div :class="$style.cardHeader">
      <div :class="$style.cardTitleGroup">
        <h3>
          <NuxtLink
            :to="{ name: routeName, state: routeState }"
            :class="$style.titleLink"
          >
            {{ title }}
          </NuxtLink>
        </h3>
        <Badge
          v-if="count"
          :value="count"
          kind="red"
        />
      </div>

      <div class="group">
        <NuxtLink :to="{ name: routeName, state: routeState }">
          <Button
            kind="white"
            size="xs"
          >
            <ArrowRightIcon :class="[$style.arrowIcon, 'group-hover:text-black']" />
          </Button>
        </NuxtLink>
      </div>
    </div>

    <hr :class="$style.divider">

    <div :class="$style.cardBody">
      <slot>
        <p :class="$style.cardDescription">
          {{ description }}
        </p>
      </slot>
    </div>

    <div
      v-if="!$slots.default"
      :class="$style.cardFooter"
    >
      <NuxtLink
        :to="{ name: routeName, state: routeState }"
        :class="$style.cardLink"
      >
        {{ $t('dashboard.widget.go_to_section') }}
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowRightIcon } from "@heroicons/vue/24/solid"
import Badge from "~/components/common/Badge.vue"
import Button from "~/components/common/Button.vue"

defineProps<{
  title: string
  description?: string
  routeName: string
  count?: number
  routeState?: Record<string, any>
}>()
</script>

<style module>
.card {
  @apply border border-gray-200 rounded-lg overflow-hidden bg-white flex flex-col h-full;
}

.cardHeader {
  @apply flex items-center justify-between p-4 bg-white;
}

.cardTitleGroup {
  @apply flex items-center gap-3;
}

.titleLink {
  @apply text-xl font-bold text-black no-underline transition-colors duration-200;
  @apply hover:text-gray-600;
}

.arrowIcon {
  @apply w-4 h-4 text-gray-400 transition-colors duration-300;
}

.divider {
  @apply border-t border-gray-200 w-full m-0;
}

.cardBody {
  @apply p-4 flex-grow;
}

.cardDescription {
  @apply text-gray-500 text-sm leading-relaxed;
}

.cardFooter {
  @apply bg-gray-50 p-4 border-t border-gray-100;
}

.cardLink {
  @apply text-black font-medium hover:underline text-sm;
}
</style>
