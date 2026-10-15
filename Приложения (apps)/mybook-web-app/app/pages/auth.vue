<template>
  <div class="auth-page flex justify-center py-4 md:py-8">
    <div class="w-full max-w-md space-y-6">
      <header class="space-y-2 text-center">
        <img src="/logo_middle.png" alt="Logo" class="w-16 h-16 mx-auto">
        <h1 class="text-2xl md:text-3xl font-semibold text-gold/90 leading-snug">
          {{ isLogin ? 'Вход' : 'Регистрация' }}
        </h1>
        <p class="text-on-surface-muted text-sm leading-relaxed">
          {{ isLogin ? 'Войдите в свой аккаунт TheBook' : 'Создайте аккаунт и присоединяйтесь к сообществу' }}
        </p>
      </header>

      <div v-if="errorMessage" class="md-snackbar-error mb-0">
        <Icon name="fa6-solid:circle-exclamation" class="w-5 h-5 flex-shrink-0" />
        {{ errorMessage }}
      </div>

      <!-- <section class="bg-black border border-beige/40 rounded-lg overflow-hidden">
        <div class="p-4 md:p-6">
          <p class="md-section-title mb-0">
            Социальные сети
          </p>

          <div class="space-y-2 mt-4">
            <button
              type="button"
              class="auth-social-btn"
              :disabled="isLoading"
              @click="socialAuth('google')"
            >
              <Icon name="fa6-brands:google" class="w-5 h-5 text-white" />
              <span>Войти через Google</span>
            </button>

            <button
              type="button"
              class="auth-social-btn"
              :disabled="isLoading"
              @click="socialAuth('vk')"
            >
              <Icon name="fa6-brands:vk" class="w-5 h-5 text-[#0077FF]" />
              <span>Войти через VK</span>
            </button>

            <button
              type="button"
              class="auth-social-btn"
              :disabled="isLoading"
              @click="socialAuth('telegram')"
            >
              <Icon name="fa6-brands:telegram" class="w-5 h-5 text-[#26A5E4]" />
              <span>Войти через Telegram</span>
            </button>
          </div>
        </div>
      </section> -->

      <form
        class="bg-black border border-beige/40 rounded-lg overflow-hidden"
        @submit.prevent="submitForm"
      >
        <div class="p-4 md:p-6">
          <p class="md-section-title mb-0">
            {{ isLogin ? 'Данные для входа' : 'Данные для регистрации' }}
          </p>

          <div class="space-y-5 mt-4">
            <div v-if="!isLogin" class="md-field">
              <label class="md-label" for="auth-login">Логин</label>
              <input
                id="auth-login"
                v-model="form.login"
                type="text"
                class="md-input"
                required
              >
            </div>

            <div v-if="!isLogin" class="md-field">
              <label class="md-label" for="auth-email">Email</label>
              <input
                id="auth-email"
                v-model="form.email"
                type="email"
                class="md-input"
                required
              >
            </div>

            <div v-if="isLogin" class="md-field">
              <label class="md-label" for="auth-login-or-email">Логин или Email</label>
              <input
                id="auth-login-or-email"
                v-model="form.loginOrEmail"
                type="text"
                class="md-input"
                placeholder="Введите логин или email"
                required
              >
            </div>

            <div class="md-field">
              <label class="md-label" for="auth-password">Пароль</label>
              <input
                id="auth-password"
                v-model="form.password"
                type="password"
                class="md-input"
                required
              >
            </div>

            <div v-if="!isLogin" class="md-field">
              <label class="md-label" for="auth-confirm-password">Подтвердите пароль</label>
              <input
                id="auth-confirm-password"
                v-model="form.confirmPassword"
                type="password"
                class="md-input"
                required
              >
            </div>

            <div v-if="!isLogin" class="md-field">
              <label class="md-label">Капча</label>

              <input
                id="auth-captcha"
                v-model="captchaInput"
                type="text"
                class="md-input mt-2"
                placeholder="Введите капчу"
                autocomplete="off"
              >

              <div class="mt-3">
                <VueClientRecaptcha
                  ref="captchaRef"
                  v-model="captchaInput"
                  v-model:valid="captchaValid"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="flex flex-col gap-3 px-4 md:px-6 py-4 mb-4 border-t border-white/5">
          <button
            type="submit"
            class="md-btn-filled justify-center w-full"
            :disabled="isLoading || (!isLogin && !captchaValid)"
          >
            <Icon v-if="isLoading" name="fa6-solid:spinner" class="w-4 h-4 animate-spin" />
            {{ isLoading ? 'Загрузка...' : (isLogin ? 'Войти' : 'Зарегистрироваться') }}
          </button>
        </div>
      </form>

      <div class="text-center">
        <button
          type="button"
          class="md-btn-text"
          @click="toggleMode"
        >
          {{ isLogin ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти' }}
        </button>
      </div>

      <p class="text-xs text-center text-on-surface-muted leading-relaxed px-2">
        При входе или регистрации устанавливается HttpOnly cookie сессии. Без неё авторизация невозможна.
      </p>
    </div>
  </div>
</template>

<script setup>
import { getFetchErrorMessage } from '~/utils/fetchError';
import { VueClientRecaptcha } from 'vue-client-recaptcha';

const config = useRuntimeConfig();
const authStore = useAuthStore();

// SEO
useHead({
  title: 'Авторизация - TheBook',
  meta: [
    { name: 'description', content: 'Войдите в аккаунт или зарегистрируйтесь на платформе TheBook' }
  ]
});

const isLogin = ref(true);
const isLoading = ref(false);
const errorMessage = ref('');

const isDev = config.public.isDev;
const form = ref({
  login: '',
  email: '',
  loginOrEmail: isDev ? 'admin@thebook.com' : '',
  password: isDev ? 'admin123' : '',
  confirmPassword: ''
});

const captchaInput = ref('');
const captchaValid = ref(false);
const captchaRef = ref(null);

const toggleMode = () => {
  isLogin.value = !isLogin.value;
  errorMessage.value = '';
  form.value.password = '';
  form.value.confirmPassword = '';

  captchaInput.value = '';
  captchaValid.value = false;

  captchaRef.value?.resetCaptcha?.();
};

const isValidEmail = (str) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(str);
};

const socialAuth = async (provider) => {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const baseUrl = config.public.apiBase || 'http://localhost:3001';
    window.location.href = `${baseUrl}/api/auth/${provider}`;
  } catch (error) {
    console.error('Social auth error:', error);
    errorMessage.value = 'Ошибка авторизации через социальную сеть';
  } finally {
    isLoading.value = false;
  }
};

