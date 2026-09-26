<template>
  <div class="view-note-page">
    <!-- Delete Confirm Modal -->
    <ConfirmModal
      v-model="showDeleteConfirm"
      title="Удаление заметки"
      message="Удалить заметку? Это действие нельзя отменить."
      confirm-text="Удалить"
      cancel-text="Отмена"
      @confirm="confirmDeleteNote"
    />

    <Loading :loading="loading" />

    <div v-if="!loading && note">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex justify-between items-start mb-4">
          <div class="flex-1">
            <h1 class="text-3xl font-bold text-beige mb-2">{{ note.title }}</h1>
            <div class="text-gray-400 text-sm">
              {{ note.user?.login }} | Важность: {{ note.importance }} | {{ note.isContent ? 'Платный контент' : 'Обычная заметка' }} | {{ formatDate(note.createdAt) }}
            </div>
          </div>
          <Poster
            :poster="note.poster"
            :alt="note.title"
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
          v-html="note.text"
        ></div>
      </div>

      <!-- Actions -->
      <div class="flex flex-wrap gap-x-5 gap-y-2">
        <NuxtLink
          to="/notes"
          class="text-beige hover:text-beige/80 hover:underline transition-colors focus:outline-none text-sm md:text-base"
        >
          К списку
        </NuxtLink>
        <NuxtLink
          v-if="canEdit"
          :to="`/notes/${note.id}/edit`"
          class="text-beige hover:text-beige/80 hover:underline transition-colors focus:outline-none text-sm md:text-base"
        >
          Редактировать
        </NuxtLink>
        <button
          v-if="canEdit"
          type="button"
          class="text-reder hover:text-red hover:underline transition-colors focus:outline-none text-sm md:text-base"
          @click="deleteNote"
        >
          Удалить
        </button>
      </div>
    </div>

    <EmptyState
      :show="!loading && !note"
      title="Заметка не найдена"
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
const noteId = Number(route.params.id);
const { contentTextStyle } = useFontSettings();

useHead({
  title: 'Просмотр заметки - TheBook'
});

const loading = ref(true);
const note = ref(null);
const showDeleteConfirm = ref(false);

const canEdit = computed(() => {
  if (!authStore.isAuthenticated) return false;
  if (authStore.isAdmin || authStore.isModerator) return true;
  return note.value?.userId === authStore.user?.id;
});

const fetchNote = async () => {
  loading.value = true;
  try {
    const response = await api(`/notes/${noteId}`);
    if (response.success && response.data) {
      note.value = response.data;
    }
  } catch (error) {
    console.error('Error fetching note:', error);
    toast.error(getFetchErrorMessage(error, 'Не удалось загрузить заметку'));
  } finally {
    loading.value = false;
  }
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('ru-RU');
};

const deleteNote = () => {
  showDeleteConfirm.value = true;
};

const confirmDeleteNote = async () => {
  try {
    await api(`/notes/${noteId}`, { method: 'DELETE' });
    navigateTo('/notes');
  } catch (error) {
    console.error('Error deleting note:', error);
  }
};

onMounted(() => {
  fetchNote();
});
</script>
