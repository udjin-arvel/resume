<template>
  <main>
    <div :class="$style.cont">
      <NuxtPage />
    </div>
  </main>
</template>

<script setup lang="ts">

</script>

<style module>
.cont {
    @apply mx-auto px-[1.25rem] max-w-[89.5rem] w-full;
}
</style>
