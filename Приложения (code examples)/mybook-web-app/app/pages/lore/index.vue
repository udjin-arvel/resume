<template>
  <div class="lore-page">
    <!-- Unpublish Confirm Modal -->
    <ConfirmModal
      v-model="showUnpublishConfirm"
      title="Снятие с публикации"
      message="Убрать элемент лора из публикации?"
      confirm-text="Убрать"
      cancel-text="Отмена"
      @confirm="confirmUnpublishLoreItem"
    />

    <!-- Delete Confirm Modal -->
    <ConfirmModal
      v-model="showDeleteConfirm"
      title="Удаление элемента лора"
      message="Удалить элемент лора? Это действие нельзя отменить."
      confirm-text="Удалить"
      cancel-text="Отмена"
      @confirm="confirmDeleteLoreItem"
    />

    <!-- Add Image Modal -->
    <AddImageModal
      v-model="showAddImageModal"
      content-type="lore"
      :content-id="loreItemToAddImage"
      @uploaded="onImageUploaded"
    />

    <GalleryModal
      v-model="showGallery"
      :images="galleryImages"
    />

    <!-- Filters -->
    <ListFilters
      grid-class="grid-cols-1"
      @apply="applyFilters"
      @clear="clearFilters"
    >
      <div class="md-field">
        <label class="md-label" for="filter-lore-title">Заголовок</label>
        <input
          id="filter-lore-title"
          v-model="filters.title"
          type="text"
          class="md-input"
          placeholder="Поиск по заголовку..."
        >
      </div>
    </ListFilters>

    <!-- Lore Items List -->
    <div class="space-y-6">
      <ContentCard
        v-for="loreItem in loreItems" 
        :key="loreItem.id"
        :item="loreItem"
        type="lore"
        :preview="getLoreItemPreview(loreItem)"
        :can-edit="canEditLoreItem(loreItem)"
        @read="readLoreItem"
        @edit="editLoreItem"
        @unpublish="unpublishLoreItem"
        @delete="deleteLoreItem"
        @add-image="addImage"
        @view-gallery="viewGallery"
      />
    </div>

    <Loading
      :loading="loading"
      title="Загрузка элементов лора..."
    />

    <EmptyState
      :show="!loading && loreItems.length === 0"
      title="Элементы лора не найдены"
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
  title: 'Список элементов лора - TheBook',
  meta: [
    { name: 'description', content: 'Погрузитесь в элементы вселенной TheBook' }
  ]
});

const loading = ref(false);
const showGallery = ref(false);
const loreItems = ref([]);
const pagination = ref(null);
const galleryImages = ref([]);
const showUnpublishConfirm = ref(false);
const showDeleteConfirm = ref(false);
const showAddImageModal = ref(false);
const loreItemToUnpublish = ref(null);
const loreItemToDelete = ref(null);
const loreItemToAddImage = ref(null);

const filters = ref({
  title: ''
});

const fetchLoreItems = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.value?.page || 1,
      limit: 10
    };
    
    if (filters.value.title) {
      params.title = filters.value.title;
    }
    
    const response = await api('/lore', { query: params });
    
    if (response.success && response.data) {
      loreItems.value = response.data.loreItems || [];
      pagination.value = {
        page: response.data.pagination?.page || 1,
        limit: response.data.pagination?.limit || 10,
        total: response.data.pagination?.total || 0,
        pages: response.data.pagination?.pages || 1
      };
    }
  } catch (error) {
    console.error('Error fetching lore items:', error);
    toast.error(getFetchErrorMessage(error, 'Не удалось загрузить элементы лора'));
  } finally {
    loading.value = false;
  }
};

const getLoreItemPreview = (loreItem) => {
  return loreItem.text.length > 750 ? loreItem.text.substring(0, 750) + '...' : loreItem.text;
};

const canEditLoreItem = (loreItem) => {
  if (!authStore.isAuthenticated) return false;
  if (authStore.isAdmin || authStore.isModerator) return true;
  return loreItem.userId === authStore.user?.id;
};

const applyFilters = () => {
  pagination.value = { ...pagination.value, page: 1 };
  fetchLoreItems();
};

const clearFilters = () => {
  filters.value = { title: '' };
  applyFilters();
};

const goToPage = (page) => {
  pagination.value = { ...pagination.value, page };
  fetchLoreItems();
};

const readLoreItem = (id) => {
  navigateTo(`/lore/${id}`);
};

const editLoreItem = (id) => {
  navigateTo(`/lore/${id}/edit`);
};

const viewGallery = (id) => {
  const loreItem = loreItems.value.find(l => l.id === id);
  if (loreItem) {
    const images = [];
    // Добавляем poster первым элементом, если он есть
    if (loreItem.poster) {
      images.push({ path: loreItem.poster, title: loreItem.title });
    }
    // Добавляем остальные изображения
    if (loreItem.images && loreItem.images.length > 0) {
      images.push(...loreItem.images);
    }
    if (images.length > 0) {
      galleryImages.value = images;
      showGallery.value = true;
    }
  }
};

const unpublishLoreItem = (id) => {
  loreItemToUnpublish.value = id;
  showUnpublishConfirm.value = true;
};

const confirmUnpublishLoreItem = async () => {
  if (!loreItemToUnpublish.value) return;
  try {
    await api(`/lore/${loreItemToUnpublish.value}`, {
      method: 'PUT',
      body: { isPublic: false }
    });
    await fetchLoreItems();
  } catch (error) {
    console.error('Error unpublishing lore item:', error);
  } finally {
    loreItemToUnpublish.value = null;
  }
};

const addImage = (id) => {
  loreItemToAddImage.value = id;
  showAddImageModal.value = true;
};

const onImageUploaded = async (image) => {
  // Refresh lore items list to update images
  await fetchLoreItems();
};

const deleteLoreItem = (id) => {
  loreItemToDelete.value = id;
  showDeleteConfirm.value = true;
};

const confirmDeleteLoreItem = async () => {
  if (!loreItemToDelete.value) return;
  try {
    await api(`/lore/${loreItemToDelete.value}`, {
      method: 'DELETE'
    });
    await fetchLoreItems();
  } catch (error) {
    console.error('Error deleting lore item:', error);
  } finally {
    loreItemToDelete.value = null;
  }
};

// Load lore items on mount
onMounted(() => {
  fetchLoreItems();
});
</script> 