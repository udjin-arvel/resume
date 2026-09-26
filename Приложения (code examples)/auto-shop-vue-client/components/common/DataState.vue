<template>
  <div
    v-if="!hasData"
    role="status"
    :class="$style.box"
  >
    <template v-if="loading">
      <CommonSpinner
        :is-loading="true"
        kind="gray"
        size="sm"
      />
      <p :class="$style.text">
        {{ loadingText }}
      </p>
    </template>
    <p
      v-else
      :class="$style.text"
    >
      {{ emptyText }}
    </p>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    loading?: boolean
    hasData?: boolean
    loadingText?: string
    emptyText?: string
  }>(),
  {
    loading: false,
    hasData: false,
    loadingText: "",
    emptyText: "",
  },
)
</script>

<style module>
.box {
  @apply mt-4 flex items-center gap-2 text-sm text-gray-500;
}
.text {
  @apply m-0;
}
</style>
