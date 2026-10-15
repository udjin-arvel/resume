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
          <div class="md-modal-header">
            <h3 class="md-modal-title">Добавить изображение</h3>
            <button
              type="button"
              class="md-modal-close"
              @click="cancel"
            >
              <Icon name="fa6-solid:xmark" class="w-5 h-5" />
            </button>
          </div>

          <form @submit.prevent="uploadImage">
            <div class="md-modal-body space-y-5">
              <div
                class="md-modal-dropzone"
                :class="{ 'md-modal-dropzone-active': previewUrl }"
                @click="triggerFileInput"
                @dragover.prevent
                @drop.prevent="handleDrop"
              >
                <input
                  ref="fileInput"
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  class="hidden"
                  @change="handleFileSelect"
                >

                <template v-if="previewUrl">
                  <img
                    :src="previewUrl"
                    alt="Preview"
                    class="max-w-full max-h-48 mx-auto rounded-lg border border-white/10"
                  >
                  <p class="text-on-surface-muted text-sm mt-3">Нажмите, чтобы заменить</p>
                </template>
                <template v-else>
                  <Icon name="fa6-solid:cloud-arrow-up" class="w-10 h-10 text-on-surface-muted mx-auto mb-2" />
                  <p class="text-white/80 text-sm">Нажмите или перетащите изображение</p>
                  <p class="text-on-surface-muted text-xs mt-1">JPEG, PNG, GIF, WebP (до 10МБ)</p>
                </template>
              </div>

              <div class="md-field">
                <label class="md-label" for="image-title">Название (опционально)</label>
                <input
                  id="image-title"
                  v-model="imageTitle"
                  type="text"
                  class="md-input"
                  placeholder="Введите название изображения..."
                >
              </div>

              <p v-if="errorMessage" class="text-reder/90 text-sm">
                {{ errorMessage }}
              </p>
            </div>

            <div class="md-modal-footer">
              <button
                type="button"
                class="md-btn-text"
                :disabled="uploading"
                @click="cancel"
              >
                Отмена
              </button>
              <button
                type="submit"
                class="md-btn-filled"
                :disabled="!selectedFile || uploading"
              >
                <Icon v-if="uploading" name="fa6-solid:spinner" class="w-4 h-4 animate-spin" />
                {{ uploading ? 'Загрузка...' : 'Загрузить' }}
              </button>
            </div>
          </form>
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
  contentType: {
    type: String,
    required: true,
    validator: (value) => ['notion', 'lore', 'note', 'fragment'].includes(value)
  },
  contentId: {
    type: [Number, String],
    required: true
  }
});

const emit = defineEmits(['update:modelValue', 'uploaded', 'cancel']);

const { apiFormData } = useApi();

const fileInput = ref(null);
const selectedFile = ref(null);
const previewUrl = ref(null);
const imageTitle = ref('');
const uploading = ref(false);
const errorMessage = ref('');

watch(() => props.modelValue, (newVal) => {
  if (!newVal) {
    resetForm();
  }
});

const resetForm = () => {
  selectedFile.value = null;
  previewUrl.value = null;
  imageTitle.value = '';
  errorMessage.value = '';
  uploading.value = false;
};

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileSelect = (event) => {
  const file = event.target.files[0];
  processFile(file);
};

const handleDrop = (event) => {
  const file = event.dataTransfer.files[0];
  processFile(file);
};

const processFile = (file) => {
  if (!file) return;

  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    errorMessage.value = 'Поддерживаются только изображения (JPEG, PNG, GIF, WebP)';
    return;
  }

  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    errorMessage.value = 'Размер файла не должен превышать 10МБ';
    return;
  }

  errorMessage.value = '';
  selectedFile.value = file;

  const reader = new FileReader();
  reader.onload = (e) => {
    previewUrl.value = e.target.result;
  };
  reader.readAsDataURL(file);
};

const uploadImage = async () => {
  if (!selectedFile.value) return;

  uploading.value = true;
  errorMessage.value = '';

  try {
    const formData = new FormData();
    formData.append('image', selectedFile.value);
    if (imageTitle.value.trim()) {
      formData.append('title', imageTitle.value.trim());
    }

    const response = await apiFormData(`/images/${props.contentType}/${props.contentId}`, {
      method: 'POST',
      body: formData
    });

    if (response.success) {
      emit('uploaded', response.data);
      emit('update:modelValue', false);
    } else {
      errorMessage.value = response.error || 'Не удалось загрузить изображение';
    }
  } catch (error) {
    console.error('Upload error:', error);
    errorMessage.value = 'Ошибка при загрузке изображения';
  } finally {
    uploading.value = false;
  }
};

const cancel = () => {
  emit('cancel');
  emit('update:modelValue', false);
};
</script>
