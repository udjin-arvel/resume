<template>
  <div class="profile-page space-y-6 md:space-y-8">
    <header class="space-y-2">
      <h1 class="text-2xl md:text-3xl font-semibold text-gold/90 leading-snug">
        Профиль
      </h1>
      <p class="text-on-surface-muted text-sm md:text-base leading-relaxed">
        Личные данные, статистика и достижения.
      </p>
    </header>

    <div v-if="successMessage" class="md-snackbar-success mb-0">
      <Icon name="fa6-solid:circle-check" class="w-5 h-5 flex-shrink-0" />
      {{ successMessage }}
    </div>

    <div v-if="errorMessage" class="md-snackbar-error mb-0">
      <Icon name="fa6-solid:circle-exclamation" class="w-5 h-5 flex-shrink-0" />
      {{ errorMessage }}
    </div>

    <!-- Avatar header -->
    <section class="bg-black border border-beige/40 rounded-lg p-4 md:p-6">
      <div class="flex flex-col items-center gap-5 sm:flex-row sm:items-start sm:gap-6">
        <div class="relative flex-shrink-0">
          <button
            type="button"
            class="w-24 h-24 md:w-28 md:h-28 rounded-full bg-surface-muted border-2 border-beige/30 flex items-center justify-center overflow-hidden hover:border-beige/60 transition-colors focus:outline-none"
            @click="triggerFileInput"
          >
            <img
              :src="avatarUrl"
              alt="Avatar"
              class="w-full h-full object-cover"
            >
          </button>
          <button
            type="button"
            class="md-icon-button absolute bottom-0 right-0 w-9 h-9 bg-beige text-black hover:bg-beige/80"
            @click="triggerFileInput"
          >
            <Icon name="fa6-solid:camera" class="w-4 h-4" />
          </button>
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            class="hidden"
            @change="handleAvatarChange"
          >
        </div>

        <div class="flex-1 min-w-0 text-center sm:text-left w-full">
          <p class="text-lg md:text-xl font-semibold text-gold/90 truncate">
            {{ user.login || 'Пользователь' }}
          </p>
          <p class="text-on-surface-muted text-sm mt-1">
            {{ statusLabel }}
          </p>
          <button
            type="button"
            class="mt-3 text-sm text-beige hover:text-white transition-colors focus:outline-none"
            @click="triggerFileInput"
          >
            Изменить аватар
          </button>
        </div>

        <div class="grid grid-cols-2 gap-3 w-full sm:w-auto sm:shrink-0 sm:ml-auto">
          <div class="bg-black border border-beige/40 rounded-lg p-3 md:p-4 text-center min-w-0">
            <div class="text-lg md:text-xl font-bold text-gold/90">
              {{ user.level }}
            </div>
            <div class="text-on-surface-muted text-xs mt-0.5">
              Уровень
            </div>
          </div>
          <div class="bg-black border border-beige/40 rounded-lg p-3 md:p-4 text-center min-w-0">
            <div class="text-lg md:text-xl font-bold text-gold/90">
              {{ user.tokens }}
            </div>
            <div class="text-on-surface-muted text-xs mt-0.5">
              Токены
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Editable form -->
    <form
      class="bg-black border border-beige/40 rounded-lg overflow-hidden"
      @submit.prevent="saveProfile"
    >
      <div class="p-4 md:p-6">
        <p class="md-section-title mb-0">
          Личные данные
        </p>

        <div class="space-y-5 mt-4">
          <div class="md-field">
            <label class="md-label" for="profile-login">Логин</label>
            <input
              id="profile-login"
              v-model="user.login"
              type="text"
              class="md-input"
              required
            >
          </div>

          <div class="md-field">
            <label class="md-label" for="profile-info">О себе</label>
            <textarea
              id="profile-info"
              v-model="user.info"
              rows="4"
              class="md-input resize-none"
              placeholder="Расскажите о себе..."
            />
          </div>
        </div>
      </div>

      <div class="flex flex-col sm:flex-row gap-3 px-4 md:px-6 py-4 border-t border-white/5">
        <button
          type="submit"
          class="md-btn-filled justify-center sm:max-w-[200px]"
          :disabled="isLoading"
        >
          <Icon v-if="isLoading" name="fa6-solid:spinner" class="w-4 h-4 animate-spin" />
          {{ isLoading ? 'Сохранение...' : 'Сохранить' }}
        </button>
        <button
          type="button"
          class="md-btn-text justify-center sm:max-w-[200px]"
          @click="resetForm"
        >
          Сбросить
        </button>
      </div>
    </form>

    <!-- Read-only account info -->
    <section class="bg-black border border-beige/40 rounded-lg p-4 md:p-6">
      <p class="md-section-title mb-0">
        Аккаунт
      </p>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-4">
        <div class="md-field">
          <label class="md-label" for="profile-email">Email</label>
          <input
            id="profile-email"
            v-model="user.email"
            type="email"
            class="md-input md-input-readonly"
            readonly
          >
        </div>

        <div class="md-field">
          <label class="md-label" for="profile-status">Статус</label>
          <select
            id="profile-status"
            v-model="user.status"
            class="md-select md-input-readonly"
            disabled
          >
            <option value="READER">Читатель</option>
            <option value="WRITER">Писатель</option>
            <option value="MODERATOR">Модератор</option>
            <option value="ADMIN">Администратор</option>
          </select>
        </div>

        <div class="md-field">
          <label class="md-label" for="profile-experience">Опыт</label>
          <input
            id="profile-experience"
            :value="user.experience"
            type="number"
            class="md-input md-input-readonly"
            readonly
          >
        </div>

        <div class="md-field">
          <label class="md-label" for="profile-level">Уровень</label>
          <input
            id="profile-level"
            :value="user.level"
            type="number"
            class="md-input md-input-readonly"
            readonly
          >
        </div>
      </div>
    </section>

    <!-- Stats -->
    <section class="bg-black border border-beige/40 rounded-lg p-4 md:p-6">
      <p class="md-section-title mb-0">
        Статистика
      </p>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-4">
        <div
          v-for="item in statItems"
          :key="item.label"
          class="border border-beige/40 rounded-lg p-3 md:p-4 text-center"
        >
          <div class="text-xl md:text-2xl font-bold text-gold/90">
            {{ item.value }}
          </div>
          <div class="text-on-surface-muted text-xs md:text-sm mt-1">
            {{ item.label }}
          </div>
        </div>
      </div>
    </section>

    <!-- Achievements -->
    <section class="bg-black border border-beige/40 rounded-lg p-4 md:p-6">
      <p class="md-section-title mb-0">
        Достижения
      </p>

      <div
        v-if="achievements.length === 0"
        class="text-on-surface-muted text-sm text-center py-8 mt-4 border border-dashed border-white/10 rounded-lg"
      >
        Пока нет достижений
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mt-4">
        <article
          v-for="achievement in achievements"
          :key="achievement.id"
          class="flex items-start gap-3 md:gap-4 p-4 rounded-lg border border-beige/40"
        >
          <div class="w-10 h-10 rounded-full bg-beige/15 flex items-center justify-center flex-shrink-0">
            <Icon name="fa6-solid:trophy" class="w-5 h-5 text-beige/90" />
          </div>
          <div class="min-w-0">
            <h3 class="text-gold/90 font-medium text-sm md:text-base">
              {{ achievement.title }}
            </h3>
            <p class="text-on-surface-muted text-sm mt-0.5 leading-relaxed">
              {{ achievement.description }}
            </p>
            <p class="text-on-surface-muted/70 text-xs mt-2">
              {{ formatDate(achievement.createdAt) }}
            </p>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup>
