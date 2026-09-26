<template>
  <div :class="$style.brand">
    <div :class="$style.brand__logo">
      <img
        :src="imageSrc"
        :class="$style.brand__img"
        alt="logo"
      >
    </div>
    <div :class="$style.brand__main">
      <div :class="$style.brand__cite">
        {{ $t(citeKey) }}
      </div>
      <div :class="$style.brand__helper" />
      <div :class="$style.brand__footer">
        <div :class="$style.brand__name">
          {{ $t(nameKey) }}
        </div>
        <div :class="$style.brand__who">
          {{ $t(whoKey) }}
          <span :class="$style.brand__date">
            {{ $t(dateKey) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from "vue"

defineProps({
  imageSrc: {
    type: String,
    required: true,
  },
  citeKey: {
    type: String,
    default: "land.rev1",
  },
  nameKey: {
    type: String,
    default: "land.name1",
  },
  whoKey: {
    type: String,
    default: "land.who1",
  },
  dateKey: {
    type: String,
    default: "land.date1",
  },
})
</script>

<style module>
.brand {
  @apply flex overflow-hidden flex-wrap rounded-[1.25rem] mb-[1.25rem] bg-black p-[1.5rem_1.5625rem_0.125rem] relative h-full;
}

.brand__main {
  @apply w-[71%] transition-transform duration-300;
}
.brand__main:hover {
  @apply -translate-y-3 transition-transform duration-300;
}
.brand__logo {
  @apply w-[29%] flex items-center justify-center pb-[1.875rem] px-[1rem];
}

.brand__helper {
  @apply h-[1.25rem] bg-white rounded-bl-[1.25rem];
}
.brand__cite {
  @apply relative bg-white shadow-[0px_0.3125rem_0.75rem_0px_#FFFFFF40] p-[1rem_0.9375rem_1.125rem_2.3125rem] text-[1rem] rounded-[0.625rem_0.625rem_0.625rem_0] whitespace-pre-line;
}

.brand__cite::before {
  @apply content-[''] absolute left-[0.375rem] top-[0.375rem] block w-[1.3125rem] h-[1.1875rem] bg-[url('/cite.svg')] bg-no-repeat bg-center;
}

.brand__footer {
  @apply mt-[-1.3rem] ml-[1.3rem] relative w-[100%] rounded-tl-[1.25rem] bg-black p-[0.8125rem_0.75rem] z-30;
}

.brand__name {
  @apply font-bold text-[1.375rem] text-white mb-0;
}

.brand__who {
  @apply text-[0.875rem] text-grey-300;
}

.brand__date {
  @apply text-primary;
}
@media (max-width: 1100px) {
  .brand {
    @apply h-auto;
  }
}
@media (max-width: 800px) {
  .brand__logo {
    @apply w-full h-[10.375rem] pb-[0.3125rem];
  }
  .brand__date {
    @apply inline-block;
  }
  .brand__who {
    @apply text-[1rem];
  }
  .brand__name {
    @apply text-[1.5rem];
  }
  .brand__main {
    @apply w-full;
  }
}
@media (max-width: 640px) {
  .brand__logo {
    @apply hidden;
  }
  .brand__date {
    @apply inline-block;
  }
  .brand__who {
    @apply text-[1rem];
  }
  .brand__name {
    @apply text-[1.5rem];
  }
  .brand__main {
    @apply w-full;
  }
  .brand__main:hover {
    @apply transform-none;
  }
}
</style>
