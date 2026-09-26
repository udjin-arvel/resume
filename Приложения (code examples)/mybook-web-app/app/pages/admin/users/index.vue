<template>
  <div>
    <v-card>
      <v-card-title class="d-flex align-center flex-wrap ga-2">
        <span>Пользователи</span>
        <v-spacer />
        <v-text-field
          v-model="search"
          density="compact"
          hide-details
          placeholder="Поиск..."
          prepend-inner-icon="mdi-magnify"
          style="max-width: 240px"
          @keyup.enter="loadUsers"
        />
        <v-select
          v-model="statusFilter"
          :items="statusOptions"
          density="compact"
          hide-details
          label="Статус"
          style="max-width: 160px"
          clearable
          @update:model-value="loadUsers"
        />
      </v-card-title>
      <v-data-table-server
        :headers="headers"
        :items="users"
        :items-length="total"
        :loading="loading"
        :items-per-page="limit"
        @update:options="onOptionsUpdate"
      >
        <template #item.status="{ item }">
          <v-chip size="small" :color="statusColor(item.status)">{{ item.status }}</v-chip>
        </template>
        <template #item.actions="{ item }">
          <v-btn icon="mdi-pencil" size="small" variant="text" @click="openEdit(item)" />
          <v-btn
            icon="mdi-delete"
            size="small"
            variant="text"
            color="error"
            @click="confirmDelete(item)"
          />
        </template>
      </v-data-table-server>
    </v-card>

    <v-dialog v-model="editDialog" max-width="520">
      <v-card title="Редактирование пользователя">
        <v-card-text>
          <v-text-field v-model="editForm.login" label="Логин" />
          <v-text-field v-model="editForm.email" label="Email" />
          <v-select v-model="editForm.status" :items="statusOptions" label="Статус" />
          <v-text-field v-model.number="editForm.level" label="Уровень" type="number" />
          <v-text-field v-model.number="editForm.experience" label="Опыт" type="number" />
          <v-text-field v-model.number="editForm.tokens" label="Токены" type="number" />
          <v-text-field v-model="editForm.password" label="Новый пароль" type="password" hint="Оставьте пустым, чтобы не менять" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="editDialog = false">Отмена</v-btn>
          <v-btn color="primary" :loading="saving" @click="saveUser">Сохранить</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card title="Удалить пользователя?">
        <v-card-text>Удалить {{ deleteTarget?.login }}?</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">Отмена</v-btn>
          <v-btn color="error" :loading="deleting" @click="deleteUser">Удалить</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin'] });

const { adminApi } = useAdminApi();
const snackbar = inject<(t: string, c?: string) => void>('adminSnackbar');

const users = ref<any[]>([]);
const total = ref(0);
const loading = ref(false);
const page = ref(1);
const limit = ref(20);
const search = ref('');
const statusFilter = ref<string | null>(null);

const statusOptions = ['ADMIN', 'MODERATOR', 'WRITER', 'READER'];

const headers = [
  { title: 'ID', key: 'id', width: 70 },
  { title: 'Логин', key: 'login' },
  { title: 'Email', key: 'email' },
  { title: 'Статус', key: 'status' },
  { title: 'Уровень', key: 'level' },
  { title: 'Токены', key: 'tokens' },
  { title: '', key: 'actions', sortable: false, width: 100 },
];

const editDialog = ref(false);
const saving = ref(false);
const editForm = reactive<any>({});
const deleteDialog = ref(false);
const deleteTarget = ref<any>(null);
const deleting = ref(false);

function statusColor(s: string) {
  return { ADMIN: 'error', MODERATOR: 'warning', WRITER: 'info', READER: 'default' }[s] || 'default';
}

async function loadUsers() {
  loading.value = true;
  try {
    const res = await adminApi<any>('/users', {
      query: {
        page: page.value,
        limit: limit.value,
        search: search.value || undefined,
        status: statusFilter.value || undefined,
      },
    });
    users.value = res.data.users;
    total.value = res.data.pagination.total;
  } catch (e) {
    snackbar?.('Ошибка загрузки', 'error');
  } finally {
    loading.value = false;
  }
}

function onOptionsUpdate(opts: { page: number; itemsPerPage: number }) {
  page.value = opts.page;
  limit.value = opts.itemsPerPage;
  loadUsers();
}

function openEdit(item: any) {
  Object.assign(editForm, { ...item, password: '' });
  editDialog.value = true;
}

async function saveUser() {
  saving.value = true;
  try {
    const body: Record<string, unknown> = {
      login: editForm.login,
      email: editForm.email,
      status: editForm.status,
      level: editForm.level,
      experience: editForm.experience,
      tokens: editForm.tokens,
    };
    if (editForm.password) body.password = editForm.password;
    await adminApi(`/users/${editForm.id}`, { method: 'PATCH', body });
    editDialog.value = false;
    snackbar?.('Сохранено');
    loadUsers();
  } catch (e: any) {
    snackbar?.(e.data?.error || 'Ошибка', 'error');
  } finally {
    saving.value = false;
  }
}

function confirmDelete(item: any) {
  deleteTarget.value = item;
  deleteDialog.value = true;
}

async function deleteUser() {
  deleting.value = true;
  try {
    await adminApi(`/users/${deleteTarget.value.id}`, { method: 'DELETE' });
    deleteDialog.value = false;
    snackbar?.('Удалено');
    loadUsers();
  } catch (e: any) {
    snackbar?.(e.data?.error || 'Ошибка', 'error');
  } finally {
    deleting.value = false;
  }
}

onMounted(loadUsers);
</script>