import { getFetchErrorMessage } from '~/utils/fetchError';

definePageMeta({
  middleware: 'auth',
  requiresAuth: true,
});

const authStore = useAuthStore();
const { api, apiFormData } = useApi();
const { avatarUrl } = useAuthAvatarUrl();

useHead({
  title: 'Профиль - TheBook',
  meta: [
    { name: 'description', content: 'Управление профилем пользователя на платформе TheBook' }
  ]
});

const STATUS_LABELS = {
  READER: 'Читатель',
  WRITER: 'Писатель',
  MODERATOR: 'Модератор',
  ADMIN: 'Администратор',
};

const fileInput = ref(null);
const isLoading = ref(false);
const originalUser = ref(null);
const errorMessage = ref('');
const successMessage = ref('');

const user = ref({
  login: '',
  email: '',
  status: 'READER',
  level: 1,
  experience: 0,
  tokens: 0,
  info: '',
  avatar: null
});

const stats = ref({
  stories: 0,
  comments: 0,
  achievements: 0,
  corrections: 0
});

const achievements = ref([]);

const statusLabel = computed(() => STATUS_LABELS[user.value.status] || user.value.status);

const statItems = computed(() => [
  { label: 'Историй', value: stats.value.stories },
  { label: 'Комментариев', value: stats.value.comments },
  { label: 'Достижений', value: stats.value.achievements },
  { label: 'Исправлений', value: stats.value.corrections }
]);

