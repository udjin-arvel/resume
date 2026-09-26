<template>
  <div>
    <v-card>
      <v-card-title>Сообщения об ошибках</v-card-title>
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
      </v-data-table-server>
    </v-card>

    <v-dialog v-model="viewDialog" max-width="640">
      <v-card v-if="viewItem" title="Детали ошибки">
        <v-card-text>
          <p><strong>URL:</strong> {{ viewItem.url }}</p>
          <p><strong>Текущий:</strong> {{ viewItem.currentText }}</p>
          <p><strong>Правильный:</strong> {{ viewItem.correctText }}</p>
        </v-card-text>
        <v-card-actions><v-spacer /><v-btn @click="viewDialog = false">Закрыть</v-btn></v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card title="Удалить?">
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
const viewDialog = ref(false);
const viewItem = ref<any>(null);

const headers = [
  { title: 'ID', key: 'id', width: 70 },
  { title: 'URL', key: 'url' },
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
    const res = await adminApi<any>('/mistakes', { query: { page: page.value, limit: limit.value } });
    items.value = res.data.mistakes;
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
    await adminApi(`/mistakes/${deleteTarget.value.id}`, { method: 'DELETE' });
    deleteDialog.value = false;
    snackbar?.('Удалено');
    loadItems();
  } finally {
    deleting.value = false;
  }
}

onMounted(loadItems);
</script>
