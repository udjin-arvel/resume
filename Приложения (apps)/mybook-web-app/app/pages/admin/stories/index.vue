<template>
  <div>
    <v-card>
      <v-card-title class="d-flex align-center flex-wrap ga-2">
        <span>Истории</span>
        <v-spacer />
        <v-text-field
          v-model="search"
          density="compact"
          hide-details
          placeholder="Поиск по названию..."
          prepend-inner-icon="mdi-magnify"
          style="max-width: 240px"
          @keyup.enter="loadItems"
        />
        <v-btn color="primary" class="text-white" prepend-icon="mdi-file-upload" to="/admin/stories/import">
          Импорт DOCX
        </v-btn>
      </v-card-title>
      <v-data-table-server
        :headers="headers"
        :items="items"
        :items-length="total"
        :loading="loading"
        :items-per-page="limit"
        @update:options="onOptionsUpdate"
      >
        <template #item.isPublic="{ item }">
          <v-icon :color="item.isPublic ? 'success' : 'grey'">
            {{ item.isPublic ? 'mdi-eye' : 'mdi-eye-off' }}
          </v-icon>
        </template>
        <template #item.user="{ item }">
          {{ item.user?.login }}
        </template>
        <template #item.actions="{ item }">
          <v-btn icon="mdi-pencil" size="small" variant="text" :to="`/admin/stories/${item.id}`" />
          <v-btn icon="mdi-delete" size="small" variant="text" color="error" @click="confirmDelete(item)" />
        </template>
      </v-data-table-server>
    </v-card>

    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card title="Удалить историю?">
        <v-card-text>«{{ deleteTarget?.title }}»</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">Отмена</v-btn>
          <v-btn color="error" :loading="deleting" @click="deleteItem">Удалить</v-btn>
        </v-card-actions>
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
const search = ref('');
const deleteDialog = ref(false);
const deleteTarget = ref<any>(null);
const deleting = ref(false);

const headers = [
  { title: 'ID', key: 'id', width: 70 },
  { title: 'Название', key: 'title' },
  { title: 'Тип', key: 'type' },
  { title: 'Автор', key: 'user' },
  { title: 'Фрагментов', key: '_count.fragments' },
  { title: 'Публичная', key: 'isPublic' },
  { title: '', key: 'actions', sortable: false, width: 100 },
];

async function loadItems() {
  loading.value = true;
  try {
    const res = await adminApi<any>('/stories', {
      query: { page: page.value, limit: limit.value, title: search.value || undefined },
    });
    items.value = res.data.stories;
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
    await adminApi(`/stories/${deleteTarget.value.id}`, { method: 'DELETE' });
    deleteDialog.value = false;
    snackbar?.('Удалено');
    loadItems();
  } catch {
    snackbar?.('Ошибка', 'error');
  } finally {
    deleting.value = false;
  }
}

onMounted(loadItems);
</script>
