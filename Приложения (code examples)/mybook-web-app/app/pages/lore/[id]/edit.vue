<template>
  <div class="md-form-page">
    <header class="md-page-header">
      <div>
        <h1 class="md-page-title">Редактирование лора</h1>
        <p class="md-page-subtitle">Измените данные элемента лора</p>
      </div>
      <button
        type="button"
        class="md-link-primary shrink-0"
        :disabled="saving || loading"
        @click="saveLore"
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
          <label class="md-label" for="lore-title">Название</label>
          <input
            id="lore-title"
            v-model="lore.title"
            type="text"
            class="md-input"
            placeholder="Название"
            required
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
            v-model="lore.text"
            placeholder="Описание..."
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
const loreId = Number(route.params.id);

useHead({
  title: 'Редактирование лора - TheBook'
});

const loading = ref(true);
const saving = ref(false);
const lore = ref({
  title: '',
  text: ''
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

const fetchLore = async () => {
  loading.value = true;
  try {
    const response = await api(`/lore/${loreId}`);
    if (response.success && response.data) {
      lore.value = {
        title: response.data.title,
        text: response.data.text
      };

      if (response.data.poster) {
        imagePreview.value = apiBase + response.data.poster;
      }
    }
  } catch (error) {
    console.error('Error fetching lore:', error);
    toast.error(getFetchErrorMessage(error, 'Не удалось загрузить элемент лора'));
  } finally {
    loading.value = false;
  }
};

const saveLore = async () => {
  if (!lore.value.title.trim()) {
    showMessage('Ошибка', 'Заполните название', 'warning');
    return;
  }
  if (!lore.value.text.trim()) {
    showMessage('Ошибка', 'Заполните содержание', 'warning');
    return;
  }

  saving.value = true;
  try {
    const formData = new FormData();
    formData.append('title', lore.value.title);
    formData.append('text', lore.value.text.replace(/<[^>]*>/g, ''));

    if (posterFile.value) {
      formData.append('poster', posterFile.value);
    } else if (removePoster.value) {
      formData.append('removePoster', 'true');
    }

    await apiFormData(`/lore/${loreId}`, {
      method: 'PUT',
      body: formData
    });

    showMessage('Успех', 'Запись успешно обновлена', 'success');
    setTimeout(() => navigateTo('/lore'), 1000);
  } catch (error) {
    console.error('Error saving lore:', error);
    showMessage('Ошибка', error.data?.error || 'Не удалось сохранить запись', 'error');
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  fetchLore();
});
</script>
