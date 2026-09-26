<template>
  <div class="view-lore-page">
    <!-- Delete Confirm Modal -->
    <ConfirmModal
      v-model="showDeleteConfirm"
      title="Удаление записи"
      message="Удалить запись? Это действие нельзя отменить."
      confirm-text="Удалить"
      cancel-text="Отмена"
      @confirm="confirmDeleteLore"
    />

    <Loading :loading="loading" />

    <div v-if="!loading && lore">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex justify-between items-start mb-4">
          <div class="flex-1">
            <h1 class="text-3xl font-bold text-beige mb-2">{{ lore.title }}</h1>
            <div class="text-gray-400 text-sm">
              {{ lore.user?.login }} | {{ formatDate(lore.createdAt) }}
            </div>
          </div>
          <Poster
            :poster="lore.poster"
            :alt="lore.title"
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
          v-html="lore.text"
        ></div>
      </div>

      <!-- Actions -->
      <div class="flex flex-wrap gap-x-5 gap-y-2 mb-8">
        <NuxtLink
          to="/lore"
          class="text-beige hover:text-beige/80 hover:underline transition-colors focus:outline-none text-sm md:text-base"
        >
          К списку
        </NuxtLink>
        <NuxtLink
          v-if="canEdit"
          :to="`/lore/${lore.id}/edit`"
          class="text-beige hover:text-beige/80 hover:underline transition-colors focus:outline-none text-sm md:text-base"
        >
          Редактировать
        </NuxtLink>
        <button
          v-if="canEdit"
          type="button"
          class="text-reder hover:text-red hover:underline transition-colors focus:outline-none text-sm md:text-base"
          @click="deleteLore"
        >
          Удалить
        </button>
      </div>

      <!-- Comments section -->
      <CommentsSection 
        :content-type="'LORE'" 
        :content-id="loreId" 
      />
    </div>

    <EmptyState
      :show="!loading && !lore"
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
const loreId = Number(route.params.id);
const { contentTextStyle } = useFontSettings();

useHead({
  title: 'Просмотр лора - TheBook'
});

const loading = ref(true);
const lore = ref(null);
const showDeleteConfirm = ref(false);

const canEdit = computed(() => {
  if (!authStore.isAuthenticated) return false;
  if (authStore.isAdmin || authStore.isModerator) return true;
  return lore.value?.userId === authStore.user?.id;
});

const fetchLore = async () => {
  loading.value = true;
  try {
    const response = await api(`/lore/${loreId}`);
    if (response.success && response.data) {
      lore.value = response.data;
    }
  } catch (error) {
    console.error('Error fetching lore:', error);
    toast.error(getFetchErrorMessage(error, 'Не удалось загрузить элемент лора'));
  } finally {
    loading.value = false;
  }
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('ru-RU');
};

const deleteLore = () => {
  showDeleteConfirm.value = true;
};

const confirmDeleteLore = async () => {
  try {
    await api(`/lore/${loreId}`, { method: 'DELETE' });
    navigateTo('/lore');
  } catch (error) {
    console.error('Error deleting lore:', error);
  }
};

onMounted(() => {
  fetchLore();
});
</script>
