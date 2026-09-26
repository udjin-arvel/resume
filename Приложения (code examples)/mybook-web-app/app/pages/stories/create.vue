<template>
  <div class="md-form-page">
    <header class="md-page-header">
      <div>
        <h1 class="md-page-title">
          {{ isEditing ? 'Редактирование истории' : 'Создание истории' }}
        </h1>
        <p class="md-page-subtitle">
          {{ isEditing ? 'Измените фрагменты и метаданные истории' : 'Напишите текст и заполните информацию об истории' }}
        </p>
      </div>
      <button
        type="button"
        class="md-link-primary shrink-0"
        :disabled="saving"
        @click="saveStory"
      >
        <Icon v-if="saving" name="fa6-solid:spinner" class="w-4 h-4 animate-spin" />
        {{ saving ? 'Сохранение...' : 'Сохранить' }}
      </button>
    </header>

    <nav class="md-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        :class="['md-tab', activeTab === tab.id && 'md-tab-active']"
        @click="activeTab = tab.id"
      >
        {{ tab.name }}
      </button>
    </nav>

    <section class="md-form-card">
      <div class="md-form-card-body">
        <!-- Fragments tab -->
        <div v-if="activeTab === 'fragments'" class="space-y-6">
          <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <p class="md-section-title mb-0">Фрагменты</p>
            <div class="flex flex-wrap gap-4">
              <button
                v-if="selectedFragmentIndex === -1"
                type="button"
                class="md-link-primary"
                @click="addFragment"
              >
                Добавить
              </button>
              <button
                v-else
                type="button"
                class="md-link-primary"
                @click="saveFragment"
              >
                Сохранить
              </button>
              <button
                type="button"
                class="md-link-secondary"
                @click="clearEditor"
              >
                Отмена
              </button>
            </div>
          </div>

          <div class="space-y-3">
            <div
              v-for="(fragment, index) in story.fragments"
              :key="fragment.id ?? fragment.key ?? index"
              :class="['md-list-card', selectedFragmentIndex === index && 'md-list-card-active']"
              @click="selectFragment(index)"
            >
              <div class="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                <span class="text-beige font-medium text-sm">Фрагмент {{ index + 1 }}</span>
                <div class="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  <button
                    type="button"
                    class="text-beige hover:text-white transition-colors focus:outline-none"
                    @click.stop="addContent(index)"
                  >
                    Добавить контент
                  </button>
                  <button
                    type="button"
                    class="text-beige hover:text-white transition-colors focus:outline-none"
                    @click.stop="editFragment(index)"
                  >
                    Редактировать
                  </button>
                  <button
                    type="button"
                    class="text-pink hover:text-red-400 transition-colors focus:outline-none"
                    @click.stop="deleteFragment(index)"
                  >
                    Удалить
                  </button>
                </div>
              </div>
              <p class="text-white/90 text-sm leading-relaxed">
                {{ fragment.text.length > 100 ? fragment.text.substring(0, 100) + '...' : fragment.text }}
              </p>
              <p
                v-if="getFragmentContentLabel(fragment)"
                class="text-xs text-on-surface-muted mt-2"
              >
                {{ getFragmentContentLabel(fragment) }}
              </p>
            </div>
          </div>

          <div class="border-t border-white/5 pt-6">
            <p class="md-section-title mb-4">Редактор текста</p>
            <Editor
              v-model="editorContent"
              placeholder="Начните писать..."
            />
            <p class="md-hint mt-2">Рекомендуемый размер фрагмента: 500–1000 символов</p>
          </div>
        </div>

        <!-- General info tab -->
        <div v-if="activeTab === 'general'" class="space-y-5">
          <p class="md-section-title mb-0">Общая информация</p>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div class="md-field">
              <label class="md-label" for="story-title">Заголовок</label>
              <input
                id="story-title"
                v-model="story.title"
                type="text"
                class="md-input"
                placeholder="Название истории"
              >
            </div>

            <div class="md-field">
              <label class="md-label" for="story-type">Тип истории</label>
              <select
                id="story-type"
                v-model="story.type"
                class="md-select"
              >
                <option value="STORY">История</option>
                <option value="ANNOUNCEMENT">Анонс</option>
              </select>
            </div>

            <div class="md-field md:col-span-2">
              <label class="md-label" for="story-epigraph">Эпиграф</label>
              <textarea
                id="story-epigraph"
                v-model="story.epigraph"
                class="md-input resize-none"
                rows="3"
                placeholder="Эпиграф к истории (необязательно)"
              />
            </div>

            <div class="md-field">
              <label class="md-label" for="story-composition">Композиция</label>
              <select
                id="story-composition"
                v-model="story.compositionId"
                class="md-select"
              >
                <option value="">Без композиции</option>
                <option v-for="comp in compositions" :key="comp.id" :value="comp.id">
                  {{ comp.title }}
                </option>
              </select>
            </div>

            <div v-if="story.compositionId" class="md-field">
              <label class="md-label" for="story-chapter">Номер главы</label>
              <input
                id="story-chapter"
                v-model="story.chapter"
                type="number"
                min="1"
                class="md-input"
                placeholder="1"
              >
            </div>
          </div>
        </div>

        <!-- Names tab -->
        <div v-if="activeTab === 'names'" class="space-y-5">
          <p class="md-section-title mb-0">Имена и названия</p>

          <div class="flex gap-2">
            <input
              v-model="newName"
              type="text"
              class="md-input flex-1"
              placeholder="Добавить имя или название"
              @keyup.enter="addName"
            >
            <button
              type="button"
              :disabled="!newName.trim()"
              class="md-link-primary shrink-0"
              @click="addName"
            >
              Добавить
            </button>
          </div>

          <div class="flex flex-wrap gap-2">
            <div
              v-for="(name, index) in story.notes"
              :key="index"
              class="md-chip"
              @click="editName(index)"
            >
              <span>{{ name }}</span>
              <button
                type="button"
                class="text-pink hover:text-red transition-colors focus:outline-none"
                @click.stop="removeName(index)"
              >
                <Icon name="fa6-solid:xmark" class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <FragmentContentModal
      v-model="showContentModal"
      :fragment-index="contentModalFragmentIndex"
      @save="saveFragmentContent"
    />

    <ConfirmModal
      v-model="showConfirmModal"
      :title="confirmModalTitle"
      :message="confirmModalMessage"
      @confirm="onConfirmAction"
      @cancel="onCancelAction"
    />

    <MessageModal
      v-model="showMessageModal"
      :title="messageModalTitle"
      :message="messageModalMessage"
      :type="messageModalType"
    />
  </div>
