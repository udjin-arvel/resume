<template>
  <div
    :class="$style.slider"
    @mouseenter="pauseAutoplay"
    @mouseleave="resumeAutoplay"
  >
    <div
      ref="sliderRef"
      class="keen-slider"
    >
      <div
        v-for="n in 13"
        :key="n"
        class="keen-slider__slide"
        :class="$style.slide"
      >
        <img
          :src="`/e${n}.svg`"
          :alt="`Image ${n}`"
          :class="$style.slider__img"
        >
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue"
import KeenSlider, { type KeenSliderInstance } from "keen-slider"
import "keen-slider/keen-slider.min.css"

const sliderRef = ref<HTMLElement | null>(null)
let slider: KeenSliderInstance | undefined
const isPaused = ref(false)

const animation = { duration: 16000, easing: (t: number) => t }

onMounted(() => {
  const sliderElement = sliderRef.value

  if (!sliderElement) {
    console.error("Slider container not found")
    return
  }

  slider = new KeenSlider(sliderElement, {
    loop: true,
    renderMode: "performance",
    drag: true,
    slides: {
      perView: 6,
      spacing: 16,
      origin: 0,
    },
    breakpoints: {
      "(max-width: 1280px)": {
        slides: { perView: 4 },
      },
      "(max-width: 1024px)": {
        slides: { perView: 3 },
      },
      "(max-width: 900px)": {
        slides: { perView: 2.5 },
      },
    },
    created(s) {
      setTimeout(() => {
        if (!isPaused.value) {
          s.moveToIdx(5, true, animation)
        }
      }, 2000)
    },
    updated(s) {
      if (!isPaused.value) {
        s.moveToIdx(s.track.details.abs + 5, true, animation)
      }
    },
    animationEnded(s) {
      if (!isPaused.value) {
        s.moveToIdx(s.track.details.abs + 5, true, animation)
      }
    },
  })
})

function pauseAutoplay() {
  isPaused.value = true
}

function resumeAutoplay() {
  isPaused.value = false
  if (slider) {
    slider.moveToIdx(slider.track.details.abs + 5, true, animation)
  }
}

onUnmounted(() => {
  if (slider) {
    slider.destroy()
  }
})
</script>

<style module>
.slider {
  @apply mb-[5rem] rounded-[1.25rem] bg-black px-6 shadow-[0_0.5rem_7rem_rgba(0,0,0,0.3)];
}
.slider__img {
  @apply h-full w-auto object-contain translate-y-[0rem] transition duration-300;
}
.slider__img:hover {
  @apply translate-y-[-1rem];
}
.slide {
  @apply inline-flex h-[11rem] items-center justify-center px-4 py-10;
}
@media (max-width: 900px) {
  .slider {
    @apply px-0 -mx-[1.25rem] mb-[2.5rem];
  }
  .slide {
    @apply h-[7.375rem];
  }
}
@media (max-width: 640px) {
  .slider {
    @apply px-0 -mx-[1.25rem] mb-[2.5rem];
  }
  .slide {
    @apply h-[7.375rem];
  }
  .slider__img:hover {
    @apply transform-none;
  }
}
</style>
