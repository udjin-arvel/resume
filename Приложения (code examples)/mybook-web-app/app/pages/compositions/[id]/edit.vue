<template>
  <div class="md-form-page">
    <header class="md-page-header">
      <div>
        <h1 class="md-page-title">Редактирование композиции</h1>
        <p class="md-page-subtitle">Измените данные композиции</p>
      </div>
      <button
        type="button"
        class="md-link-primary shrink-0"
        :disabled="saving || loading"
        @click="saveComposition"
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
          <label class="md-label" for="composition-title">Название</label>
          <input
            id="composition-title"
            v-model="composition.title"
            type="text"
            class="md-input"
            placeholder="Название композиции"
            required
          >
        </div>

        <div class="md-field">
          <label class="md-label" for="composition-type">Тип</label>
          <select
            id="composition-type"
            v-model="composition.type"
            class="md-select"
          >
            <option value="BOOK">Книга</option>
            <option value="CHAPTER_COLLECTION">Сборник глав</option>
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
            v-model="composition.description"
            placeholder="Описание композиции (необязательно)"
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
const compositionId = Number(route.params.id);

useHead({
  title: 'Редактирование композиции - TheBook'
});

const loading = ref(true);
const saving = ref(false);
const composition = ref({
  title: '',
  description: '',
  type: 'BOOK'
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

const fetchComposition = async () => {
  loading.value = true;
  try {
    const response = await api(`/compositions/${compositionId}`);
    if (response.success && response.data) {
      composition.value = {
        title: response.data.title,
        description: response.data.description || '',
        type: response.data.type || 'BOOK'
      };

      if (response.data.poster) {
        imagePreview.value = apiBase + response.data.poster;
      }
    }
  } catch (error) {
    console.error('Error fetching composition:', error);
    toast.error(getFetchErrorMessage(error, 'Не удалось загрузить композицию'));
  } finally {
    loading.value = false;
  }
};

const saveComposition = async () => {
  if (!composition.value.title.trim()) {
    showMessage('Ошибка', 'Заполните название', 'warning');
    return;
  }

  saving.value = true;
  try {
    const formData = new FormData();
    formData.append('title', composition.value.title);
    formData.append('description', composition.value.description ? composition.value.description.replace(/<[^>]*>/g, '') : '');
    formData.append('type', composition.value.type);

    if (posterFile.value) {
      formData.append('poster', posterFile.value);
    } else if (removePoster.value) {
      formData.append('removePoster', 'true');
    }

    await apiFormData(`/compositions/${compositionId}`, {
      method: 'PUT',
      body: formData
    });

    showMessage('Успех', 'Композиция успешно обновлена', 'success');
    setTimeout(() => navigateTo('/compositions'), 1000);
  } catch (error) {
    console.error('Error saving composition:', error);
    showMessage('Ошибка', error.data?.error || 'Не удалось сохранить композицию', 'error');
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  fetchComposition();
});
</script>
