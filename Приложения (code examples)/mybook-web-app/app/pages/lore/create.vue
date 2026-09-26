<template>
  <div class="md-form-page">
    <header class="md-page-header">
      <div>
        <h1 class="md-page-title">Создание элемента лора</h1>
        <p class="md-page-subtitle">Добавьте новый элемент во вселенную</p>
      </div>
      <button
        type="button"
        class="md-link-primary shrink-0"
        :disabled="saving"
        @click="saveLore"
      >
        <Icon v-if="saving" name="fa6-solid:spinner" class="w-4 h-4 animate-spin" />
        {{ saving ? 'Сохранение...' : 'Сохранить' }}
      </button>
    </header>

    <section class="md-form-card">
      <div class="md-form-card-body space-y-5">
        <p class="md-section-title mb-0">Основное</p>

        <div class="md-field">
          <label class="md-label" for="lore-title">Название</label>
          <input
            id="lore-title"
            v-model="lore.title"
            type="text"
            class="md-input"
            placeholder="Название элемента лора"
            required
          >
        </div>

        <ContentFormImageField
          v-model="imagePreview"
          @file="posterFile = $event"
          @remove="posterFile = null"
          @error="showMessage('Ошибка', $event, 'warning')"
        />

        <div class="md-field">
          <label class="md-label">Содержание</label>
          <Editor
            v-model="lore.text"
            placeholder="Описание элемента лора..."
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
  title: 'Создание элемента лора - TheBook',
  meta: [
    { name: 'description', content: 'Создайте новый элемент лора на платформе TheBook' }
  ]
});

const saving = ref(false);
const lore = ref({
  title: '',
  text: ''
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
    }

    await apiFormData('/lore', {
      method: 'POST',
      body: formData
    });

    showMessage('Успех', 'Элемент лора успешно создан', 'success');
    setTimeout(() => navigateTo('/lore'), 1000);
  } catch (error) {
    console.error('Error saving lore:', error);
    showMessage('Ошибка', error.data?.error || 'Не удалось создать элемент лора', 'error');
  } finally {
    saving.value = false;
  }
};
</script>
