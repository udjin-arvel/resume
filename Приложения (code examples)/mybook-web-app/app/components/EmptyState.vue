<template>
  <div
    v-if="show"
    class="md-empty-state"
  >
    <p
      class="md-empty-state-text"
      :class="{ 'md-empty-state-text-error': variant === 'error' }"
    >
      {{ title }}
    </p>
  </div>
</template>

<script setup>
defineProps({
  show: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    required: true
  },
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'error'].includes(value)
  }
});
</script>
