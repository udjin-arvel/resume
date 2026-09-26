<template>
  <form
    :class="$style.spacings"
    action=""
  >
    <slot />
  </form>
</template>

<script lang="ts">
export default {}
</script>

<style module>
.spacings {
  @apply space-y-6;
}
</style>
