<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="md-modal-root"
        @click.self="close"
      >
        <div class="md-modal-overlay" />

        <div class="md-modal-panel mx-4">
          <div class="md-modal-body-center">
            <div class="md-modal-icon" :class="iconBgClass">
              <Icon :name="iconName" class="w-5 h-5" :class="iconClass" />
            </div>

            <h3 class="md-modal-title mb-2">
              {{ title }}
            </h3>

            <p class="md-modal-message mb-6">
              {{ message }}
            </p>

            <button
              type="button"
              class="md-btn-filled"
              @click="close"
            >
              {{ buttonText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: 'Сообщение'
  },
  message: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'info',
    validator: (value) => ['info', 'success', 'warning', 'error'].includes(value)
  },
  buttonText: {
    type: String,
    default: 'Понятно'
  }
});

const emit = defineEmits(['update:modelValue', 'close']);

const iconName = computed(() => {
  const icons = {
    info: 'fa6-solid:circle-info',
    success: 'fa6-solid:circle-check',
    warning: 'fa6-solid:triangle-exclamation',
    error: 'fa6-solid:circle-xmark'
  };
  return icons[props.type];
});

const iconBgClass = computed(() => {
  const classes = {
    info: 'bg-beige/10',
    success: 'bg-green-500/10',
    warning: 'bg-gold/10',
    error: 'bg-reder/10'
  };
  return classes[props.type];
});

const iconClass = computed(() => {
  const classes = {
    info: 'text-beige/80',
    success: 'text-green-400/90',
    warning: 'text-gold/90',
    error: 'text-reder/90'
  };
  return classes[props.type];
});

const close = () => {
  emit('close');
  emit('update:modelValue', false);
};
</script>
