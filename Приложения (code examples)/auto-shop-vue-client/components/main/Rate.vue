<template>
  <div :class="$style.rate">
    <h2 :class="$style.rate__h2">
      {{ $t('land.h2') }}
    </h2>
    <div :class="$style.rate__stars">
      <img
        v-for="n in 5"
        :key="n"
        :class="$style.rate__star"
        src="/star.svg"
        :alt="('land.star')"
      >
    </div>

    <div :class="$style.rate__serve">
      {{ $t('land.req') }} <span :class="$style.rate__red">{{ $t('land.negative') }}</span> {{ $t('land.we') }}
    </div>
  </div>
</template>

<script setup lang="ts">

</script>

<style module>
.rate {
  @apply mx-auto text-center mb-[2rem];
}

.rate__red {
  @apply text-primary;
}

.rate__h2 {
  @apply text-[2.5rem] font-bold mb-[1.875rem];
}

.rate__stars {
  @apply flex flex-wrap justify-center mb-[1.9375rem];
}

.rate__star {
  @apply mx-[0.25rem];
}

.rate__serve {
  @apply text-[1.5rem] font-semibold leading-[1.2] mx-auto max-w-full w-[61.25rem] mb-6;
}
@media (max-width: 640px)
{
 .rate__h2 {
  @apply text-[1.875rem] mb-[0.9375rem];
}

.rate__serve {
  @apply text-[1rem] mb-[1.875rem];
}

.rate__stars {
  @apply mb-[0.9375rem];
}
}
</style>
