<template>
  <div :class="[$style.wrapper, route.meta.fillHeight ? $style.wrapperFill : '']">
    <LayoutPersonalHeader />
    <div :class="[$style.inner, route.meta.fillHeight ? $style.innerFill : '']">
      <LayoutPersonalMain />
    </div>
    <LayoutPersonalFooter />
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
</script>

<style module>
.wrapper {
  @apply min-h-screen flex flex-col;
}

.wrapperFill {
  @apply h-[100dvh] overflow-hidden;
}
.inner {
  @apply flex-1 flex flex-col max-w-[1800px] mx-auto w-full px-6 lg:px-8;
}

.innerFill {
  @apply min-h-0;
}
</style>
