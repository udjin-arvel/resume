<template>
  <div class="md-form-page">
    <header class="md-page-header">
      <div>
        <h1 class="md-page-title">Редактирование записи</h1>
        <p class="md-page-subtitle">Измените данные понятия</p>
      </div>
      <button
        type="button"
        class="md-link-primary shrink-0"
        :disabled="saving || loading"
        @click="saveNotion"
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
          <label class="md-label" for="notion-title">Название</label>
          <input
            id="notion-title"
            v-model="notion.title"
            type="text"
            class="md-input"
            placeholder="Название записи"
            required
          >
        </div>

        <div class="md-field">
          <label class="md-label" for="notion-type">Тип</label>
          <select
            id="notion-type"
            v-model="notion.type"
            class="md-select"
          >
            <option value="DEFINITION">Определение</option>
            <option value="CHARACTER">Персонаж</option>
            <option value="PLACE">Место</option>
            <option value="OBJECT">Объект</option>
            <option value="ENTITY">Сущность</option>
            <option value="EVENT">Событие</option>
          </select>
        </div>

        <ContentFormImageField
          v-model="imagePreview"
          @file="onFileSelected"
          @remove="onFileRemoved"
          @error="showMessage('Ошибка', $event, 'warning')"
        />

        <div class="md-field">
          <label class="md-label">Описание</label>
          <Editor
            v-model="notion.text"
            placeholder="Описание записи..."
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
const notionId = Number(route.params.id);

useHead({
  title: 'Редактирование записи - TheBook'
});

const loading = ref(true);
const saving = ref(false);
const notion = ref({
  title: '',
  text: '',
  type: 'DEFINITION'
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

const fetchNotion = async () => {
  loading.value = true;
  try {
    const response = await api(`/notions/${notionId}`);
    if (response.success && response.data) {
      notion.value = {
        title: response.data.title,
        text: response.data.text,
        type: response.data.type
      };

      if (response.data.poster) {
        imagePreview.value = apiBase + response.data.poster;
      }
    }
  } catch (error) {
    console.error('Error fetching notion:', error);
    toast.error(getFetchErrorMessage(error, 'Не удалось загрузить понятие'));
  } finally {
    loading.value = false;
  }
};

const saveNotion = async () => {
  if (!notion.value.title.trim()) {
    showMessage('Ошибка', 'Заполните название', 'warning');
    return;
  }
  if (!notion.value.text.trim()) {
    showMessage('Ошибка', 'Заполните описание', 'warning');
    return;
  }

  saving.value = true;
  try {
    const formData = new FormData();
    formData.append('title', notion.value.title);
    formData.append('text', notion.value.text.replace(/<[^>]*>/g, ''));
    formData.append('type', notion.value.type);

    if (posterFile.value) {
      formData.append('poster', posterFile.value);
    } else if (removePoster.value) {
      formData.append('removePoster', 'true');
    }

    await apiFormData(`/notions/${notionId}`, {
      method: 'PUT',
      body: formData
    });

    showMessage('Успех', 'Запись успешно обновлена', 'success');
    setTimeout(() => navigateTo('/notions'), 1000);
  } catch (error) {
    console.error('Error saving notion:', error);
    showMessage('Ошибка', error.data?.error || 'Не удалось сохранить запись', 'error');
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  fetchNotion();
});
</script>
