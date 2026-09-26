<template>
  <div :class="$style.h1">
    <h1 :class="$style.h1__title">
      <span :class="$style.h1__red">№1</span> {{ $t('land.h1') }}
    </h1>
    <div :class="$style.h1__serve">
      {{ $t('land.serve') }} <span :class="$style.h1__red">{{ $t('land.company') }}</span> {{ $t('land.auto') }}
    </div>
  </div>
</template>

<script setup lang="ts">

</script>

<style module>
.h1 {
    @apply mx-auto text-center mb-[3.7rem];
}

.h1__title {
    @apply font-bold text-black leading-none text-[3rem] mb-2.5;
}

.h1__red {
    @apply text-primary;
}

.h1__serve {
    @apply font-normal text-[1.5rem];
}
@media (max-width: 640px)
{
  .h1 {
  @apply mb-10;
}

.h1__title {
  @apply text-[2.25rem];
}

.h1__serve {
  @apply text-[1.125rem];
}
}
</style>
