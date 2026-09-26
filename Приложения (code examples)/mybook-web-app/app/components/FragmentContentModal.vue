<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="md-modal-root"
        @click.self="close"
      >
        <div class="md-modal-overlay" />

        <div class="md-modal-panel md-modal-panel-lg mx-4">
          <div class="md-modal-header">
            <h2 class="md-modal-title">Добавить контент к фрагменту</h2>
            <button
              type="button"
              class="md-modal-close"
              @click="close"
            >
              <Icon name="fa6-solid:xmark" class="w-5 h-5" />
            </button>
          </div>

          <div class="md-modal-body space-y-5">
            <div class="md-field">
              <label class="md-label">Файл (изображение или аудио)</label>
              <div
                class="md-modal-dropzone"
                :class="{ 'md-modal-dropzone-active': dragOver || selectedFile }"
                @click="triggerFileInput"
                @dragover.prevent="dragOver = true"
                @dragleave="dragOver = false"
                @drop.prevent="handleDrop"
              >
                <input
                  ref="fileInput"
                  type="file"
                  accept="image/*,audio/*"
                  class="hidden"
                  @change="handleFileSelect"
                >

                <div v-if="!selectedFile" class="text-on-surface-muted text-sm">
                  <p class="mb-1 text-white/80">Перетащите файл сюда или нажмите для выбора</p>
                  <p class="text-xs">Изображение (JPG, PNG, GIF) или аудио (MP3, WAV)</p>
                </div>

                <div v-else class="text-beige/90">
                  <p class="font-medium text-sm">{{ selectedFile.name }}</p>
                  <p class="text-xs text-on-surface-muted mt-1">{{ formatFileSize(selectedFile.size) }}</p>
                  <button
                    type="button"
                    class="mt-2 text-reder/90 hover:text-red text-sm transition-colors focus:outline-none"
                    @click.stop="removeFile"
                  >
                    Удалить файл
                  </button>
                </div>
              </div>
            </div>

            <div class="md-field">
              <label class="md-label" for="fragment-author-note">Примечание автора</label>
              <textarea
                id="fragment-author-note"
                v-model="authorNote"
                class="md-input resize-none"
                rows="4"
                placeholder="Добавьте примечание к этому фрагменту (необязательно)"
              />
            </div>
          </div>

          <div class="md-modal-footer">
            <button
              type="button"
              class="md-btn-text"
              @click="close"
            >
              Отмена
            </button>
            <button
              type="button"
              class="md-btn-filled"
              :disabled="!hasContent"
              @click="save"
            >
              Сохранить
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
  fragmentIndex: {
    type: Number,
    default: -1
  },
  initialAuthorNote: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update:modelValue', 'save']);

const fileInput = ref(null);
const selectedFile = ref(null);
const authorNote = ref('');
const dragOver = ref(false);

const hasContent = computed(() => {
  return selectedFile.value || authorNote.value.trim();
});

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileSelect = (event) => {
  const file = event.target.files[0];
  if (file && isValidFile(file)) {
    selectedFile.value = file;
  }
};

const handleDrop = (event) => {
  dragOver.value = false;
  const file = event.dataTransfer.files[0];
  if (file && isValidFile(file)) {
    selectedFile.value = file;
  }
};

const isValidFile = (file) => {
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'audio/mpeg', 'audio/wav', 'audio/ogg'];
  return validTypes.includes(file.type);
};

const removeFile = () => {
  selectedFile.value = null;
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const close = () => {
  emit('update:modelValue', false);
  resetForm();
};

const resetForm = () => {
  selectedFile.value = null;
  authorNote.value = '';
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    authorNote.value = props.initialAuthorNote || '';
    selectedFile.value = null;
    if (fileInput.value) {
      fileInput.value.value = '';
    }
  }
});

const save = () => {
  if (!hasContent.value) return;

  emit('save', {
    fragmentIndex: props.fragmentIndex,
    file: selectedFile.value,
    authorNote: authorNote.value.trim()
  });

  close();
};
</script>