const syncUserFromStore = () => {
  if (!authStore.user) return;

  user.value = {
    login: authStore.user.login || '',
    email: authStore.user.email || '',
    status: authStore.user.status || 'READER',
    level: authStore.user.level || 1,
    experience: authStore.user.experience || 0,
    tokens: authStore.user.tokens || 0,
    info: authStore.user.info || '',
    avatar: authStore.user.avatar || null,
  };
  originalUser.value = { ...user.value };
};

const loadUserData = async () => {
  const ok = await authStore.checkAuth();
  if (!ok) {
    await navigateTo('/auth');
    return;
  }

  syncUserFromStore();
  await loadUserStats();
  await loadAchievements();
};

const loadUserStats = async () => {
  try {
    const response = await api('/auth/stats');
    if (response.success && response.data) {
      stats.value = {
        stories: response.data.stories || 0,
        comments: response.data.comments || 0,
        achievements: response.data.achievements || 0,
        corrections: response.data.corrections || 0
      };
    }
  } catch (error) {
    console.error('Error loading stats:', error);
  }
};

const loadAchievements = async () => {
  try {
    const response = await api('/auth/achievements');
    if (response.success && response.data) {
      achievements.value = response.data;
    }
  } catch (error) {
    console.error('Error loading achievements:', error);
  }
};

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleAvatarChange = async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  errorMessage.value = '';
  successMessage.value = '';

  try {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await apiFormData('/auth/avatar', { method: 'POST', body: formData });

    if (response.success && response.data) {
      authStore.applyAvatarFromUpload(response.data);
      syncUserFromStore();
      originalUser.value = { ...user.value };
      successMessage.value = 'Аватар успешно обновлён';
      setTimeout(() => { successMessage.value = ''; }, 3000);
    }
  } catch (error) {
    console.error('Error uploading avatar:', error);
    errorMessage.value = getFetchErrorMessage(error, 'Не удалось загрузить аватар');
  } finally {
    if (fileInput.value) {
      fileInput.value.value = '';
    }
  }
};

const saveProfile = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  try {
    const result = await authStore.updateProfile({
      login: user.value.login,
      info: user.value.info
    });

    if (result.success) {
      originalUser.value = { ...user.value };
      successMessage.value = 'Профиль успешно сохранён';
      setTimeout(() => successMessage.value = '', 3000);
    } else {
      errorMessage.value = result.error || 'Не удалось сохранить профиль';
    }
  } catch (error) {
    console.error('Save error:', error);
    errorMessage.value = error.data?.error || 'Ошибка сохранения профиля';
  } finally {
    isLoading.value = false;
  }
};

const resetForm = () => {
  if (originalUser.value) {
    user.value = { ...originalUser.value };
  }
  errorMessage.value = '';
  successMessage.value = '';
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('ru-RU');
};

onMounted(() => {
  loadUserData();
});
</script>
