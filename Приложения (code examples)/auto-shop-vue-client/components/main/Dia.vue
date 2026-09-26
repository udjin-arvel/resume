<template>
  <h3 :class="$style.h3">
    <span :class="$style.red">{{ $t('land.use') }}</span> {{ $t('land.what2') }}
  </h3>
  <div :class="$style.grid">
    <div :class="$style.cell">
      <div :class="$style.dia">
        <div :class="$style.dia__title">
          {{ $t('land.on') }} <span :class="$style.dia__red">3</span> {{ $t('land.month') }}
        </div>
        <div :class="$style.dia__text">
          {{ $t('land.guarantee') }}
        </div>
      </div>
    </div>
    <div :class="$style.cell">
      <div :class="$style.dia">
        <div :class="$style.dia__title">
          <span :class="$style.dia__red">599</span> {{ $t('land.yuan') }}
        </div>
        <div :class="$style.dia__text">
          {{ $t('land.cost2') }}
        </div>
      </div>
    </div>
    <div :class="$style.cell">
      <div :class="$style.dia">
        <div :class="$style.dia__title">
          <span :class="$style.dia__red">+50</span> {{ $t('land.yuan') }}
        </div>
        <div :class="$style.dia__text">
          {{ $t('land.check') }}
        </div>
      </div>
    </div>
    <div :class="$style.cell">
      <div :class="$style.dia">
        <div :class="$style.dia__title">
          <span :class="$style.dia__red">+50</span> {{ $t('land.yuan') }}
        </div>
        <div :class="$style.dia__text">
          {{ $t('land.electro') }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">

</script>

<style module>
.dia {
  @apply shadow-[0_0.5rem_1.5rem_rgba(0,0,0,0.08)] text-center rounded-[1.25rem] bg-white mb-[5.625rem] h-[13rem] overflow-hidden px-[1.25rem] pt-[2.5rem] border border-grey-300 transition-transform duration-300 translate-y-0;
}

.dia:hover {
  @apply shadow-[0_0.5rem_1.5rem_rgba(0,0,0,0.08)] -translate-y-8;
}

.dia__title {
  @apply text-[1.5rem] font-normal mb-0;
}

.dia__red {
  @apply text-[3.125rem] font-bold text-primary;
}

.dia__text {
  @apply text-[1.25rem] font-medium text-grey;
}

.h3 {
  @apply text-[1.5rem] font-medium mb-[6.1875rem] w-[51.25rem] text-center mx-auto max-w-full;
}

.red {
  @apply text-primary;
}

.grid {
  @apply flex flex-wrap -mx-[0.625rem];
}

.cell {
  @apply px-[0.625rem] w-1/4;
}
@media (max-width: 1300px) {
  .cell {
    @apply w-1/2;
  }

  .grid {
    @apply mb-[4.375rem];
  }

  .dia {
    @apply mb-[1.125rem];
  }
}
@media (max-width: 640px) {
  .h3 {
    @apply text-[1.375rem] mb-[4.25rem];
  }
  .cell {
    @apply w-full;
  }
  .dia {
    @apply h-auto pb-[1.875rem] pt-[1.875rem];
  }
  .dia:hover {
    @apply transform-none;
  }
}
</style>
