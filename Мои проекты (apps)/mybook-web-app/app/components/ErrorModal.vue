<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        class="md-modal-root"
        @click.self="$emit('close')"
      >
        <div class="md-modal-overlay" />

        <div class="md-modal-panel">
          <template v-if="isSuccess">
            <div class="md-modal-body-center">
              <div class="md-modal-icon bg-green-500/10">
                <Icon name="fa6-solid:circle-check" class="w-5 h-5 text-green-400/90" />
              </div>
              <h3 class="md-modal-title mb-2">Спасибо!</h3>
              <p class="md-modal-message mb-6">Ваше сообщение об ошибке отправлено</p>
              <button
                type="button"
                class="md-btn-filled"
                @click="$emit('close')"
              >
                Закрыть
              </button>
            </div>
          </template>

          <template v-else>
            <div class="md-modal-header">
              <h3 class="md-modal-title">Указать на ошибку в тексте</h3>
              <button
                type="button"
                class="md-modal-close"
                @click="$emit('close')"
              >
                <Icon name="fa6-solid:xmark" class="w-5 h-5" />
              </button>
            </div>

            <form @submit.prevent="submitForm">
              <div class="md-modal-body space-y-5">
                <p v-if="error" class="text-reder/90 text-sm">
                  {{ error }}
                </p>

                <div class="md-field">
                  <label class="md-label" for="mistake-current">Как сейчас</label>
                  <textarea
                    id="mistake-current"
                    v-model="form.currentText"
                    rows="3"
                    class="md-input resize-none"
                    placeholder="Текст с ошибкой..."
                    required
                    :disabled="isSubmitting"
                  />
                </div>

                <div class="md-field">
                  <label class="md-label" for="mistake-correct">Как правильно</label>
                  <textarea
                    id="mistake-correct"
                    v-model="form.correctText"
                    rows="3"
                    class="md-input resize-none"
                    placeholder="Правильный вариант..."
                    required
                    :disabled="isSubmitting"
                  />
                </div>
              </div>

              <div class="md-modal-footer">
                <button
                  type="button"
                  class="md-btn-text"
                  :disabled="isSubmitting"
                  @click="$emit('close')"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  class="md-btn-filled"
                  :disabled="isSubmitting"
                >
                  {{ isSubmitting ? 'Отправка...' : 'Отправить' }}
                </button>
              </div>
            </form>
          </template>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
const emit = defineEmits(['close', 'success']);
const route = useRoute();
const { api } = useApi();

const form = ref({
  currentText: '',
  correctText: ''
});

const isSubmitting = ref(false);
const isSuccess = ref(false);
const error = ref('');

const submitForm = async () => {
  if (isSubmitting.value) return;

  isSubmitting.value = true;
  error.value = '';

  try {
    await api('/mistakes', {
      method: 'POST',
      body: {
        currentText: form.value.currentText,
        correctText: form.value.correctText,
        url: route.fullPath
      }
    });

    isSuccess.value = true;
    emit('success');
  } catch (err) {
    console.error('Failed to submit mistake:', err);
    error.value = err.data?.error || 'Не удалось отправить сообщение об ошибке';
  } finally {
    isSubmitting.value = false;
  }
};
</script>
