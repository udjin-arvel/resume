<template>
  <div :class="$style.export">
    <div :class="$style.export__left">
      <div :class="$style.export__title">
        {{ $t('land.find') }}
      </div>
      <div :class="$style.export__text">
        {{ $t('land.best') }}
      </div>
      <div :class="$style.export__label">
        <div :class="$style.export__inside">
          {{ $t('land.inside') }}
        </div>
      </div>
      <div :class="$style.export__flex">
        <button
          :class="$style.export__btn"
          @click="scrollToWhat"
        >
          {{ $t('land.what') }}
        </button>
        <button
          :class="$style.export__connect"
          @click="scrollToConsult"
        >
          {{ $t('land.connect') }}
        </button>
      </div>
    </div>
    <div :class="$style.export__img">
      <img
        :class="$style.export__car"
        src="/car_up.webp"
        :alt="$t('land.car')"
      >
    </div>
  </div>
</template>

<script setup lang="ts">
const scrollToConsult = () => {
  const element = document.getElementById("consult")
  if (element) {
    element.scrollIntoView({ behavior: "smooth" })
  }
}
const scrollToWhat = () => {
  const element = document.getElementById("what")
  if (element) {
    element.scrollIntoView({ behavior: "smooth" })
  }
}
</script>

<style module>
.export {
  @apply mx-auto mb-[3.1rem] text-white px-[3.1875rem] pt-[3.2rem] pb-[1.375rem] flex flex-wrap rounded-[1.25rem] bg-black;
}

.export__title {
  @apply text-[2.5rem] font-bold leading-[1.25] mb-5;
}

.export__car {
  @apply transition-transform duration-300;
}

.export__car:hover {
  @apply -translate-y-6 transition-transform duration-300;
}

.export__text {
  @apply text-[1.125rem] font-normal mb-[0.9375rem] leading-[1.2];
}

.export__label {
  @apply bg-[url('/label.svg')] bg-no-repeat bg-left-top text-[1.125rem] font-semibold mb-[0.8rem] pt-[0.55rem] pb-[1.3875rem] pl-[4.375rem];
}

.export__inside {
  @apply -rotate-2;
}

.export__flex {
  @apply flex flex-wrap;
}

.export__btn {
  @apply inline-block rounded-[0.75rem] bg-primary px-[1.875rem] pt-[1rem] pb-[1.1rem] text-[1rem] font-bold mb-5 mr-[1.5625rem] text-white border border-transparent hover:bg-white hover:text-primary transition-colors duration-300 cursor-pointer;
}

.export__connect {
  @apply inline-block rounded-[0.75rem] bg-transparent mb-5 px-[1.875rem] pt-[0.9rem] pb-[0.875rem] text-[1rem] font-medium text-white border border-white hover:bg-white hover:text-black hover:border-black transition-colors duration-300 cursor-pointer;
}

.export__img {
  @apply w-[58%] pt-[1.6875rem];
}

.export__left {
  @apply w-[42%];
}

@media (max-width: 1200px) {
  .export {
    @apply px-[2.5rem];
  }
  .export__img {
    @apply w-[40%] pt-0;
  }
  .export__left {
    @apply w-[60%];
  }
}

@media (max-width: 900px) {
  .export {
    @apply relative pt-[15.625rem] overflow-hidden;
  }
  .export__img {
    @apply absolute left-0 w-[33.75rem] top-[3.125rem];
  }
  .export__left {
    @apply w-full;
  }
}

@media (max-width: 640px) {
  .export {
    @apply -mx-[1.25rem] pb-[1.25rem] mb-[2.5rem];
  }
  .export__img {
    @apply absolute left-1/2 w-[25rem] transform -translate-x-1/2;
  }
  .export__title {
    @apply text-[2rem] mb-[1.25rem];
  }
  .export__label {
    @apply pt-[1.125rem] -mr-[2.5rem] text-center pl-0 -ml-[2.5rem] bg-center;
  }
  .export__btn, .export__connect {
    @apply w-full mr-0 text-center mb-[1.25rem];
  }
  .export__car:hover {
    @apply transform-none;
  }
}
</style>
