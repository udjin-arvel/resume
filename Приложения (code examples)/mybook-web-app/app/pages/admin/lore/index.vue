<template>
  <div>
    <v-card>
      <v-card-title class="d-flex align-center flex-wrap ga-2">
        <span>Лор</span>
        <v-spacer />
        <v-text-field v-model="search" density="compact" hide-details placeholder="Поиск..." prepend-inner-icon="mdi-magnify" style="max-width: 240px" @keyup.enter="loadItems()" />
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreate({ accessLevel: 1, isPublic: true })">Добавить</v-btn>
      </v-card-title>
      <v-data-table-server :headers="headers" :items="items" :items-length="total" :loading="loading" :items-per-page="limit" @update:options="onOptionsUpdate">
        <template #item.user="{ item }">{{ item.user?.login }}</template>
        <template #item.actions="{ item }">
          <v-btn icon="mdi-pencil" size="small" variant="text" @click="openEdit(item)" />
          <v-btn icon="mdi-delete" size="small" variant="text" color="error" @click="confirmDelete(item)" />
        </template>
      </v-data-table-server>
    </v-card>

    <v-dialog v-model="dialog" max-width="560">
      <v-card :title="editItem ? 'Редактировать' : 'Создать'">
        <v-card-text>
          <v-text-field v-model="form.title" label="Название" />
          <v-textarea v-model="form.text" label="Текст" rows="4" />
          <v-text-field v-model.number="form.accessLevel" label="Уровень доступа" type="number" />
          <v-switch v-model="form.isPublic" label="Публичное" color="primary" />
        </v-card-text>
        <v-card-actions><v-spacer /><v-btn variant="text" @click="dialog = false">Отмена</v-btn><v-btn color="primary" :loading="saving" @click="save()">Сохранить</v-btn></v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card title="Удалить?"><v-card-text>«{{ deleteTarget?.title }}»</v-card-text>
        <v-card-actions><v-spacer /><v-btn variant="text" @click="deleteDialog = false">Отмена</v-btn><v-btn color="error" :loading="deleting" @click="deleteItem">Удалить</v-btn></v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin'] });
const headers = [
  { title: 'ID', key: 'id', width: 70 }, { title: 'Название', key: 'title' },
  { title: 'Автор', key: 'user' },
  { title: '', key: 'actions', sortable: false, width: 100 },
];
const crud = useAdminCrud({ endpoint: '/lore', itemsKey: 'loreItems' });
const { items, total, loading, limit, search, dialog, deleteDialog, saving, deleting, form, editItem, deleteTarget, loadItems, onOptionsUpdate, openCreate, openEdit, save, confirmDelete, deleteItem } = crud;
onMounted(() => loadItems());
</script>
