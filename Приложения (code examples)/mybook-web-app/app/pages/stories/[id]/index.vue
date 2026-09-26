<template>
  <div class="story-view-page">
    <!-- Delete Confirm Modal -->
    <ConfirmModal
      v-model="showDeleteConfirm"
      title="Удаление истории"
      message="Удалить историю? Это действие нельзя отменить."
      confirm-text="Удалить"
      cancel-text="Отмена"
      @confirm="confirmDeleteStory"
    />

    <FragmentContextMenu
      :visible="contextMenu.visible"
      :x="contextMenu.x"
      :y="contextMenu.y"
      @edit="openEditModal"
      @add-content="openContentModal"
      @close="closeContextMenu"
    />

    <FragmentEditModal
      v-model="showEditModal"
      :fragment-text="activeFragment?.text || ''"
      :saving="savingFragment"
      @save="saveFragmentText"
    />

    <FragmentContentViewModal
      v-model="showViewContentModal"
      :author-note="activeFragment?.authorNote || ''"
      :images="activeFragment?.images || []"
      :audios="activeFragment?.audios || []"
      :media-base-url="apiBase"
    />

    <FragmentContentModal
      v-model="showContentModal"
      :fragment-index="activeFragmentIndex"
      :initial-author-note="activeFragment?.authorNote || ''"
      @save="saveFragmentContent"
    />

    <Loading
      :loading="loading"
      title="Загрузка истории..."
    />

    <article v-if="!loading && story" class="space-y-6">
      <!-- Header -->
      <header class="space-y-4">
        <div class="space-y-2">
          <p
            v-if="story.composition && story.chapter"
            class="text-sm text-on-surface-muted mb-3"
          >
            {{ story.composition.title }} · Глава {{ story.chapter }}
          </p>
          <h1 class="text-2xl font-semibold text-gold/90 leading-snug">
            {{ story.title }}
          </h1>
          <div class="flex flex-wrap gap-x-3 gap-y-1 text-sm text-on-surface-muted">
            <span>{{ story.user?.login }}</span>
            <span aria-hidden="true">·</span>
            <span>{{ getStoryType(story.type) }}</span>
            <span aria-hidden="true">·</span>
            <span>{{ formatDate(story.createdAt) }}</span>
          </div>
        </div>

        <blockquote
          v-if="story.epigraph"
          class="p-4 bg-black border border-beige/40 border-l-4 border-l-beige/50 rounded-lg"
        >
          <p class="text-white/90 italic leading-relaxed" :style="contentTextStyle">
            {{ story.epigraph }}
          </p>
        </blockquote>
      </header>

      <!-- Story content -->
      <div class="story-fragments">
        <section
          v-for="fragment in story.fragments"
          :key="fragment.id"
          class="story-fragment relative"
          @contextmenu="handleFragmentContextMenu($event, fragment)"
        >
          <button
            v-if="fragmentHasExtraContent(fragment)"
            type="button"
            class="story-fragment-content-btn story-fragment-content-btn--icon"
            :aria-label="getFragmentContentAriaLabel(fragment)"
            @click="openViewContent(fragment)"
          >
            <Icon
              :name="getFragmentContentIconName(fragment)"
              class="story-fragment-content-icon"
            />
          </button>

          <div
            class="story-prose text-white/90"
            :style="contentTextStyle"
            v-html="fragment.text"
          ></div>

          <button
            v-if="fragmentHasExtraContent(fragment)"
            type="button"
            class="story-fragment-content-link"
            @click="openViewContent(fragment)"
          >
            (контент фрагмента)
          </button>
        </section>
      </div>

      <!-- Navigation -->
      <nav class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 py-2">
        <div class="flex flex-wrap gap-5">
          <button
            v-if="story.composition"
            type="button"
            class="text-beige hover:text-beige/80 hover:underline transition-colors focus:outline-none"
            @click="goToComposition(story.composition.id)"
          >
            К списку
          </button>
          <button
            v-if="canEditStory(story)"
            type="button"
            class="text-beige hover:text-beige/80 hover:underline transition-colors focus:outline-none"
            @click="editStory(story.id)"
          >
            Редактировать
          </button>
          <button
            v-if="canEditStory(story)"
            type="button"
            class="text-reder hover:text-red transition-colors focus:outline-none"
            @click="deleteStory(story.id)"
          >
            Удалить
          </button>
        </div>

        <div class="flex flex-wrap gap-5 sm:justify-end">
          <button
            v-if="previousChapter"
            type="button"
            class="text-beige hover:text-beige/80 hover:underline transition-colors focus:outline-none"
            @click="readStory(previousChapter.id)"
          >
            Предыдущая глава
          </button>
          <button
            v-if="nextChapter"
            type="button"
            class="text-beige hover:text-beige/80 hover:underline transition-colors focus:outline-none"
            @click="readStory(nextChapter.id)"
          >
            Следующая глава
          </button>
        </div>
      </nav>

      <!-- Comments -->
      <CommentsSection
        content-type="STORY"
        :content-id="storyId"
      />
    </article>

    <EmptyState
      :show="!loading && !story"
      title="История не найдена"
      variant="error"
    />
  </div>