const submitForm = async () => {
  if (!isLogin.value && form.value.password !== form.value.confirmPassword) {
    errorMessage.value = 'Пароли не совпадают';
    return;
  }

  if (!isLogin.value && !captchaValid.value) {
    errorMessage.value = 'Пожалуйста, подтвердите капчу';
    return;
  }

  isLoading.value = true;
  errorMessage.value = '';

  try {
    let result;

    if (isLogin.value) {
      const loginValue = form.value.loginOrEmail;
      const credentials = isValidEmail(loginValue)
        ? { email: loginValue, password: form.value.password }
        : { login: loginValue, password: form.value.password };

      result = await authStore.login(credentials);
    } else {
      result = await authStore.register({
        login: form.value.login,
        email: form.value.email,
        password: form.value.password
      });
    }

    if (result.success) {
      await navigateTo('/');
    } else {
      errorMessage.value = typeof result.error === 'string' ? result.error : 'Произошла ошибка';
    }
  } catch (error) {
    console.error('Auth error:', error);
    errorMessage.value = getFetchErrorMessage(error, 'Ошибка авторизации');
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.auth-social-btn {
  @apply w-full flex items-center justify-center gap-3 px-4 py-3 bg-surface-muted border border-white/10 rounded-xl text-sm text-white;
  @apply transition-colors duration-200 hover:border-beige/30 focus:outline-none;
  @apply disabled:opacity-50 disabled:pointer-events-none;
}
</style>
