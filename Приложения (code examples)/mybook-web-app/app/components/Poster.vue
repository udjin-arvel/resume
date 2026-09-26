<template>
  <div
    v-if="poster"
    class="poster flex-shrink-0"
    :class="`poster--${size}`"
  >
    <img
      :src="posterUrl"
      :alt="alt"
      class="poster__image"
    >
  </div>
</template>

<script setup>
const config = useRuntimeConfig();
const apiBase = config.public.apiBase || 'http://localhost:3001';

const props = defineProps({
  poster: {
    type: String,
    default: null
  },
  alt: {
    type: String,
    default: ''
  },
  size: {
    type: String,
    default: 'sm',
    validator: (value) => ['sm', 'md', 'lg'].includes(value)
  }
});

const posterUrl = computed(() => {
  if (!props.poster) return null;
  if (props.poster.startsWith('http')) return props.poster;
  return `${apiBase}${props.poster}`;
});
</script>

<style scoped lang="scss">
.poster {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 0.5rem;
  border: 1px solid rgba(221, 176, 137, 0.4);
  background-color: rgba(0, 0, 0, 0.4);

  aspect-ratio: 1;

  &--sm {
    width: min(150px, 100%);
  }

  &--md {
    width: min(400px, 100%);
  }

  &--lg {
    width: min(800px, 100%);
  }

  &__image {
    display: block;
    max-width: 100%;
    max-height: 100%;
    width: auto;
    height: auto;
    object-fit: contain;
    object-position: center;
  }
}
</style>
