<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="md-modal-root"
        @click.self="close"
      >
        <div class="md-modal-overlay" @click="close" />

        <div class="md-modal-panel md-modal-panel-lg mx-4">
          <div class="md-modal-header">
            <h2 class="md-modal-title">Редактировать фрагмент</h2>
            <button
              type="button"
              class="md-modal-close"
              @click="close"
            >
              <Icon name="fa6-solid:xmark" class="w-5 h-5" />
            </button>
          </div>

          <div class="md-modal-body space-y-5">
            <Editor
              v-model="editorContent"
              placeholder="Редактируйте текст фрагмента..."
            />
          </div>

          <div class="md-modal-footer">
            <button
              type="button"
              class="md-btn-text"
              :disabled="saving"
              @click="close"
            >
              Отмена
            </button>
            <button
              type="button"
              class="md-btn-filled"
              :disabled="saving || !editorContent.trim()"
              @click="save"
            >
              <Icon v-if="saving" name="fa6-solid:spinner" class="w-4 h-4 animate-spin" />
              {{ saving ? 'Сохранение...' : 'Сохранить' }}
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
  fragmentText: {
    type: String,
    default: ''
  },
  saving: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'save']);

const editorContent = ref('');

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    editorContent.value = props.fragmentText;
  }
});

watch(() => props.fragmentText, (text) => {
  if (props.modelValue) {
    editorContent.value = text;
  }
});

const close = () => {
  emit('update:modelValue', false);
};

const save = () => {
  const text = editorContent.value.replace(/<[^>]*>/g, '').trim();
  if (!text) return;
  emit('save', text);
};
</script>
