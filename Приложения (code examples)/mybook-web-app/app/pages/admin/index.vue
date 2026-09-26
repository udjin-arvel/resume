<template>
  <div>
    <v-row>
      <v-col
        v-for="stat in stats"
        :key="stat.key"
        cols="12"
        sm="6"
        md="3"
      >
        <v-card :to="stat.to" hover class="admin-stat-card">
          <v-card-text>
            <div class="admin-stat-label">{{ stat.label }}</div>
            <div class="admin-stat-value">{{ counts[stat.key] ?? '—' }}</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mt-4">
      <v-col cols="12" md="6">
        <v-card title="Быстрые действия">
          <v-card-text class="d-flex flex-wrap ga-2">
            <v-btn color="primary" class="text-white" prepend-icon="mdi-file-upload" to="/admin/stories/import">
              Импорт DOCX
            </v-btn>
            <v-btn variant="tonal" color="primary" prepend-icon="mdi-book-plus" to="/admin/stories">
              Истории
            </v-btn>
            <v-btn v-if="authStore.isAdmin" variant="tonal" color="secondary" prepend-icon="mdi-account-plus" to="/admin/users">
              Пользователи
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin'] });

const { adminApi } = useAdminApi();
const authStore = useAuthStore();

const counts = ref<Record<string, number>>({});

const stats = [
  { key: 'users', label: 'Пользователи', to: '/admin/users' },
  { key: 'stories', label: 'Истории', to: '/admin/stories' },
  { key: 'notions', label: 'Понятия', to: '/admin/notions' },
  { key: 'compositions', label: 'Композиции', to: '/admin/compositions' },
  { key: 'notes', label: 'Заметки', to: '/admin/notes' },
  { key: 'loreItems', label: 'Лор', to: '/admin/lore' },
  { key: 'reports', label: 'Обращения', to: '/admin/reports' },
  { key: 'mistakes', label: 'Ошибки', to: '/admin/mistakes' },
];

onMounted(async () => {
  try {
    const res = await adminApi<{ success: boolean; data: Record<string, number> }>('/dashboard');
    if (res.success) counts.value = res.data;
  } catch (e) {
    console.error(e);
  }
});
</script>

<style scoped>
.admin-stat-label {
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #a8a8a8;
  margin-bottom: 0.5rem;
}

.admin-stat-value {
  font-size: 2rem;
  font-weight: 600;
  color: #e78c3d;
}

.admin-stat-card:hover {
  border-color: rgba(221, 176, 137, 0.25) !important;
}
</style>
