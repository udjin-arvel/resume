<template>
  <Transition name="cookie-banner">
    <div
      v-if="visible"
      class="cookie-consent"
      role="dialog"
      aria-label="Уведомление о cookies"
    >
      <div class="cookie-consent__inner">
        <p class="cookie-consent__text">
          Сайт использует обязательные http-only Cookie для сессии авторизации.
          Без неё вход в аккаунт невозможен. Настройки шрифта сохраняются локально в браузере.
        </p>
        <div class="cookie-consent__actions">
          <NuxtLink to="/contact" class="md-btn-text text-sm py-2 px-4">
            Подробнее
          </NuxtLink>
          <button type="button" class="md-btn-filled text-sm py-2 px-5" @click="accept">
            Понятно
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
const CONSENT_KEY = 'cookie_consent';

const visible = ref(false);

onMounted(() => {
  if (import.meta.client && localStorage.getItem(CONSENT_KEY) !== '1') {
    visible.value = true;
  }
});

function accept() {
  localStorage.setItem(CONSENT_KEY, '1');
  visible.value = false;
}
</script>

<style scoped>
.cookie-consent {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  padding: 1rem;
  pointer-events: none;
}

.cookie-consent__inner {
  pointer-events: auto;
  max-width: 56rem;
  margin: 0 auto;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: rgba(26, 26, 26, 0.97);
  border: 1px solid rgba(221, 176, 137, 0.35);
  border-radius: 1rem;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
}

.cookie-consent__text {
  flex: 1;
  min-width: 200px;
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.85);
}

.cookie-consent__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

.cookie-banner-enter-active,
.cookie-banner-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.cookie-banner-enter-from,
.cookie-banner-leave-to {
  opacity: 0;
  transform: translateY(1rem);
}
</style>
