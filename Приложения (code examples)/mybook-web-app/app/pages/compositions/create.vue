<template>
  <div class="md-form-page">
    <header class="md-page-header">
      <div>
        <h1 class="md-page-title">Создание композиции</h1>
        <p class="md-page-subtitle">Создайте книгу или сборник глав</p>
      </div>
      <button
        type="button"
        class="md-link-primary shrink-0"
        :disabled="saving"
        @click="saveComposition"
      >
        <Icon v-if="saving" name="fa6-solid:spinner" class="w-4 h-4 animate-spin" />
        {{ saving ? 'Сохранение...' : 'Сохранить' }}
      </button>
    </header>

    <section class="md-form-card">
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
          @file="posterFile = $event"
          @remove="posterFile = null"
          @error="showMessage('Ошибка', $event, 'warning')"
        />

        <div class="md-field">
          <label class="md-label">Описание</label>
          <Editor
            v-model="composition.description"
            placeholder="Описание композиции (необязательно)..."
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
const { apiFormData } = useApi();

useHead({
  title: 'Создание композиции - TheBook',
  meta: [
    { name: 'description', content: 'Создайте новую композицию на платформе TheBook' }
  ]
});

const saving = ref(false);
const composition = ref({
  title: '',
  description: '',
  type: 'BOOK'
});

const posterFile = ref(null);
const imagePreview = ref(null);

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

const saveComposition = async () => {
  if (!composition.value.title.trim()) {
    showMessage('Ошибка', 'Заполните название', 'warning');
    return;
  }

  saving.value = true;
  try {
    const formData = new FormData();
    formData.append('title', composition.value.title);
    formData.append('type', composition.value.type);

    if (composition.value.description) {
      formData.append('description', composition.value.description.replace(/<[^>]*>/g, ''));
    }

    if (posterFile.value) {
      formData.append('poster', posterFile.value);
    }

    await apiFormData('/compositions', {
      method: 'POST',
      body: formData
    });

    showMessage('Успех', 'Композиция успешно создана', 'success');
    setTimeout(() => navigateTo('/compositions'), 1000);
  } catch (error) {
    console.error('Error saving composition:', error);
    showMessage('Ошибка', error.data?.error || 'Не удалось создать композицию', 'error');
  } finally {
    saving.value = false;
  }
};
</script>
