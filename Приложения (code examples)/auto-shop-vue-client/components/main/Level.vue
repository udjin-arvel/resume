<template>
  <div :class="$style.wrap">
    <h2 :class="$style.h2">
      {{ $t('land.levels') }}
    </h2>

    <div
      v-for="(level, index) in levels"
      :key="level.id || index"
      :class="$style.level"
    >
      <!-- Arrow -->
      <div
        v-if="level.showArrow"
        :class="[
          $style.level__arr,
          { [$style.level__arr_rev]: level.reverseArrow },
        ]"
      >
        <img
          src="/arr2.svg"
          alt="arrow"
          :class="$style.level__curve"
        >
        <img
          src="/arr5.svg"
          alt="arrow"
          :class="$style.level__ray"
        >
      </div>

      <!-- Icon -->
      <div :class="$style.level__left">
        <img
          :class="$style.level__icon"
          :src="level.icon"
          alt="icon"
        >
      </div>

      <!-- Content -->
      <div :class="$style.level__main">
        <div :class="$style.level__info">
          {{ $t('land.level') }} {{ level.number }}
        </div>
        <div :class="$style.level__title">
          {{ $t(level.titleKey) }}
        </div>
        <div :class="$style.level__text">
          {{ $t(level.textKey) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue"

const levels = ref([
  {
    id: "level-1",
    number: 1,
    icon: "/f1.svg",
    titleKey: "land.import",
    textKey: "land.address",
    showArrow: true,
    reverseArrow: false,
  },
  {
    id: "level-2",
    number: 2,
    icon: "/f2.svg",
    titleKey: "land.import2",
    textKey: "land.address2",
    showArrow: true,
    reverseArrow: true,
  },
  {
    id: "level-3",
    number: 3,
    icon: "/f3.svg",
    titleKey: "land.import3",
    textKey: "land.address3",
    showArrow: true,
    reverseArrow: false,
  },
  {
    id: "level-4",
    number: 4,
    icon: "/f4.svg",
    titleKey: "land.import4",
    textKey: "land.address4",
    showArrow: true,
    reverseArrow: true,
  },
  {
    id: "level-5",
    number: 5,
    icon: "/f5.svg",
    titleKey: "land.import5",
    textKey: "land.address5",
    showArrow: true,
    reverseArrow: false,
  },
  {
    id: "level-6",
    number: 6,
    icon: "/f6.svg",
    titleKey: "land.import6",
    textKey: "land.address6",
    showArrow: true,
    reverseArrow: true,
  },
  {
    id: "level-7",
    number: 7,
    icon: "/f7.svg",
    titleKey: "land.import7",
    textKey: "land.address7",
    showArrow: false,
    reverseArrow: false,
  },
])
</script>

<style module>
.wrap {
  @apply w-[52.25rem] max-w-full mx-auto mb-[3.75rem];
}

.level {
  @apply relative mb-[3.125rem] pt-[0.5625rem] px-[2.5rem] pb-[1.8125rem] rounded-[1.25rem] shadow-[0_0.5rem_1.5rem_rgba(0,0,0,0.08)] border border-[#AFA7AC] flex flex-wrap transition-transform duration-300;
}
.level:hover {
  @apply -translate-y-6 transition-transform duration-300;
}
.level__arr {
  @apply absolute right-[-5rem] bottom-[-7.9375rem] w-[4.1875rem] h-[12rem];
}

.level__arr_rev {
  @apply left-[-5rem] right-auto scale-x-[-1];
}

.level__left {
  @apply w-[18.5%];
}
.level__ray {
  @apply hidden;
}
.level__main {
  @apply w-[81%] pt-[1.875rem];
}

.level__info {
  @apply text-grey font-medium text-[1.25rem] mb-[0.0625rem];
}

.level__title {
  @apply mb-[0.6875rem] text-[2.375rem] font-bold;
}

.level__text {
  @apply text-[1.25rem] mb-[0.625rem];
}

.h2 {
  @apply text-[2.5rem] relative font-bold text-center pt-[1.875rem] pb-[1.875rem] mb-[1.875rem];
}

.h2::after {
  @apply content-[''] absolute w-[2.9375rem] h-[0.25rem] left-1/2 bottom-0 -translate-x-1/2 bg-primary;
}
@media (max-width: 1100px) {
  .level {
    @apply mb-20;
  }

  .level__ray {
    @apply block;
  }

  .level__curve {
    @apply hidden;
  }

  .level__arr {
    @apply scale-x-[1] left-[48%] bottom-[-12.5rem];
  }
}
@media (max-width: 640px) {
  .wrap {
    @apply mb-10;
  }

  .level {
    @apply px-[0.625rem] pb-5 -mx-5;
  }

  .level:hover {
    @apply transform-none;
  }

  .level__title {
    @apply mb-3 text-2xl;
  }

  .level__left {
    @apply w-[35%];
  }

  .level__main {
    @apply pt-5 w-[65%];
  }

  .level__text {
    @apply text-lg;
  }
}
</style>
