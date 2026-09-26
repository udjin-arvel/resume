<template>
  <div class="editor-wrapper">
    <ClientOnly>
      <QuillEditor 
        ref="quillRef"
        v-model:content="content"
        content-type="html"
        theme="snow"
        :options="editorOptions"
        class="h-64"
        @update:content="onContentUpdate"
      />
      <template #fallback>
        <div class="h-64 flex items-center justify-center text-gray-400">
          Загрузка редактора...
        </div>
      </template>
    </ClientOnly>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'Начните писать...'
  }
});

const emit = defineEmits(['update:modelValue']);

const quillRef = ref(null);
const content = ref(props.modelValue);

// Следим за внешними изменениями modelValue
watch(() => props.modelValue, (newValue) => {
  if (content.value !== newValue) {
    content.value = newValue;
    // Принудительно обновляем содержимое Quill
    if (quillRef.value) {
      const quill = quillRef.value.getQuill();
      if (quill && newValue === '') {
        quill.setText('');
      }
    }
  }
});

const onContentUpdate = (value) => {
  emit('update:modelValue', value);
};

const editorOptions = computed(() => ({
  modules: {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['clean']
    ]
  },
  placeholder: props.placeholder
}));
</script>

<style>
.ql-container.ql-snow {
  border-color: #4b5563 !important;
}

.ql-editor {
  color: white;
  background-color: black;
  font-size: 16px;
  line-height: 1.6;
}

.ql-toolbar {
  background-color: #111;
  border-color: #4b5563 !important;
}

.ql-toolbar button {
  color: white;
}

.ql-toolbar button:hover {
  color: #4b5563;
}
</style>
