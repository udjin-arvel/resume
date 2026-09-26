<template>
  <div>
    <v-card>
      <v-card-title>Обращения</v-card-title>
      <v-data-table-server
        :headers="headers"
        :items="items"
        :items-length="total"
        :loading="loading"
        :items-per-page="limit"
        @update:options="onOptionsUpdate"
      >
        <template #item.user="{ item }">{{ item.user?.login || 'Аноним' }}</template>
        <template #item.createdAt="{ item }">{{ formatDate(item.createdAt) }}</template>
        <template #item.actions="{ item }">
          <v-btn icon="mdi-delete" size="small" variant="text" color="error" @click="confirmDelete(item)" />
        </template>
        <template #expanded-row="{ columns, item }">
          <tr><td :colspan="columns.length"><strong>Сообщение:</strong> {{ item.message }}</td></tr>
        </template>
      </v-data-table-server>
    </v-card>

    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card title="Удалить обращение?">
        <v-card-actions><v-spacer /><v-btn variant="text" @click="deleteDialog = false">Отмена</v-btn><v-btn color="error" :loading="deleting" @click="deleteItem">Удалить</v-btn></v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin'] });

const { adminApi } = useAdminApi();
const snackbar = inject<(t: string, c?: string) => void>('adminSnackbar');

const items = ref<any[]>([]);
const total = ref(0);
const loading = ref(false);
const page = ref(1);
const limit = ref(20);
const deleteDialog = ref(false);
const deleteTarget = ref<any>(null);
const deleting = ref(false);

const headers = [
  { title: 'ID', key: 'id', width: 70 },
  { title: 'Тема', key: 'subject' },
  { title: 'От', key: 'user' },
  { title: 'Дата', key: 'createdAt' },
  { title: '', key: 'actions', sortable: false, width: 80 },
];

function formatDate(d: string) {
  return new Date(d).toLocaleString('ru-RU');
}

async function loadItems() {
  loading.value = true;
  try {
    const res = await adminApi<any>('/reports', { query: { page: page.value, limit: limit.value } });
    items.value = res.data.reports;
    total.value = res.data.pagination.total;
  } finally {
    loading.value = false;
  }
}

function onOptionsUpdate(opts: { page: number; itemsPerPage: number }) {
  page.value = opts.page;
  limit.value = opts.itemsPerPage;
  loadItems();
}

function confirmDelete(item: any) {
  deleteTarget.value = item;
  deleteDialog.value = true;
}

async function deleteItem() {
  deleting.value = true;
  try {
    await adminApi(`/reports/${deleteTarget.value.id}`, { method: 'DELETE' });
    deleteDialog.value = false;
    snackbar?.('Удалено');
    loadItems();
  } finally {
    deleting.value = false;
  }
}

onMounted(loadItems);
</script>
