<template>
  <span :class="[$style.thumb, hasPhoto && $style.thumb_photo]">
    <img
      v-if="hasPhoto"
      :src="src ?? undefined"
      :alt="alt"
      loading="lazy"
      :class="$style.img"
      @error="failed = true"
    >
    <svg
      v-else
      viewBox="0 0 96 52"
      fill="none"
      aria-hidden="true"
      :class="$style.icon"
    >
      <path
        d="M6 38c0-3 2-5 6-6l7-1 9-11c2-2 5-4 9-4h20c5 0 9 2 13 6l7 8 5 1c4 1 6 3 6 6v3c0 2-2 4-4 4h-6"
        stroke="#aeb6c2"
        stroke-width="3"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M6 38h12M40 45h20"
        stroke="#aeb6c2"
        stroke-width="3"
        stroke-linecap="round"
      />
      <circle
        cx="28"
        cy="43"
        r="7"
        fill="#fff"
        stroke="#8b93a1"
        stroke-width="3"
      />
      <circle
        cx="72"
        cy="43"
        r="7"
        fill="#fff"
        stroke="#8b93a1"
        stroke-width="3"
      />
      <path
        d="M30 16h20l5 7H27z"
        fill="#d3d9e2"
      />
    </svg>
    <slot />
  </span>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue"

const props = withDefaults(defineProps<{
  src?: string | null
  alt?: string
}>(), {
  src: null,
  alt: "",
})

const failed = ref(false)

watch(() => props.src, () => {
  failed.value = false
})

const hasPhoto = computed(() => Boolean(props.src) && !failed.value)
</script>

<style module>
.thumb {
  position: relative;
  display: grid;
  place-items: center;
  overflow: hidden;
  flex: none;
  background: linear-gradient(160deg, #eef1f5, #e2e6ec);
  border: 1px solid var(--ld-line);
}

.img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.icon {
  width: 62%;
  height: auto;
}
</style>
