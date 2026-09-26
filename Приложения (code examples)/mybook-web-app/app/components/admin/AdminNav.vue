<template>
  <v-list nav density="comfortable" class="admin-nav">
    <v-list-item
      v-for="item in visibleItems"
      :key="item.to"
      :to="item.to"
      :prepend-icon="item.icon"
      :title="item.title"
      color="primary"
      rounded="lg"
      active-class="admin-nav-active"
    />
  </v-list>
</template>

<script setup lang="ts">
const authStore = useAuthStore();

const items = [
  { to: '/admin', title: 'Dashboard', icon: 'mdi-view-dashboard', adminOnly: false },
  { to: '/admin/users', title: 'Пользователи', icon: 'mdi-account-group', adminOnly: true },
  { to: '/admin/stories', title: 'Истории', icon: 'mdi-book-open-page-variant', adminOnly: false },
  { to: '/admin/notions', title: 'Понятия', icon: 'mdi-lightbulb-on', adminOnly: false },
  { to: '/admin/compositions', title: 'Композиции', icon: 'mdi-bookshelf', adminOnly: false },
  { to: '/admin/notes', title: 'Заметки', icon: 'mdi-note-text', adminOnly: false },
  { to: '/admin/lore', title: 'Лор', icon: 'mdi-earth', adminOnly: false },
  { to: '/admin/reports', title: 'Обращения', icon: 'mdi-email', adminOnly: false },
  { to: '/admin/mistakes', title: 'Ошибки', icon: 'mdi-alert-circle', adminOnly: false },
];

const visibleItems = computed(() =>
  items.filter((item) => !item.adminOnly || authStore.isAdmin)
);
</script>

<style scoped>
.admin-nav :deep(.v-list-item) {
  margin-bottom: 2px;
}

.admin-nav :deep(.admin-nav-active) {
  color: #ddb089 !important;
}
</style>
