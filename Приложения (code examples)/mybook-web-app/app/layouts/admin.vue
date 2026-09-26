<template>
  <v-app theme="thebook" class="admin-app">
    <v-navigation-drawer v-model="drawer" permanent width="260" color="surface">
      <v-list-item
        title="TheBook Admin"
        subtitle="Панель управления"
        class="pa-4 admin-brand"
      />
      <v-divider />
      <AdminNav />
      <template #append>
        <div class="pa-4">
          <v-btn
            block
            variant="tonal"
            color="primary"
            prepend-icon="mdi-arrow-left"
            to="/"
          >
            На сайт
          </v-btn>
        </div>
      </template>
    </v-navigation-drawer>

    <v-app-bar flat color="surface-bright" density="comfortable">
      <v-app-bar-title>{{ pageTitle }}</v-app-bar-title>
      <template #append>
        <span class="text-body-2 admin-user-label mr-4">
          {{ authStore.user?.login }}
          <span class="admin-user-status">({{ authStore.user?.status }})</span>
        </span>
        <v-btn icon="mdi-logout" variant="text" color="primary" @click="logout" />
      </template>
    </v-app-bar>

    <v-main>
      <v-container fluid class="pa-6">
        <slot />
      </v-container>
    </v-main>

    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="4000"
      location="bottom right"
    >
      {{ snackbar.text }}
    </v-snackbar>

    <CookieConsent />
  </v-app>
</template>

<script setup lang="ts">
const route = useRoute();
const authStore = useAuthStore();
const drawer = ref(true);

useHead({
  title: 'Админка — TheBook',
});

const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    '/admin': 'Dashboard',
    '/admin/users': 'Пользователи',
    '/admin/stories': 'Истории',
    '/admin/stories/import': 'Импорт DOCX',
    '/admin/notions': 'Понятия',
    '/admin/compositions': 'Композиции',
    '/admin/notes': 'Заметки',
    '/admin/lore': 'Лор',
    '/admin/reports': 'Обращения',
    '/admin/mistakes': 'Ошибки',
  };
  if (route.path.match(/^\/admin\/stories\/\d+$/)) return 'Редактирование истории';
  return titles[route.path] || 'Админка';
});

watch(pageTitle, (title) => {
  useHead({ title: `${title} — TheBook Admin` });
}, { immediate: true });

const snackbar = reactive({ show: false, text: '', color: 'success' });

provide('adminSnackbar', (text: string, color = 'success') => {
  snackbar.text = text;
  snackbar.color = color;
  snackbar.show = true;
});

onMounted(async () => {
  authStore.initAuth();
  if (authStore.isAuthenticated) {
    await authStore.checkAuth();
  }
});

async function logout() {
  await authStore.logout();
  navigateTo('/auth');
}
</script>

<style lang="scss">
@use '~/assets/scss/admin.scss';
</style>

<style scoped>
.admin-brand :deep(.v-list-item-title) {
  color: #ddb089;
  font-weight: 600;
  font-size: 1.1rem;
}

.admin-brand :deep(.v-list-item-subtitle) {
  color: #a8a8a8 !important;
}

.admin-user-label {
  color: #fff;
}

.admin-user-status {
  color: #a8a8a8;
}
</style>