</template>

<script setup>
import { useFontSettings } from '~/composables/useFontSettings';
import { useFragmentMediaUpload } from '~/composables/useFragmentMediaUpload';
import {
  fragmentHasExtraContent,
  getFragmentContentIconName
} from '~/utils/fragmentMedia';

const route = useRoute();
const { api, apiFormData } = useApi();
const { uploadSingleFragmentMedia } = useFragmentMediaUpload();
const config = useRuntimeConfig();
const authStore = useAuthStore();
const toast = useToast();
const storyId = Number(route.params.id);
const { contentTextStyle } = useFontSettings();
const apiBase = config.public.apiBase || 'http://localhost:3001';

const getFragmentContentAriaLabel = (fragment) => {
  const parts = [];
  if (fragment.authorNote?.trim()) parts.push('примечание');
  if (fragment.images?.length) parts.push('изображение');
  if (fragment.audios?.length) parts.push('аудио');
  return `Контент фрагмента: ${parts.join(', ')}`;
};

useHead({
  title: 'Чтение истории - TheBook',
  meta: [
    { name: 'description', content: 'Читайте увлекательные истории на платформе TheBook' }
  ]
});

const loading = ref(true);
const story = ref(null);
const previousChapter = ref(null);
const nextChapter = ref(null);
const showDeleteConfirm = ref(false);
const storyToDelete = ref(null);
const contextMenu = ref({ visible: false, x: 0, y: 0 });
const activeFragment = ref(null);
const activeFragmentIndex = ref(-1);
const showEditModal = ref(false);
const showContentModal = ref(false);
const showViewContentModal = ref(false);
const savingFragment = ref(false);

const replaceFragmentInStory = (fragmentId, updatedFragment) => {
  if (!story.value?.fragments) return;

  const index = story.value.fragments.findIndex((fragment) => fragment.id === fragmentId);
  if (index === -1) return;

  story.value.fragments[index] = {
    ...story.value.fragments[index],
    ...updatedFragment
  };
};

const refreshFragment = async (fragmentId) => {
  const response = await api(`/fragments/${fragmentId}`);
  if (response.success && response.data) {
    replaceFragmentInStory(fragmentId, response.data);
  }
};

const openFragmentMenu = (event, fragment) => {
  activeFragment.value = fragment;
  activeFragmentIndex.value = story.value.fragments.findIndex((item) => item.id === fragment.id);
  contextMenu.value = {
    visible: true,
    x: event.clientX,
    y: event.clientY
  };
};

const handleFragmentContextMenu = (event, fragment) => {
  if (!canEditStory(story.value)) return;
  event.preventDefault();
  openFragmentMenu(event, fragment);
};

const closeContextMenu = () => {
  contextMenu.value.visible = false;
};

const openEditModal = () => {
  closeContextMenu();
  showEditModal.value = true;
};

const openContentModal = () => {
  closeContextMenu();
  showContentModal.value = true;
};

const openViewContent = (fragment) => {
  activeFragment.value = fragment;
  activeFragmentIndex.value = story.value.fragments.findIndex((item) => item.id === fragment.id);
  showViewContentModal.value = true;
};

const saveFragmentText = async (text) => {
  if (!activeFragment.value) return;

  savingFragment.value = true;
  try {
    const response = await api(`/fragments/${activeFragment.value.id}`, {
      method: 'PUT',
      body: { text }
    });

    if (response.success && response.data) {
      replaceFragmentInStory(activeFragment.value.id, response.data);
      showEditModal.value = false;
      toast.success('Фрагмент обновлён');
    }
  } catch (error) {
    console.error('Error updating fragment:', error);
    toast.error(getFetchErrorMessage(error, 'Не удалось сохранить фрагмент'));
  } finally {
    savingFragment.value = false;
  }
};

