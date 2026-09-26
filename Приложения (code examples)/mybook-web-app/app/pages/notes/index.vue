<template>
  <div class="notes-page">
    <!-- Buy Confirm Modal -->
    <ConfirmModal
      v-model="showBuyConfirm"
      title="Покупка заметки"
      message="Купить эту заметку?"
      confirm-text="Купить"
      cancel-text="Отмена"
      @confirm="confirmBuyNote"
    />

    <!-- Delete Confirm Modal -->
    <ConfirmModal
      v-model="showDeleteConfirm"
      title="Удаление заметки"
      message="Удалить заметку? Это действие нельзя отменить."
      confirm-text="Удалить"
      cancel-text="Отмена"
      @confirm="confirmDeleteNote"
    />

    <!-- Error Message Modal -->
    <MessageModal
      v-model="showErrorMessage"
      title="Ошибка"
      :message="errorMessage"
      type="error"
    />

    <!-- Filters -->
    <ListFilters
      grid-class="grid-cols-1 md:grid-cols-3"
      @apply="applyFilters"
      @clear="clearFilters"
    >
      <div class="md-field">
        <label class="md-label" for="filter-notes-title">Заголовок</label>
        <input
          id="filter-notes-title"
          v-model="filters.title"
          type="text"
          class="md-input"
          placeholder="Поиск по заголовку..."
        >
      </div>
      <div class="md-field">
        <label class="md-label" for="filter-notes-type">Тип</label>
        <select
          id="filter-notes-type"
          v-model="filters.isContent"
          class="md-select"
        >
          <option value="">Все заметки</option>
          <option value="false">Обычные заметки</option>
          <option value="true">Платный контент</option>
        </select>
      </div>
      <div class="md-field">
        <label class="md-label" for="filter-notes-importance">
          Важность: {{ filters.importance ?? 'Любая' }}
        </label>
        <input
          id="filter-notes-importance"
          v-model.number="filters.importance"
          type="range"
          min="1"
          max="10"
          step="1"
          class="w-full accent-beige"
        >
        <span class="text-xs text-on-surface-muted px-1">Выберите значение для фильтрации</span>
      </div>
    </ListFilters>

    <!-- Notes Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <NoteCard
        v-for="note in notes"
        :key="note.id"
        :note="note"
        :preview="getNotePreview(note)"
        :can-edit="canEditNote(note)"
        @edit="editNote"
        @delete="deleteNote"
        @buy="buyNote"
      />
    </div>

    <Loading
      :loading="loading"
      title="Загрузка заметок..."
    />

    <EmptyState
      :show="!loading && notes.length === 0"
      title="Заметки не найдены"
    />

    <Pagination
      :pagination="pagination"
      @page-change="goToPage"
    />
  </div>
</template>

<script setup>
const { api } = useApi();
const authStore = useAuthStore();
const toast = useToast();

// SEO
useHead({
  title: 'Список заметок - TheBook',
  meta: [
    { name: 'description', content: 'Личные заметки и платный контент на платформе TheBook' }
  ]
});

const loading = ref(false);
const notes = ref([]);
const pagination = ref(null);
const showBuyConfirm = ref(false);
const showDeleteConfirm = ref(false);
const showErrorMessage = ref(false);
const errorMessage = ref('');
const noteToBuy = ref(null);
const noteToDelete = ref(null);

const filters = ref({
  title: '',
  isContent: '',
  importance: null
});


const fetchNotes = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.value?.page || 1,
      limit: 10
    };
    
    if (filters.value.title) {
      params.title = filters.value.title;
    }
    
    if (filters.value.isContent !== '') {
      params.isContent = filters.value.isContent;
    }
    
    if (filters.value.importance !== null) {
      params.importance = filters.value.importance;
    }
    
    const response = await api('/notes', { query: params });
    
    if (response.success && response.data) {
      notes.value = response.data.notes || [];
      pagination.value = {
        page: response.data.pagination?.page || 1,
        limit: response.data.pagination?.limit || 10,
        total: response.data.pagination?.total || 0,
        pages: response.data.pagination?.pages || 1
      };
    }
  } catch (error) {
    console.error('Error fetching notes:', error);
    toast.error(getFetchErrorMessage(error, 'Не удалось загрузить заметки'));
  } finally {
    loading.value = false;
  }
};

const getNotePreview = (note) => {
  return note.text.length > 150 ? note.text.substring(0, 150) + '...' : note.text;
};

const canEditNote = (note) => {
  if (!authStore.isAuthenticated) return false;
  if (authStore.isAdmin || authStore.isModerator) return true;
  return note.userId === authStore.user?.id;
};

const applyFilters = () => {
  pagination.value = { ...pagination.value, page: 1 };
  fetchNotes();
};

const clearFilters = () => {
  filters.value = { title: '', isContent: '', importance: null };
  pagination.value = { ...pagination.value, page: 1 };
  fetchNotes();
};

const goToPage = (page) => {
  pagination.value = { ...pagination.value, page };
  fetchNotes();
};

const editNote = (id) => {
  navigateTo(`/notes/${id}/edit`);
};

const buyNote = (id) => {
  noteToBuy.value = id;
  showBuyConfirm.value = true;
};

const confirmBuyNote = async () => {
  if (!noteToBuy.value) return;
  try {
    await api(`/notes/${noteToBuy.value}/buy`, {
      method: 'POST'
    });
    await fetchNotes();
  } catch (error) {
    console.error('Error buying note:', error);
    errorMessage.value = error.data?.error || 'Не удалось купить заметку';
    showErrorMessage.value = true;
  } finally {
    noteToBuy.value = null;
  }
};

const deleteNote = (id) => {
  noteToDelete.value = id;
  showDeleteConfirm.value = true;
};

const confirmDeleteNote = async () => {
  if (!noteToDelete.value) return;
  try {
    await api(`/notes/${noteToDelete.value}`, {
      method: 'DELETE'
    });
    await fetchNotes();
  } catch (error) {
    console.error('Error deleting note:', error);
  } finally {
    noteToDelete.value = null;
  }
};

// Load notes on mount
onMounted(() => {
  fetchNotes();
});
</script> 