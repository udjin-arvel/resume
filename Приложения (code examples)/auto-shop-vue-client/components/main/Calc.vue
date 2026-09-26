<template>
  <div :class="$style.calc">
    <div :class="$style.calc__left">
      <div :class="$style.calc__title">
        {{ $t('land.all') }}
      </div>
      <div :class="$style.calc__text">
        {{ $t('land.know') }} <span :class="$style.calc__red">{{ $t('land.how') }}</span> {{ $t('land.china3') }}
      </div>
    </div>

    <div :class="$style.calc__icon">
      <img
        :class="$style.calc__tels"
        src="/calc2.svg"
        :alt="$t('land.tels')"
      >
    </div>

    <div :class="$style.calc__helper">
      <div :class="$style.calc__count">
        {{ $t('land.calc') }}
      </div>

      <NuxtLink
        :to="{ name: 'personal' }"
        :class="$style.calc__label"
      >
        <div :class="$style.calc__inside">{{ $t('land.soon') }}</div>

      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">

</script>

<style module>
.calc {
  @apply bg-black rounded-[1.25rem] flex flex-wrap justify-between relative text-white mb-[2.5rem] pt-[2.875rem] px-[4.625rem] pb-[1.125rem] overflow-hidden;
}

.calc__count {
  @apply font-bold text-[1.375rem] px-[1.875rem] py-[1.0625rem] rounded-[0.75rem] bg-[#FFFFFF0D] text-grey;
}

.calc__left {
  @apply w-1/2;
}

.calc__title {
  @apply font-bold text-[2.375rem] mb-[0.75rem];
}

.calc__icon {
  @apply absolute left-[48%] bottom-[-3rem];;

}

.calc__helper {
  @apply mt-[0.9375rem] mr-[0.53125rem];
}

.calc__btn {
  @apply inline-flex flex-wrap w-[17.9375rem] text-white font-bold text-[1.375rem] bg-primary rounded-[0.75rem] py-[1.0625rem] px-[0.1875rem] justify-center transition-opacity;
}

.calc__btn:hover {
  @apply opacity-90;
}

.calc__arr {
  @apply inline-block ml-[0.390625rem] w-[0.9375rem] h-[0.9765625rem];
}

.calc__text {
  @apply text-[1.5rem] font-semibold mb-[0.625rem] text-[#ECE8DF];
}

.calc__red {
  @apply text-primary;
}

.calc__label {
  @apply bg-[url('/stripe2.svg')] bg-no-repeat bg-center font-semibold mb-[0.5rem] pb-[0.864rem] block font-extrabold text-[1.375rem] pt-[0.8rem] mr-[-1.4375rem] mt-[-0.8rem] text-center;
}

.calc__inside {
  @apply -rotate-2;
}
@media (max-width: 1370px)
{
 .calc__left {
  @apply w-[40%];
}

.calc__title {
  @apply mb-3 text-[2rem];
}

.calc__icon {
  @apply left-[38%];
}

.calc__helper {
  @apply mr-0;
}

.calc__text {
  @apply text-[1.5rem] mb-[1.4375rem];
}
}
@media (max-width: 1130px)
{
 .calc__left {
  @apply w-full;
}

.calc__count {
  @apply text-center;
}

.calc__helper {
  @apply w-full mt-0;
}

.calc__icon {
  @apply static mb-5;
}
}
@media (max-width: 640px)
{
 .calc {
  @apply px-10 -ml-5 -mr-5;
}

.calc__count {
  @apply px-[0.125rem];
}

.calc__label {
  @apply -mx-[1.5625rem];
}
}
</style>
