<template>
  <div :class="$style.sea">
    <div :class="$style.sea__ship">
      <img
        :class="$style.sea__img"
        src="/ship.svg"
        :alt="$t('land.ship')"
      >
    </div>
    <div :class="$style.sea__text">
      {{ $t('land.send') }}
    </div>
    <div :class="$style.sea__over">
      <img
        :class="$style.sea__wave"
        src="/wave.svg"
        :alt="$t('land.wave')"
      >
    </div>
  </div>
</template>

<script setup lang="ts">

</script>

<style module>
.sea {
  @apply text-center mb-[2.1rem];
}

.sea__over {
  @apply overflow-hidden relative w-full h-[5rem];
}

.sea__wave {
  @apply left-0 absolute max-w-[150%] w-[120%] animate-[waveMove_20s_ease-in-out_infinite];
  top: 0;
}

@keyframes waveMove {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(-20%); }
}

.sea__ship {
  @apply mb-[0.4375rem];
}

.sea__text {
  @apply text-[2rem] font-semibold w-[60rem] mb-[1.75rem] mx-auto max-w-full;
}

.sea__img {
  @apply inline-block;
}
@media (max-width: 640px)
{
.sea__text {
  @apply text-[1.5rem];
}

.sea__wave {
  @apply w-[320%] max-w-[500%];
}
}
</style>
