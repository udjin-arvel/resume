<template>
  <div class="view-notion-page">
    <!-- Delete Confirm Modal -->
    <ConfirmModal
      v-model="showDeleteConfirm"
      title="Удаление записи"
      message="Удалить запись? Это действие нельзя отменить."
      confirm-text="Удалить"
      cancel-text="Отмена"
      @confirm="confirmDeleteNotion"
    />

    <Loading :loading="loading" />

    <div v-if="!loading && notion">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex justify-between items-start mb-4">
          <div class="flex-1">
            <h1 class="text-3xl font-bold text-beige mb-2">{{ notion.title }}</h1>
            <div class="text-gray-400 text-sm">
              {{ notion.user?.login }} | {{ getNotionType(notion.type) }} | {{ formatDate(notion.createdAt) }}
            </div>
          </div>
          <Poster
            :poster="notion.poster"
            :alt="notion.title"
            size="md"
            class="ml-6"
          />
        </div>
      </div>

      <!-- Content -->
      <div class="mb-8">
        <div
          class="story-prose text-white/90"
          :style="contentTextStyle"
          v-html="notion.text"
        ></div>
      </div>

      <!-- Actions -->
      <div class="flex flex-wrap gap-x-5 gap-y-2 mb-8">
        <NuxtLink
          to="/notions"
          class="text-beige hover:text-beige/80 hover:underline transition-colors focus:outline-none text-sm md:text-base"
        >
          К списку
        </NuxtLink>
        <NuxtLink
          v-if="canEdit"
          :to="`/notions/${notion.id}/edit`"
          class="text-beige hover:text-beige/80 hover:underline transition-colors focus:outline-none text-sm md:text-base"
        >
          Редактировать
        </NuxtLink>
        <button
          v-if="canEdit"
          type="button"
          class="text-reder hover:text-red hover:underline transition-colors focus:outline-none text-sm md:text-base"
          @click="deleteNotion"
        >
          Удалить
        </button>
      </div>

      <!-- Comments section -->
      <CommentsSection 
        :content-type="'NOTION'" 
        :content-id="notionId" 
      />
    </div>

    <EmptyState
      :show="!loading && !notion"
      title="Запись не найдена"
      variant="error"
    />
  </div>
</template>

<script setup>
import { useFontSettings } from '~/composables/useFontSettings';

const route = useRoute();
const { api } = useApi();
const authStore = useAuthStore();
const toast = useToast();
const notionId = Number(route.params.id);
const { contentTextStyle } = useFontSettings();

useHead({
  title: 'Просмотр записи - TheBook'
});

const loading = ref(true);
const notion = ref(null);
const showDeleteConfirm = ref(false);

const canEdit = computed(() => {
  if (!authStore.isAuthenticated) return false;
  if (authStore.isAdmin || authStore.isModerator) return true;
  return notion.value?.userId === authStore.user?.id;
});

const getNotionType = (type) => {
  const types = {
    DEFINITION: 'Определение',
    CHARACTER: 'Персонаж',
    PLACE: 'Место',
    OBJECT: 'Объект',
    ENTITY: 'Сущность',
    EVENT: 'Событие'
  };
  return types[type] || type;
};

const fetchNotion = async () => {
  loading.value = true;
  try {
    const response = await api(`/notions/${notionId}`);
    if (response.success && response.data) {
      notion.value = response.data;
    }
  } catch (error) {
    console.error('Error fetching notion:', error);
    toast.error(getFetchErrorMessage(error, 'Не удалось загрузить понятие'));
  } finally {
    loading.value = false;
  }
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('ru-RU');
};

const deleteNotion = () => {
  showDeleteConfirm.value = true;
};

const confirmDeleteNotion = async () => {
  try {
    await api(`/notions/${notionId}`, { method: 'DELETE' });
    navigateTo('/notions');
  } catch (error) {
    console.error('Error deleting notion:', error);
  }
};

onMounted(() => {
  fetchNotion();
});
</script>
