<template>
  <div class="md-form-page">
    <header class="md-page-header">
      <div>
        <h1 class="md-page-title">Создание записи</h1>
        <p class="md-page-subtitle">Добавьте новое понятие во вселенную</p>
      </div>
      <button
        type="button"
        class="md-link-primary shrink-0"
        :disabled="saving"
        @click="saveNotion"
      >
        <Icon v-if="saving" name="fa6-solid:spinner" class="w-4 h-4 animate-spin" />
        {{ saving ? 'Сохранение...' : 'Сохранить' }}
      </button>
    </header>

    <section class="md-form-card">
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
          @file="posterFile = $event"
          @remove="posterFile = null"
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
const { apiFormData } = useApi();

useHead({
  title: 'Создание записи - TheBook',
  meta: [
    { name: 'description', content: 'Создайте новую запись на платформе TheBook' }
  ]
});

const saving = ref(false);
const notion = ref({
  title: '',
  text: '',
  type: 'DEFINITION'
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
    }

    await apiFormData('/notions', {
      method: 'POST',
      body: formData
    });

    showMessage('Успех', 'Запись успешно создана', 'success');
    setTimeout(() => navigateTo('/notions'), 1000);
  } catch (error) {
    console.error('Error saving notion:', error);
    showMessage('Ошибка', error.data?.error || 'Не удалось создать запись', 'error');
  } finally {
    saving.value = false;
  }
};
</script>
