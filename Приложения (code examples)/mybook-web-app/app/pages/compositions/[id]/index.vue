<template>
  <div class="view-composition-page">
    <!-- Delete Confirm Modal -->
    <ConfirmModal
      v-model="showDeleteConfirm"
      title="Удаление композиции"
      message="Удалить композицию? Это действие нельзя отменить."
      confirm-text="Удалить"
      cancel-text="Отмена"
      @confirm="confirmDeleteComposition"
    />

    <Loading :loading="loading" />

    <div v-if="!loading && composition">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex justify-between items-start mb-4">
          <div class="flex-1">
            <h1 class="text-3xl font-bold text-beige mb-2">{{ composition.title }}</h1>
            <div class="text-gray-400 text-sm">
              {{ composition.user?.login }} | {{ getCompositionType(composition.type) }} | {{ formatDate(composition.createdAt) }}
            </div>
          </div>
          <Poster
            :poster="composition.poster"
            :alt="composition.title"
            size="md"
            class="ml-6"
          />
        </div>

        <!-- Description -->
        <div v-if="composition.description" class="mb-6 p-4 bg-black border-l-4 border-beige">
          <p class="text-white" v-html="composition.description"></p>
        </div>
      </div>

      <!-- Stories list -->
      <div v-if="stories.length > 0" class="mb-8">
        <h2 class="text-xl font-bold text-white mb-4">Главы</h2>
        <div class="space-y-3">
          <div
            v-for="story in stories"
            :key="story.id"
            class="p-4 bg-black border border-gray-700 rounded-lg hover:border-beige transition-colors cursor-pointer"
            @click="navigateTo(`/stories/${story.id}`)"
          >
            <div class="flex justify-between items-center">
              <span class="text-beige">
                <span v-if="story.chapter" class="text-gray-300">Глава {{ story.chapter }}.</span>
                {{ story.title }}
              </span>
              <span v-if="story.createdAt" class="text-gray-400 text-sm">{{ formatDate(story.createdAt) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="mb-8 text-center text-gray-400 py-8">
        В этой композиции пока нет глав
      </div>

      <!-- Actions -->
      <div class="flex flex-wrap gap-x-5 gap-y-2 mb-8">
        <NuxtLink
          to="/compositions"
          class="text-beige hover:text-beige/80 hover:underline transition-colors focus:outline-none text-sm md:text-base"
        >
          К списку
        </NuxtLink>
        <NuxtLink
          v-if="canEdit"
          :to="`/compositions/${composition.id}/edit`"
          class="text-beige hover:text-beige/80 hover:underline transition-colors focus:outline-none text-sm md:text-base"
        >
          Редактировать
        </NuxtLink>
        <button
          v-if="canEdit"
          type="button"
          class="text-reder hover:text-red hover:underline transition-colors focus:outline-none text-sm md:text-base"
          @click="deleteComposition"
        >
          Удалить
        </button>
      </div>

      <!-- Comments section -->
      <CommentsSection 
        :content-type="'COMPOSITION'" 
        :content-id="compositionId" 
      />
    </div>

    <EmptyState
      :show="!loading && !composition"
      title="Композиция не найдена"
      variant="error"
    />
  </div>
</template>

<script setup>
const route = useRoute();
const { api } = useApi();
const authStore = useAuthStore();
const toast = useToast();
const compositionId = Number(route.params.id);

useHead({
  title: 'Просмотр композиции - TheBook'
});

const loading = ref(true);
const composition = ref(null);
const showDeleteConfirm = ref(false);

const canEdit = computed(() => {
  if (!authStore.isAuthenticated) return false;
  if (authStore.isAdmin || authStore.isModerator) return true;
  return composition.value?.userId === authStore.user?.id;
});

const stories = computed(() => {
  const list = composition.value?.stories;
  if (!Array.isArray(list)) return [];
  return [...list].sort((a, b) => (a.chapter || 0) - (b.chapter || 0));
});

const getCompositionType = (type) => {
  return type === 'BOOK' ? 'Книга' : 'Сборник глав';
};

const fetchComposition = async () => {
  loading.value = true;
  try {
    const response = await api(`/compositions/${compositionId}`);
    if (response.success && response.data) {
      composition.value = response.data;
    }
  } catch (error) {
    console.error('Error fetching composition:', error);
    toast.error(getFetchErrorMessage(error, 'Не удалось загрузить композицию'));
  } finally {
    loading.value = false;
  }
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('ru-RU');
};

const deleteComposition = () => {
  showDeleteConfirm.value = true;
};

const confirmDeleteComposition = async () => {
  try {
    await api(`/compositions/${compositionId}`, { method: 'DELETE' });
    navigateTo('/compositions');
  } catch (error) {
    console.error('Error deleting composition:', error);
  }
};

onMounted(() => {
  fetchComposition();
});
</script>
