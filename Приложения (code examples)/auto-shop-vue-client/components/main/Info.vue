<template>
  <h2
    id="what"
    :class="$style.h2"
  >
    {{ $t('land.what') }}
  </h2>
  <div :class="$style.info">
    {{ $t('land.better') }}
  </div>
</template>

<script setup lang="ts">

</script>

<style module>
.h2 {
  @apply text-center font-bold mb-[0.6rem] text-[2.5rem];
}

.info {
  @apply text-center font-semibold mb-[2.9rem] text-grey text-[1.5rem];
}
@media (max-width: 640px)
{
 .h2 {
  @apply text-[2.25rem];
}

.info {
  @apply text-[1.25rem] mb-8;
}
}
</style>