const saveFragmentContent = async (data) => {
  if (!activeFragment.value) return;

  savingFragment.value = true;
  let authorNoteSaved = false;

  try {
    const response = await api(`/fragments/${activeFragment.value.id}`, {
      method: 'PUT',
      body: { authorNote: data.authorNote }
    });

    if (response.success && response.data) {
      replaceFragmentInStory(activeFragment.value.id, response.data);
      authorNoteSaved = true;
    }

    if (data.file) {
      try {
        await uploadSingleFragmentMedia(apiFormData, activeFragment.value.id, data.file);
        await refreshFragment(activeFragment.value.id);
      } catch (uploadError) {
        console.error('Error uploading fragment media:', uploadError);
        if (authorNoteSaved) {
          toast.error('Примечание сохранено, но файл загрузить не удалось');
        } else {
          toast.error(getFetchErrorMessage(uploadError, 'Не удалось загрузить файл'));
        }
        return;
      }
    }

    toast.success('Контент фрагмента обновлён');
  } catch (error) {
    console.error('Error saving fragment content:', error);
    toast.error(getFetchErrorMessage(error, 'Не удалось сохранить контент фрагмента'));
  } finally {
    savingFragment.value = false;
  }
};

const fetchStory = async () => {
  loading.value = true;
  try {
    const response = await api(`/stories/${storyId}`);

    if (response.success && response.data) {
      story.value = response.data;

      if (story.value.compositionId && story.value.chapter) {
        await loadAdjacentChapters();
      }
    }
  } catch (error) {
    console.error('Error fetching story:', error);
    toast.error(getFetchErrorMessage(error, 'Не удалось загрузить историю'));
  } finally {
    loading.value = false;
  }
};

const loadAdjacentChapters = async () => {
  try {
    const response = await api('/stories', {
      query: {
        compositionId: story.value.compositionId,
        limit: 100
      }
    });

    if (response.success && response.data?.data) {
      const allStories = response.data.data.sort((a, b) => (a.chapter || 0) - (b.chapter || 0));
      const currentIndex = allStories.findIndex(s => s.id === storyId);

      if (currentIndex > 0) {
        previousChapter.value = allStories[currentIndex - 1];
      }
      if (currentIndex < allStories.length - 1) {
        nextChapter.value = allStories[currentIndex + 1];
      }
    }
  } catch (error) {
    console.error('Error loading adjacent chapters:', error);
  }
};

const getStoryType = (type) => {
  return type === 'STORY' ? 'История' : 'Анонс';
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('ru-RU');
};

const canEditStory = (storyData) => {
  if (!authStore.isAuthenticated) return false;
  if (authStore.isAdmin || authStore.isModerator) return true;
  return storyData.userId === authStore.user?.id;
};

const goToComposition = (compositionId) => {
  navigateTo(`/compositions/${compositionId}`);
};

const editStory = (id) => {
  navigateTo(`/stories/${id}/edit`);
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
    navigateTo('/stories');
  } catch (error) {
    console.error('Error deleting story:', error);
  } finally {
    storyToDelete.value = null;
  }
};

const readStory = (id) => {
  navigateTo(`/stories/${id}`);
};

onMounted(() => {
  fetchStory();
});
</script>

<style scoped>
.story-fragment-content-btn--icon {
  position: absolute;
  right: -48px;
  top: 0.2em;
  display: none;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 9999px;
  border: 1px solid rgba(221, 176, 137, 0.35);
  background: rgba(26, 26, 26, 0.95);
  color: rgba(221, 176, 137, 0.9);
  transition: color 0.2s ease, border-color 0.2s ease, background-color 0.2s ease;
}

.story-fragment-content-icon {
  width: 0.875rem;
  height: 0.875rem;
  flex-shrink: 0;
}

.story-fragment-content-btn--icon:hover {
  color: #fff;
  border-color: rgba(221, 176, 137, 0.65);
  background: rgba(36, 36, 36, 0.98);
}

.story-fragment-content-btn--icon:focus {
  outline: none;
}

.story-fragment-content-btn--icon:focus-visible {
  box-shadow: 0 0 0 2px rgba(221, 176, 137, 0.45);
}

.story-fragment-content-link {
  display: inline-block;
  margin-top: 0.35rem;
  padding: 0;
  border: none;
  background: none;
  font-size: 0.75rem;
  line-height: 1.4;
  color: rgba(255, 255, 255, 0.35);
  transition: color 0.2s ease;
}

.story-fragment-content-link:hover {
  color: rgba(221, 176, 137, 0.55);
}

.story-fragment-content-link:focus {
  outline: none;
}

.story-fragment-content-link:focus-visible {
  color: rgba(221, 176, 137, 0.65);
}

@media (min-width: 1180px) {
  .story-fragment-content-btn--icon {
    display: flex;
  }

  .story-fragment-content-link {
    display: none;
  }
}
</style>
