<template>
  <div class="compositions-page">
    <!-- Unpublish Confirm Modal -->
    <ConfirmModal
      v-model="showUnpublishConfirm"
      title="Снятие с публикации"
      message="Убрать композицию из публикации?"
      confirm-text="Убрать"
      cancel-text="Отмена"
      @confirm="confirmUnpublishComposition"
    />

    <!-- Delete Confirm Modal -->
    <ConfirmModal
      v-model="showDeleteConfirm"
      title="Удаление композиции"
      message="Удалить композицию? Это действие нельзя отменить."
      confirm-text="Удалить"
      cancel-text="Отмена"
      @confirm="confirmDeleteComposition"
    />

    <!-- Filters -->
    <ListFilters @apply="applyFilters" @clear="clearFilters">
      <div class="md-field">
        <label class="md-label" for="filter-compositions-title">Заголовок</label>
        <input
          id="filter-compositions-title"
          v-model="filters.title"
          type="text"
          class="md-input"
          placeholder="Поиск по заголовку..."
        >
      </div>
      <div class="md-field">
        <label class="md-label" for="filter-compositions-type">Тип</label>
        <select
          id="filter-compositions-type"
          v-model="filters.type"
          class="md-select"
        >
          <option value="">Все типы</option>
          <option value="BOOK">Книга</option>
          <option value="CHAPTER_COLLECTION">Сборник глав</option>
        </select>
      </div>
    </ListFilters>

    <!-- Compositions List -->
    <div class="space-y-6">
      <CompositionCard
        v-for="composition in compositions"
        :key="composition.id"
        :composition="composition"
        :can-edit="canEditComposition(composition)"
        @view="viewComposition"
        @edit="editComposition"
        @unpublish="unpublishComposition"
        @delete="deleteComposition"
        @read-story="readStory"
      />
    </div>

    <Loading
      :loading="loading"
      title="Загрузка композиций..."
    />

    <EmptyState
      :show="!loading && compositions.length === 0"
      title="Композиции не найдены"
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
  title: 'Список композиций - TheBook',
  meta: [
    { name: 'description', content: 'Книги и серии историй на платформе TheBook' }
  ]
});

const loading = ref(false);
const compositions = ref([]);
const pagination = ref(null);
const showUnpublishConfirm = ref(false);
const showDeleteConfirm = ref(false);
const compositionToUnpublish = ref(null);
const compositionToDelete = ref(null);

const filters = ref({
  title: '',
  type: ''
});

const fetchCompositions = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.value?.page || 1,
      limit: 10
    };
    
    if (filters.value.title) {
      params.title = filters.value.title;
    }
    
    if (filters.value.type) {
      params.type = filters.value.type;
    }
    
    const response = await api('/compositions', { query: params });
    
    if (response.success && response.data) {
      compositions.value = response.data.compositions || [];
      pagination.value = {
        page: response.data.pagination?.page || 1,
        limit: response.data.pagination?.limit || 10,
        total: response.data.pagination?.total || 0,
        pages: response.data.pagination?.pages || 1
      };
    }
  } catch (error) {
    console.error('Error fetching compositions:', error);
    toast.error(getFetchErrorMessage(error, 'Не удалось загрузить композиции'));
  } finally {
    loading.value = false;
  }
};

const canEditComposition = (composition) => {
  if (!authStore.isAuthenticated) return false;
  if (authStore.isAdmin || authStore.isModerator) return true;
  return composition.userId === authStore.user?.id;
};

const applyFilters = () => {
  pagination.value = { ...pagination.value, page: 1 };
  fetchCompositions();
};

const clearFilters = () => {
  filters.value = { title: '', type: '' };
  applyFilters();
};

const goToPage = (page) => {
  pagination.value = { ...pagination.value, page };
  fetchCompositions();
};

const viewComposition = (id) => {
  navigateTo(`/compositions/${id}`);
};

const readStory = (id) => {
  navigateTo(`/stories/${id}`);
};

const editComposition = (id) => {
  navigateTo(`/compositions/${id}/edit`);
};

const unpublishComposition = (id) => {
  compositionToUnpublish.value = id;
  showUnpublishConfirm.value = true;
};

const confirmUnpublishComposition = async () => {
  if (!compositionToUnpublish.value) return;
  try {
    await api(`/compositions/${compositionToUnpublish.value}`, {
      method: 'PUT',
      body: { isPublic: false }
    });
    await fetchCompositions();
  } catch (error) {
    console.error('Error unpublishing composition:', error);
  } finally {
    compositionToUnpublish.value = null;
  }
};

const deleteComposition = (id) => {
  compositionToDelete.value = id;
  showDeleteConfirm.value = true;
};

const confirmDeleteComposition = async () => {
  if (!compositionToDelete.value) return;
  try {
    await api(`/compositions/${compositionToDelete.value}`, {
      method: 'DELETE'
    });
    await fetchCompositions();
  } catch (error) {
    console.error('Error deleting composition:', error);
  } finally {
    compositionToDelete.value = null;
  }
};

// Load compositions on mount
onMounted(() => {
  fetchCompositions();
});
</script> 