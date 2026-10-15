<template>
  <div :class="$style.wrapper">
    <LayoutPersonalHeader />
    <div :class="$style.inner">
      <LayoutPersonalMain />
    </div>
    <LayoutPersonalFooter />
  </div>
</template>

<script setup lang="ts">
</script>

<style module>
.wrapper {
  @apply min-h-screen flex flex-col;
}
.inner {
  @apply flex-1 flex flex-col max-w-7xl mx-auto w-full px-2;
}
</style>
