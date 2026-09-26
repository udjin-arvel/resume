<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        class="md-modal-root"
        @click.self="$emit('close')"
      >
        <div class="md-modal-overlay" />

        <div class="md-modal-panel">
          <div class="md-modal-header">
            <h3 class="md-modal-title">Написать автору проекта</h3>
            <button
              type="button"
              class="md-modal-close"
              @click="$emit('close')"
            >
              <Icon name="fa6-solid:xmark" class="w-5 h-5" />
            </button>
          </div>

          <div v-if="submitted" class="md-modal-body-center">
            <div class="md-modal-icon bg-green-500/10">
              <Icon name="fa6-solid:circle-check" class="w-5 h-5 text-green-400/90" />
            </div>
            <p class="md-modal-title mb-1">Сообщение отправлено</p>
            <p class="md-modal-message mb-6">Спасибо за обратную связь</p>
            <button
              type="button"
              class="md-btn-filled"
              @click="$emit('close')"
            >
              Закрыть
            </button>
          </div>

          <form v-else @submit.prevent="submitForm">
            <div class="md-modal-body space-y-5">
              <div class="md-field">
                <label class="md-label" for="contact-subject">Тема</label>
                <input
                  id="contact-subject"
                  v-model="form.subject"
                  type="text"
                  class="md-input"
                  placeholder="Тема сообщения"
                  required
                >
              </div>

              <div class="md-field">
                <label class="md-label" for="contact-message">Сообщение</label>
                <textarea
                  id="contact-message"
                  v-model="form.message"
                  rows="5"
                  class="md-input resize-none"
                  placeholder="Текст сообщения..."
                  required
                />
              </div>

              <p v-if="error" class="text-reder/90 text-sm">
                {{ error }}
              </p>
            </div>

            <div class="md-modal-footer">
              <button
                type="button"
                class="md-btn-text"
                :disabled="sending"
                @click="$emit('close')"
              >
                Отмена
              </button>
              <button
                type="submit"
                class="md-btn-filled"
                :disabled="sending"
              >
                {{ sending ? 'Отправка...' : 'Отправить' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
const { api } = useApi();
defineEmits(['close']);

const form = ref({
  subject: '',
  message: ''
});

const sending = ref(false);
const submitted = ref(false);
const error = ref('');

const submitForm = async () => {
  if (!form.value.subject.trim()) {
    error.value = 'Заполните тему сообщения';
    return;
  }
  if (!form.value.message.trim()) {
    error.value = 'Заполните текст сообщения';
    return;
  }

  sending.value = true;
  error.value = '';

  try {
    await api('/reports', {
      method: 'POST',
      body: {
        subject: form.value.subject.trim(),
        message: form.value.message.trim()
      }
    });

    submitted.value = true;
  } catch (err) {
    console.error('Error sending report:', err);
    error.value = err.data?.error || 'Не удалось отправить сообщение';
  } finally {
    sending.value = false;
  }
};
</script>
