<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="md-modal-root"
        @click.self="cancel"
      >
        <div class="md-modal-overlay" />

        <div class="md-modal-panel mx-4">
          <div class="md-modal-body-center">
            <div class="md-modal-icon bg-beige/10">
              <Icon name="fa6-solid:triangle-exclamation" class="w-5 h-5 text-beige/80" />
            </div>

            <h3 class="md-modal-title mb-2">
              {{ title }}
            </h3>

            <p class="md-modal-message mb-6">
              {{ message }}
            </p>

            <div class="flex flex-wrap justify-center gap-3">
              <button
                type="button"
                class="md-btn-filled"
                @click="confirm"
              >
                {{ confirmText }}
              </button>
              <button
                type="button"
                class="md-btn-text"
                @click="cancel"
              >
                {{ cancelText }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: 'Подтверждение'
  },
  message: {
    type: String,
    default: 'Вы уверены, что хотите выполнить это действие?'
  },
  confirmText: {
    type: String,
    default: 'Да'
  },
  cancelText: {
    type: String,
    default: 'Отмена'
  }
});

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel']);

const confirm = () => {
  emit('confirm');
  emit('update:modelValue', false);
};

const cancel = () => {
  emit('cancel');
  emit('update:modelValue', false);
};
</script>
