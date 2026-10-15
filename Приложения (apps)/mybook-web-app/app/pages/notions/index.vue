<template>
  <div class="notions-page">
    <!-- Unpublish Confirm Modal -->
    <ConfirmModal
      v-model="showUnpublishConfirm"
      title="Снятие с публикации"
      message="Убрать понятие из публикации?"
      confirm-text="Убрать"
      cancel-text="Отмена"
      @confirm="confirmUnpublishNotion"
    />

    <!-- Delete Confirm Modal -->
    <ConfirmModal
      v-model="showDeleteConfirm"
      title="Удаление понятия"
      message="Удалить понятие? Это действие нельзя отменить."
      confirm-text="Удалить"
      cancel-text="Отмена"
      @confirm="confirmDeleteNotion"
    />

    <!-- Add Image Modal -->
    <AddImageModal
      v-model="showAddImageModal"
      content-type="notion"
      :content-id="notionToAddImage"
      @uploaded="onImageUploaded"
    />

    <GalleryModal
      v-model="showGallery"
      :images="galleryImages"
    />

    <!-- Filters -->
    <ListFilters @apply="applyFilters" @clear="clearFilters">
      <div class="md-field">
        <label class="md-label" for="filter-notions-title">Заголовок</label>
        <input
          id="filter-notions-title"
          v-model="filters.title"
          type="text"
          class="md-input"
          placeholder="Поиск по заголовку..."
        >
      </div>
      <div class="md-field">
        <label class="md-label" for="filter-notions-type">Тип</label>
        <select
          id="filter-notions-type"
          v-model="filters.type"
          class="md-select"
        >
          <option value="">Все типы</option>
          <option value="DEFINITION">Определение</option>
          <option value="CHARACTER">Персонаж</option>
          <option value="PLACE">Место</option>
          <option value="OBJECT">Объект</option>
          <option value="ENTITY">Сущность</option>
          <option value="EVENT">Событие</option>
        </select>
      </div>
    </ListFilters>

    <!-- Notions List -->
    <div class="space-y-6">
      <ContentCard
        v-for="notion in notions" 
        :key="notion.id"
        :item="notion"
        type="notions"
        :preview="getNotionPreview(notion)"
        :can-edit="canEditNotion(notion)"
        @read="viewNotion"
        @edit="editNotion"
        @unpublish="unpublishNotion"
        @delete="deleteNotion"
        @add-image="addImage"
        @view-gallery="viewGallery"
      />
    </div>

    <Loading
      :loading="loading"
      title="Загрузка понятий..."
    />

    <EmptyState
      :show="!loading && notions.length === 0"
      title="Понятия не найдены"
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
  title: 'Список понятий - TheBook',
  meta: [
    { name: 'description', content: 'Изучите определения, персонажей и места вселенной TheBook' }
  ]
});

const loading = ref(false);
const showGallery = ref(false);
const notions = ref([]);
const pagination = ref(null);
const galleryImages = ref([]);
const showUnpublishConfirm = ref(false);
const showDeleteConfirm = ref(false);
const showAddImageModal = ref(false);
const notionToUnpublish = ref(null);
const notionToDelete = ref(null);
const notionToAddImage = ref(null);

const filters = ref({
  title: '',
  type: ''
});

const fetchNotions = async () => {
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
    
    const response = await api('/notions', { query: params });
    
    if (response.success && response.data) {
      notions.value = response.data.notions || [];
      pagination.value = {
        page: response.data.pagination?.page || 1,
        limit: response.data.pagination?.limit || 10,
        total: response.data.pagination?.total || 0,
        pages: response.data.pagination?.pages || 1
      };
    }
  } catch (error) {
    console.error('Error fetching notions:', error);
    toast.error(getFetchErrorMessage(error, 'Не удалось загрузить понятия'));
  } finally {
    loading.value = false;
  }
};

const getNotionPreview = (notion) => {
  return notion.text.length > 750 ? notion.text.substring(0, 750) + '...' : notion.text;
};


const canEditNotion = (notion) => {
  if (!authStore.isAuthenticated) return false;
  if (authStore.isAdmin || authStore.isModerator) return true;
  return notion.userId === authStore.user?.id;
};

const applyFilters = () => {
  pagination.value = { ...pagination.value, page: 1 };
  fetchNotions();
};

const clearFilters = () => {
  filters.value = { title: '', type: '' };
  applyFilters();
};

const goToPage = (page) => {
  pagination.value = { ...pagination.value, page };
  fetchNotions();
};

const viewNotion = (id) => {
  navigateTo(`/notions/${id}`);
};

const editNotion = (id) => {
  navigateTo(`/notions/${id}/edit`);
};

const viewGallery = (id) => {
  const notion = notions.value.find(n => n.id === id);
  if (notion) {
    const images = [];
    // Добавляем poster первым элементом, если он есть
    if (notion.poster) {
      images.push({ path: notion.poster, title: notion.title });
    }
    // Добавляем остальные изображения
    if (notion.images && notion.images.length > 0) {
      images.push(...notion.images);
    }
    if (images.length > 0) {
      galleryImages.value = images;
      showGallery.value = true;
    }
  }
};

const unpublishNotion = (id) => {
  notionToUnpublish.value = id;
  showUnpublishConfirm.value = true;
};

const confirmUnpublishNotion = async () => {
  if (!notionToUnpublish.value) return;
  try {
    await api(`/notions/${notionToUnpublish.value}`, {
      method: 'PUT',
      body: { isPublic: false }
    });
    await fetchNotions();
  } catch (error) {
    console.error('Error unpublishing notion:', error);
  } finally {
    notionToUnpublish.value = null;
  }
};

const addImage = (id) => {
  notionToAddImage.value = id;
  showAddImageModal.value = true;
};

const onImageUploaded = async (image) => {
  // Refresh notions list to update images
  await fetchNotions();
};

const deleteNotion = (id) => {
  notionToDelete.value = id;
  showDeleteConfirm.value = true;
};

const confirmDeleteNotion = async () => {
  if (!notionToDelete.value) return;
  try {
    await api(`/notions/${notionToDelete.value}`, {
      method: 'DELETE'
    });
    await fetchNotions();
  } catch (error) {
    console.error('Error deleting notion:', error);
  } finally {
    notionToDelete.value = null;
  }
};

// Load notions on mount
onMounted(() => {
  fetchNotions();
});
</script> 