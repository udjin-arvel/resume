<template>
  <h2
    v-if="!hideTitle"
    :class="$style.h2"
  >
    {{ $t('land.part') }}
  </h2>

  <div
    :class="$style.slider"
    @mouseenter="pauseAutoplay"
    @mouseleave="resumeAutoplay"
  >
    <div
      ref="sliderContainerRef"
      class="keen-slider"
      :class="$style.slider__keen"
      :style="sliderStyle"
    >
      <div
        v-for="(slide, index) in slides"
        :key="index"
        class="keen-slider__slide"
        :class="$style.slide"
      >
        <MainBrand
          :image-src="slide.image"
          :cite-key="slide.citeKey"
          :name-key="slide.nameKey"
          :date-key="slide.dateKey"
        />
      </div>
    </div>
    <div
      v-if="isMobile && slider"
      ref="dotsRef"
      :class="$style.dots"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, computed } from "vue"
import KeenSlider, { type KeenSliderInstance } from "keen-slider"
import "keen-slider/keen-slider.min.css"

defineProps<{
  hideTitle?: boolean
}>()

interface Slide {
  image: string
  citeKey: string
  nameKey: string
  dateKey: string
}

interface ExtendedKeenSliderInstance extends KeenSliderInstance {
  autoplay?: {
    pause: () => void
    resume: () => void
  }
}

const slides: Slide[] = [
  { image: "/e1.svg", citeKey: "land.rev1", nameKey: "land.name1", dateKey: "land.date1" },
  { image: "/e4.svg", citeKey: "land.rev2", nameKey: "land.name2", dateKey: "land.date2" },
  { image: "/e2.svg", citeKey: "land.rev3", nameKey: "land.name3", dateKey: "land.date3" },
  { image: "/e3.svg", citeKey: "land.rev4", nameKey: "land.name4", dateKey: "land.date1" },
  { image: "/e6.svg", citeKey: "land.rev5", nameKey: "land.name5", dateKey: "land.date5" },
  { image: "/e8.svg", citeKey: "land.rev6", nameKey: "land.name6", dateKey: "land.date3" },
]

const sliderContainerRef = ref<HTMLElement | null>(null)
const dotsRef = ref<HTMLElement | null>(null)
const isMobile = ref(false)
const slider = ref<ExtendedKeenSliderInstance | null>(null)
const currentSlideHeight = ref<number | null>(null)

const sliderStyle = computed(() => {
  return currentSlideHeight.value ? { height: `${currentSlideHeight.value}px` } : {}
})

const equalizeFirstRow = () => {
  if (!isMobile.value && sliderContainerRef.value) {
    const slides = sliderContainerRef.value.querySelectorAll(".keen-slider__slide")
    const firstRow = [slides[0], slides[1]]
    const heights = Array.from(firstRow).map(el => el.scrollHeight)
    const maxHeight = Math.max(...heights)

    firstRow.forEach((el) => {
      (el as HTMLElement).style.minHeight = `${maxHeight}px`
    })
  }
}

const toggleSliderAttribute = (enabled: boolean) => {
  if (!sliderContainerRef.value) {
    return
  }

  if (enabled) {
    sliderContainerRef.value.removeAttribute("data-keen-slider-disabled")
  }
  else {
    sliderContainerRef.value.setAttribute("data-keen-slider-disabled", "")
  }
}

const updateSliderHeight = (instance: KeenSliderInstance) => {
  const currentSlideIndex = instance.track.details.rel
  const slides = sliderContainerRef.value?.querySelectorAll(".keen-slider__slide")

  if (slides && slides[currentSlideIndex]) {
    const slideContent = slides[currentSlideIndex].firstElementChild
    if (slideContent) {
      currentSlideHeight.value = slideContent.scrollHeight
    }
  }
}

const breakPoint = 1100
const checkScreenSize = () => {
  isMobile.value = window.innerWidth < breakPoint

  if (isMobile.value && !slider.value && sliderContainerRef.value) {
    slider.value = new KeenSlider(sliderContainerRef.value, {
      loop: true,
      slides: {
        perView: 1.1,
        spacing: 12,
      },
      created: (instance) => {
        updateDots(instance)
        updateSliderHeight(instance)
        // Move to second slide after initialization
        instance.moveToIdx(1)
      },
      slideChanged: (instance) => {
        updateDots(instance)
        updateSliderHeight(instance)
      },
    })
    toggleSliderAttribute(true)
  }
  else if (!isMobile.value && slider.value) {
    slider.value.destroy()
    toggleSliderAttribute(false)
    slider.value = null
    currentSlideHeight.value = null
    nextTick(equalizeFirstRow)
  }
}

const updateDots = (instance: KeenSliderInstance) => {
  if (!dotsRef.value) {
    return
  }

  const dotCount = instance.track.details.slides.length
  const currentSlide = instance.track.details.rel

  // Clear existing dots
  dotsRef.value.innerHTML = ""

  // Create new dots
  for (let i = 0; i < dotCount; i++) {
    const dot = document.createElement("span")
    dot.classList.add("dot")
    if (i === currentSlide) {
      dot.classList.add("dot--active")
    }
    dot.addEventListener("click", () => {
      instance.moveToIdx(i)
    })
    dotsRef.value.appendChild(dot)
  }
}

const pauseAutoplay = () => {
  slider.value?.autoplay?.pause()
}

const resumeAutoplay = () => {
  slider.value?.autoplay?.resume()
}

onMounted(() => {
  if (window.innerWidth >= breakPoint) {
    toggleSliderAttribute(false)
    nextTick(equalizeFirstRow)
  }
  checkScreenSize()
  window.addEventListener("resize", checkScreenSize)
})

onBeforeUnmount(() => {
  slider.value?.destroy()
  window.removeEventListener("resize", checkScreenSize)
})
</script>

<style module>
.dots {
  @apply flex justify-center  gap-2.5 mb-[4rem];
}

.dots :global(.dot) {
  @apply w-2.5 h-2.5 rounded-full bg-gray-300 cursor-pointer transition-colors duration-300;
}

.dots :global(.dot--active) {
  @apply bg-[#3E2D38] ;
}
.h2 {
  @apply text-[2.5rem] font-bold text-center mb-[3.125rem];
}
.slider {
  @apply overflow-hidden;
}
.slider__keen {
  @apply flex overflow-hidden mb-[5rem] transition-all duration-300;
}

.slider__keen[data-keen-slider-disabled] {
  @apply grid grid-cols-2 gap-[1.25rem];
}

.slider__keen[data-keen-slider-disabled] .keen-slider__slide:nth-child(-n+2) {
  @apply flex;
}

.slider__keen[data-keen-slider-disabled] .keen-slider__slide {
  @apply min-w-[unset] transform-none;
}

.slider__keen[data-keen-slider-disabled] .keen-slider__slide > * {
  @apply w-full;
}
@media (max-width: 1100px)
{
  .slider__keen  {
  margin-bottom: 20px;
  }
}
@media (max-width: 640px)
{
  .h2 {
    font-size: 32px;
    margin-bottom: 30px;
  }
  .slider {
    margin-left: -20px;
    margin-right: -20px;
  }
}
</style>
