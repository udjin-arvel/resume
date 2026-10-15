<template>
  <div class="md-field">
    <label class="md-label">{{ label }}</label>
    <div class="space-y-3">
      <div v-if="modelValue" class="relative inline-block">
        <img
          :src="modelValue"
          alt="Превью"
          class="md-image-preview"
        >
        <button
          type="button"
          class="md-icon-button absolute top-2 right-2 w-8 h-8 bg-reder/90 text-white hover:bg-reder focus:outline-none"
          @click="onRemove"
        >
          <Icon name="fa6-solid:xmark" class="w-4 h-4" />
        </button>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <input
          ref="fileInput"
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          class="hidden"
          @change="onChange"
        >
        <button
          type="button"
          class="md-btn-text text-sm py-2 px-4 bg-dark/60 hover:bg-dark"
          @click="fileInput?.click()"
        >
          {{ modelValue ? 'Изменить изображение' : 'Выбрать изображение' }}
        </button>
        <span class="md-hint">JPEG, PNG, GIF, WebP (макс. 10MB)</span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  modelValue: {
    type: String,
    default: null
  },
  label: {
    type: String,
    default: 'Изображение'
  }
});

const emit = defineEmits(['update:modelValue', 'file', 'remove', 'error']);

const fileInput = ref(null);

const onChange = (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  if (file.size > 10 * 1024 * 1024) {
    emit('error', 'Размер файла не должен превышать 10MB');
    return;
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    emit('error', 'Разрешены только изображения (JPEG, PNG, GIF, WebP)');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    emit('update:modelValue', e.target.result);
  };
  reader.readAsDataURL(file);
  emit('file', file);
};

const onRemove = () => {
  emit('update:modelValue', null);
  emit('remove');
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};
</script>
