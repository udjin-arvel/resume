<template>
  <div :class="$style.connect">
    <div :class="$style.connect__text">
      {{ $t('land.connect2') }}
    </div>
    <div :class="$style.connect__icon">
      <img
        :class="$style.connect__tels"
        src="/tels.svg"
        :alt="$t('land.tels')"
      >
    </div>
    <div :class="$style.connect__helper">
      <button
        :class="$style.connect__btn"
        @click="scrollToConsult"
        @mouseenter="isHovered = true"
        @mouseleave="isHovered = false"
      >
        {{ $t('land.connect') }}
        <img
          :class="$style.connect__arr"
          :src="isHovered ? '/arr-red.svg' : '/arr.svg'"
          :alt="$t('land.arr')"
        >
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue"

const isHovered = ref(false)

const scrollToConsult = () => {
  const element = document.getElementById("consult")
  if (element) {
    element.scrollIntoView({ behavior: "smooth" })
  }
}
</script>

<style module>
.connect {
  @apply p-[3.375rem_4.625rem_3.6875rem] mb-[3.75rem] bg-black rounded-[1.25rem] flex flex-wrap justify-between relative;
}

.connect__icon {
  @apply absolute left-[48%] bottom-0;
}

.connect__helper {
  @apply mt-[1.5rem] mr-[1.875rem];
}

.connect__btn {
  @apply inline-flex flex-wrap w-[17.9375rem] text-white font-bold text-[1.375rem] bg-primary rounded-[0.75rem] py-[1.0625rem] px-[1rem] justify-center border border-transparent hover:bg-white hover:text-primary transition-colors duration-300;
}

.connect__arr {
  @apply inline-block ml-[0.625rem] w-[1.5rem] h-[1.5625rem];
}

.connect__text {
  @apply text-[2.5rem] w-[37.0625rem] text-white font-bold;
}

@media (max-width: 1300px) {
  .connect {
    @apply px-10;
  }
  .connect__text {
    @apply text-[2rem] w-[24rem];
  }
  .connect__icon {
    @apply left-[38%];
  }
  .connect__helper {
    @apply mr-0;
  }
}

@media (max-width: 1000px) {
  .connect {
    @apply pt-[3.375rem] pb-0;
  }
  .connect__icon {
    @apply bottom-auto static;
  }
  .connect__text {
    @apply w-full mb-2;
  }
}

@media (max-width: 640px) {
  .connect {
    @apply pb-[3.125rem] -mx-5 flex-col justify-center items-center text-center;
  }
  .connect__helper {
    @apply mt-0;
  }
  .connect__icon {
    @apply static mb-2;
  }
  .connect__text {
    @apply w-full mb-2;
  }
  .connect__btn {
    @apply w-full max-w-[17.9375rem] px-[1rem];
  }
}
</style>
