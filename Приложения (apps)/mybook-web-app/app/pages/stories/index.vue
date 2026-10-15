<template>
  <div class="stories-page">
    <!-- Unpublish Confirm Modal -->
    <ConfirmModal
      v-model="showUnpublishConfirm"
      title="Снятие с публикации"
      message="Убрать историю из публикации?"
      confirm-text="Убрать"
      cancel-text="Отмена"
      @confirm="confirmUnpublishStory"
    />

    <!-- Delete Confirm Modal -->
    <ConfirmModal
      v-model="showDeleteConfirm"
      title="Удаление истории"
      message="Удалить историю? Это действие нельзя отменить."
      confirm-text="Удалить"
      cancel-text="Отмена"
      @confirm="confirmDeleteStory"
    />

    <!-- Filters -->
    <ListFilters @apply="applyFilters" @clear="clearFilters">
      <div class="md-field">
        <label class="md-label" for="filter-title">Заголовок</label>
        <input
          id="filter-title"
          v-model="filters.title"
          type="text"
          class="md-input"
          placeholder="Поиск по заголовку..."
        >
      </div>
      <div class="md-field">
        <label class="md-label" for="filter-type">Тип</label>
        <select
          id="filter-type"
          v-model="filters.type"
          class="md-select"
        >
          <option value="">Все типы</option>
          <option value="STORY">История</option>
          <option value="ANNOUNCEMENT">Анонс</option>
        </select>
      </div>
    </ListFilters>

    <!-- Stories List -->
    <div class="space-y-6">
      <ContentCard
        v-for="story in stories" 
        :key="story.id"
        :item="story"
        type="stories"
        :preview="getStoryPreview(story)"
        :can-edit="canEditStory(story)"
        @read="readStory"
        @edit="editStory"
        @unpublish="unpublishStory"
        @delete="deleteStory"
      />
    </div>

    <Loading
      :loading="loading"
      title="Загрузка историй..."
    />

    <EmptyState
      :show="!loading && stories.length === 0"
      title="Истории не найдены"
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
  title: 'Список историй - TheBook',
  meta: [
    { name: 'description', content: 'Исследуйте увлекательные истории и анонсы на платформе TheBook' }
  ]
});

const loading = ref(false);
const stories = ref([]);
const pagination = ref(null);
const showUnpublishConfirm = ref(false);
const showDeleteConfirm = ref(false);
const storyToUnpublish = ref(null);
const storyToDelete = ref(null);

const filters = ref({
  title: '',
  type: ''
});

const fetchStories = async () => {
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
    
    const response = await api('/stories', { query: params });
    
    if (response.success && response.data) {
      stories.value = response.data.data || [];
      pagination.value = {
        page: response.data.pagination?.page || 1,
        limit: response.data.pagination?.limit || 10,
        total: response.data.pagination?.total || 0,
        pages: response.data.pagination?.totalPages || 1
      };
    }
  } catch (error) {
    console.error('Error fetching stories:', error);
    toast.error(getFetchErrorMessage(error, 'Не удалось загрузить истории'));
  } finally {
    loading.value = false;
  }
};

const getStoryPreview = (story) => {
  // Используем text из API если есть (уже с троеточием)
  if (story.text) {
    return story.text;
  }
  // Fallback для обратной совместимости
  if (story.fragments && story.fragments.length > 0) {
    const text = story.fragments[0].text;
    return text.length > 750 ? text.substring(0, 750) + '...' : text;
  }
  return 'Текст истории недоступен';
};


const canEditStory = (story) => {
  if (!authStore.isAuthenticated) return false;
  if (authStore.isAdmin || authStore.isModerator) return true;
  return story.userId === authStore.user?.id;
};

const applyFilters = () => {
  pagination.value = { ...pagination.value, page: 1 };
  fetchStories();
};

const clearFilters = () => {
  filters.value = { title: '', type: '' };
  applyFilters();
};

const goToPage = (page) => {
  pagination.value = { ...pagination.value, page };
  fetchStories();
};

const readStory = (id) => {
  navigateTo(`/stories/${id}`);
};

const editStory = (id) => {
  navigateTo(`/stories/${id}/edit`);
};

const unpublishStory = (id) => {
  storyToUnpublish.value = id;
  showUnpublishConfirm.value = true;
};

const confirmUnpublishStory = async () => {
  if (!storyToUnpublish.value) return;
  try {
    await api(`/stories/${storyToUnpublish.value}`, {
      method: 'PUT',
      body: { isPublic: false }
    });
    await fetchStories();
  } catch (error) {
    console.error('Error unpublishing story:', error);
  } finally {
    storyToUnpublish.value = null;
  }
};

const deleteStory = (id) => {
  storyToDelete.value = id;
  showDeleteConfirm.value = true;
};

const confirmDeleteStory = async () => {
  if (!storyToDelete.value) return;
  try {
    await api(`/stories/${storyToDelete.value}`, {
      method: 'DELETE'
    });
    await fetchStories();
  } catch (error) {
    console.error('Error deleting story:', error);
  } finally {
    storyToDelete.value = null;
  }
};

// Load stories on mount
onMounted(() => {
  fetchStories();
});
</script> 