</template>

<script setup>
import { useFragmentMediaUpload } from '~/composables/useFragmentMediaUpload';

// SEO
useHead({
  title: 'Создание истории - TheBook',
  meta: [
    { name: 'description', content: 'Создайте новую историю на платформе TheBook' }
  ]
});

const route = useRoute();
const { api, apiFormData } = useApi();
const { getFragmentContentLabel, uploadFragmentMedia, buildStoryFragmentsPayload } = useFragmentMediaUpload();
const isEditing = computed(() => route.params.id !== undefined);

const activeTab = ref('fragments');
const saving = ref(false);
const selectedFragmentIndex = ref(-1);
const editorContent = ref('');
const newName = ref('');
const showContentModal = ref(false);
const contentModalFragmentIndex = ref(-1);
const loadingCompositions = ref(false);

// Confirm Modal
const showConfirmModal = ref(false);
const confirmModalTitle = ref('');
const confirmModalMessage = ref('');
const confirmAction = ref(null);

// Message Modal
const showMessageModal = ref(false);
const messageModalTitle = ref('');
const messageModalMessage = ref('');
const messageModalType = ref('info');

const showConfirm = (title, message) => {
  return new Promise((resolve) => {
    confirmModalTitle.value = title;
    confirmModalMessage.value = message;
    confirmAction.value = resolve;
    showConfirmModal.value = true;
  });
};

const onConfirmAction = () => {
  if (confirmAction.value) {
    confirmAction.value(true);
    confirmAction.value = null;
  }
};

const onCancelAction = () => {
  if (confirmAction.value) {
    confirmAction.value(false);
    confirmAction.value = null;
  }
};

const showMessage = (title, message, type = 'info') => {
  messageModalTitle.value = title;
  messageModalMessage.value = message;
  messageModalType.value = type;
  showMessageModal.value = true;
};

const tabs = [
  { id: 'fragments', name: 'Фрагменты' },
  { id: 'general', name: 'Общая информация' },
  { id: 'names', name: 'Имена и названия' }
];

const story = ref({
  title: '',
  type: 'STORY',
  epigraph: '',
  compositionId: '',
  chapter: null,
  fragments: [],
  notes: []
});

const compositions = ref([]);

const addFragment = () => {
  if (!editorContent.value.trim()) return;

  const text = editorContent.value.replace(/<[^>]*>/g, '');
  const fragments = splitTextIntoFragments(text);

  fragments.forEach(fragment => {
    story.value.fragments.push({
      key: `${Date.now()}-${Math.random()}`,
      text: fragment,
      order: story.value.fragments.length + 1
    });
  });

  clearEditor();
};

const splitTextIntoFragments = (text) => {
  const fragments = [];
  const sentences = text.split(/(?<=[.!?])\s+/);
  let currentFragment = '';

  for (const sentence of sentences) {
    if ((currentFragment + sentence).length > 1000) {
      if (currentFragment) {
        fragments.push(currentFragment.trim());
        currentFragment = sentence;
      } else {
        fragments.push(sentence);
      }
    } else {
      currentFragment += (currentFragment ? ' ' : '') + sentence;
    }
  }

  if (currentFragment) {
    fragments.push(currentFragment.trim());
  }

  return fragments;
};

