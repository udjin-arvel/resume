<template>
  <img
    :src="displaySrc"
    :alt="alt"
    :class="[$style.image, imageClass, isStub && $style.fallback]"
    @error="onError"
    @load="emit('load', $event)"
  >
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue"

const props = withDefaults(defineProps<{
  src?: string | null
  alt?: string
  fallbackSrc?: string
  imageClass?: string
}>(), {
  alt: "",
  fallbackSrc: "/car-stub.svg",
  imageClass: "",
})

const emit = defineEmits<{
  load: [event: Event]
}>()

const failedSrc = ref(false)
const failedFallback = ref(false)

watch(() => [props.src, props.fallbackSrc], () => {
  failedSrc.value = false
  failedFallback.value = false
})

const isStub = computed(() => !props.src || failedFallback.value)

const displaySrc = computed(() => {
  if (!props.src || failedFallback.value) {
    return "/car-stub.svg"
  }
  if (failedSrc.value) {
    return props.fallbackSrc
  }
  return props.src
})

const onError = () => {
  if (!failedSrc.value && props.fallbackSrc && props.fallbackSrc !== props.src) {
    console.warn("[CarPreviewImage] не удалось загрузить изображение", {
      src: displaySrc.value,
      fallback: props.fallbackSrc,
    })
    failedSrc.value = true
    return
  }
  console.warn("[CarPreviewImage] не удалось загрузить изображение", {
    src: displaySrc.value,
    fallback: props.fallbackSrc ?? "/car-stub.svg",
  })
  failedFallback.value = true
}
</script>

<style module>
.image {
  @apply block object-cover;
}

.fallback {
  @apply bg-gray-50 object-contain p-3;
}
</style>
