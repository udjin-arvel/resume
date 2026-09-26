<template>
  <picture :class="pictureClass">
    <source
      v-if="showDesktopSource"
      media="(min-width: 768px)"
      :srcset="image.desktop"
    >
    <img
      :src="currentSrc"
      :alt="alt"
      :class="imageClass"
      loading="lazy"
      @error="onError"
      @load="$emit('load')"
    >
  </picture>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { carStubImage } from "@/constants/catalog"
import type { CatalogCardImage } from "@/utils/catalogImages"

const props = defineProps<{
  image: CatalogCardImage
  alt: string
  pictureClass?: string
  imageClass?: string
}>()

defineEmits<{
  load: []
}>()

const failedConversion = ref(false)
const failedOriginal = ref(false)

watch(() => props.image, () => {
  failedConversion.value = false
  failedOriginal.value = false
}, { deep: true })

const currentSrc = computed(() => {
  if (failedOriginal.value) {
    return carStubImage
  }
  if (failedConversion.value) {
    return props.image.original
  }
  return props.image.mobile
})

const showDesktopSource = computed(() =>
  !failedConversion.value && props.image.desktop !== currentSrc.value,
)

function onError() {
  if (!failedConversion.value && currentSrc.value !== props.image.original) {
    failedConversion.value = true
    return
  }
  failedOriginal.value = true
}
</script>