const clearEditor = () => {
  editorContent.value = '';
  selectedFragmentIndex.value = -1;
};

const selectFragment = (index) => {
  selectedFragmentIndex.value = index;
  editorContent.value = story.value.fragments[index].text;
};

const editFragment = (index) => {
  selectFragment(index);
};

const saveFragment = () => {
  if (selectedFragmentIndex.value === -1) return;
  if (!editorContent.value.trim()) return;

  const text = editorContent.value.replace(/<[^>]*>/g, '');
  story.value.fragments[selectedFragmentIndex.value].text = text;
  clearEditor();
};

const deleteFragment = async (index) => {
  const confirmed = await showConfirm('Удаление фрагмента', 'Вы уверены, что хотите удалить этот фрагмент?');
  if (confirmed) {
    story.value.fragments.splice(index, 1);
    story.value.fragments.forEach((fragment, i) => {
      fragment.order = i + 1;
    });
    clearEditor();
  }
};

const addContent = (index) => {
  contentModalFragmentIndex.value = index;
  showContentModal.value = true;
};

const saveFragmentContent = (data) => {
  const fragment = story.value.fragments[data.fragmentIndex];
  if (fragment) {
    if (data.file) {
      fragment.pendingFile = data.file;
    }
    fragment.authorNote = data.authorNote;
  }
};

const addName = () => {
  if (!newName.value.trim()) return;
  story.value.notes.push(newName.value.trim());
  newName.value = '';
};

const editName = (index) => {
  const newValue = prompt('Редактировать название:', story.value.notes[index]);
  if (newValue !== null) {
    story.value.notes[index] = newValue.trim();
  }
};

const removeName = (index) => {
  story.value.notes.splice(index, 1);
};

const saveStory = async () => {
  if (!story.value.title.trim()) {
    showMessage('Ошибка', 'Заполните заголовок истории', 'warning');
    return;
  }

  if (story.value.fragments.length === 0) {
    showMessage('Ошибка', 'Добавьте хотя бы один фрагмент', 'warning');
    return;
  }

  saving.value = true;
  try {
    const storyData = {
      title: story.value.title,
      type: story.value.type,
      epigraph: story.value.epigraph || undefined,
      compositionId: story.value.compositionId ? Number(story.value.compositionId) : undefined,
      chapter: story.value.chapter ? Number(story.value.chapter) : undefined,
      notes: story.value.notes.length > 0 ? story.value.notes : undefined,
      fragments: buildStoryFragmentsPayload(story.value.fragments)
    };

    let response;
    if (isEditing.value) {
      response = await api(`/stories/${route.params.id}`, {
        method: 'PUT',
        body: storyData
      });
    } else {
      response = await api('/stories', {
        method: 'POST',
        body: storyData
      });
    }

    if (response.success && response.data?.fragments) {
      try {
        await uploadFragmentMedia(apiFormData, story.value.fragments, response.data.fragments);
      } catch (uploadError) {
        console.error('Error uploading fragment media:', uploadError);
        showMessage('Предупреждение', 'История сохранена, но не все файлы удалось загрузить', 'warning');
        return;
      }
    }

    showMessage('Успех', isEditing.value ? 'История успешно обновлена' : 'История успешно создана', 'success');

    setTimeout(() => {
      navigateTo('/stories');
    }, 1000);
  } catch (error) {
    console.error('Error saving story:', error);
    showMessage('Ошибка', error.data?.error || 'Не удалось сохранить историю', 'error');
  } finally {
    saving.value = false;
  }
};

const fetchCompositions = async () => {
  loadingCompositions.value = true;
  try {
    const response = await api('/compositions');
    if (response.success && response.data?.data) {
      compositions.value = response.data.data;
    }
  } catch (error) {
    console.error('Error fetching compositions:', error);
  } finally {
    loadingCompositions.value = false;
  }
};

const loadStory = async () => {
  try {
    const response = await api(`/stories/${route.params.id}`);
    if (response.success && response.data) {
      const storyData = response.data;
      story.value = {
        title: storyData.title,
        type: storyData.type,
        epigraph: storyData.epigraph || '',
        compositionId: storyData.compositionId || '',
        chapter: storyData.chapter,
        fragments: storyData.fragments || [],
        notes: storyData.notes ? JSON.parse(storyData.notes) : []
      };
    }
  } catch (error) {
    console.error('Error loading story:', error);
    showMessage('Ошибка', 'Не удалось загрузить историю', 'error');
  }
};

onMounted(async () => {
  await fetchCompositions();

  if (isEditing.value) {
    await loadStory();
  }
});
</script>
