<template>
  <div
    v-if="loading"
    class="md-loading"
  >
    <Icon
      name="fa6-solid:spinner"
      class="w-6 h-6 text-beige animate-spin"
      aria-hidden="true"
    />
    <p
      v-if="title"
      class="text-beige text-sm"
    >
      {{ title }}
    </p>
  </div>
</template>

<script setup>
defineProps({
  loading: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: 'Загрузка...'
  }
});
</script>
