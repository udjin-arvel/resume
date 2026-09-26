<template>
  <div class="md-form-page">
    <header class="md-page-header">
      <div>
        <h1 class="md-page-title">Редактирование заметки</h1>
        <p class="md-page-subtitle">Измените поля и сохраните заметку</p>
      </div>
      <button
        type="button"
        class="md-link-primary shrink-0"
        :disabled="saving || loading"
        @click="saveNote"
      >
        <Icon v-if="saving" name="fa6-solid:spinner" class="w-4 h-4 animate-spin" />
        {{ saving ? 'Сохранение...' : 'Сохранить' }}
      </button>
    </header>

    <Loading :loading="loading" title="" />

    <section v-if="!loading" class="md-form-card">
      <div class="md-form-card-body space-y-5">
        <p class="md-section-title mb-0">Основное</p>

        <div class="md-field">
          <label class="md-label" for="note-title">Заголовок</label>
          <input
            id="note-title"
            v-model="note.title"
            type="text"
            class="md-input"
            placeholder="Заголовок заметки"
            required
          >
        </div>

        <div class="md-field">
          <label class="md-label" for="note-importance">Важность: {{ note.importance }}</label>
          <input
            id="note-importance"
            v-model="note.importance"
            type="range"
            min="1"
            max="10"
            step="1"
            class="md-range"
          >
        </div>

        <div class="md-checkbox-field">
          <input
            id="note-isContent"
            v-model="note.isContent"
            type="checkbox"
            class="md-checkbox"
          >
          <label for="note-isContent" class="text-sm text-white/90">Платный контент</label>
        </div>

        <div v-if="note.isContent" class="md-field">
          <label class="md-label" for="note-price">Цена (токены)</label>
          <input
            id="note-price"
            v-model="note.price"
            type="number"
            min="1"
            class="md-input"
            placeholder="10"
          >
        </div>

        <ContentFormImageField
          v-model="imagePreview"
          @file="onFileSelected"
          @remove="onFileRemoved"
          @error="showMessage('Ошибка', $event, 'warning')"
        />

        <div class="md-field">
          <label class="md-label">Содержание</label>
          <Editor
            v-model="note.text"
            placeholder="Текст заметки..."
          />
        </div>
      </div>
    </section>

    <MessageModal
      v-model="showMessageModal"
      :title="messageModalTitle"
      :message="messageModalMessage"
      :type="messageModalType"
    />
  </div>
</template>

<script setup>
const route = useRoute();
const { api, apiFormData } = useApi();
const toast = useToast();
const config = useRuntimeConfig();
const apiBase = config.public.apiBase || 'http://localhost:3001';
const noteId = Number(route.params.id);

useHead({
  title: 'Редактирование заметки - TheBook'
});

const loading = ref(true);
const saving = ref(false);
const note = ref({
  title: '',
  text: '',
  importance: 1,
  isContent: false,
  price: 10
});

const posterFile = ref(null);
const imagePreview = ref(null);
const removePoster = ref(false);

const showMessageModal = ref(false);
const messageModalTitle = ref('');
const messageModalMessage = ref('');
const messageModalType = ref('info');

const showMessage = (title, message, type = 'info') => {
  messageModalTitle.value = title;
  messageModalMessage.value = message;
  messageModalType.value = type;
  showMessageModal.value = true;
};

const onFileSelected = (file) => {
  posterFile.value = file;
  removePoster.value = false;
};

const onFileRemoved = () => {
  posterFile.value = null;
  removePoster.value = true;
};

const fetchNote = async () => {
  loading.value = true;
  try {
    const response = await api(`/notes/${noteId}`);
    if (response.success && response.data) {
      note.value = {
        title: response.data.title,
        text: response.data.text,
        importance: response.data.importance || 5,
        isContent: response.data.isContent || false,
        price: response.data.price || 10
      };

      if (response.data.poster) {
        imagePreview.value = apiBase + response.data.poster;
      }
    }
  } catch (error) {
    console.error('Error fetching note:', error);
    toast.error(getFetchErrorMessage(error, 'Не удалось загрузить заметку'));
  } finally {
    loading.value = false;
  }
};

const saveNote = async () => {
  if (!note.value.title.trim()) {
    showMessage('Ошибка', 'Заполните заголовок', 'warning');
    return;
  }
  if (!note.value.text.trim()) {
    showMessage('Ошибка', 'Заполните содержание', 'warning');
    return;
  }

  saving.value = true;
  try {
    const formData = new FormData();
    formData.append('title', note.value.title);
    formData.append('text', note.value.text.replace(/<[^>]*>/g, ''));
    formData.append('importance', note.value.importance.toString());
    formData.append('isContent', note.value.isContent.toString());
    formData.append('price', note.value.price.toString());

    if (posterFile.value) {
      formData.append('poster', posterFile.value);
    } else if (removePoster.value) {
      formData.append('removePoster', 'true');
    }

    await apiFormData(`/notes/${noteId}`, {
      method: 'PUT',
      body: formData
    });

    showMessage('Успех', 'Заметка успешно обновлена', 'success');
    setTimeout(() => navigateTo('/notes'), 1000);
  } catch (error) {
    console.error('Error saving note:', error);
    showMessage('Ошибка', error.data?.error || 'Не удалось сохранить заметку', 'error');
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  fetchNote();
});
</script>
