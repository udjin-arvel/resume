<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        class="md-modal-root"
        @click.self="$emit('close')"
      >
        <div class="md-modal-overlay" />

        <div class="md-modal-panel">
          <div class="md-modal-header">
            <h3 class="md-modal-title">Быстрый словарь</h3>
            <button
              type="button"
              class="md-modal-close"
              @click="$emit('close')"
            >
              <Icon name="fa6-solid:xmark" class="w-5 h-5" />
            </button>
          </div>

          <div class="md-modal-body space-y-4">
            <div class="md-field">
              <label class="md-label" for="dictionary-search">Поиск понятия</label>
              <input
                id="dictionary-search"
                v-model="searchTerm"
                type="text"
                class="md-input"
                placeholder="Введите название понятия..."
                @input="searchNotions"
              >
            </div>

            <div v-if="searchResults.length > 0" class="max-h-64 overflow-y-auto space-y-2">
              <div
                v-for="notion in searchResults"
                :key="notion.id"
                class="md-modal-list-item"
                @click="selectNotion(notion)"
              >
                <h4 class="text-gold/90 font-medium text-sm">{{ notion.title }}</h4>
                <p class="text-white/80 text-sm mt-1 line-clamp-2">{{ notion.text.substring(0, 100) }}...</p>
                <span class="text-beige/70 text-xs mt-1 inline-block">{{ notion.type }}</span>
              </div>
            </div>

            <div v-else-if="searchTerm && !isLoading" class="text-on-surface-muted text-sm text-center py-6">
              Понятие не найдено
            </div>

            <div v-if="isLoading" class="text-beige/80 text-sm text-center py-6">
              Поиск...
            </div>
          </div>

          <div class="md-modal-footer">
            <button
              type="button"
              class="md-btn-text"
              @click="$emit('close')"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { useContentStore } from '~/stores/content';

const emit = defineEmits(['close', 'select']);
const contentStore = useContentStore();
const router = useRouter();

const searchTerm = ref('');
const searchResults = ref([]);
const isLoading = ref(false);

onMounted(async () => {
  if (contentStore.notions.length === 0) {
    await contentStore.fetchNotions({ limit: 100 });
  }
});

const searchNotions = () => {
  if (!searchTerm.value.trim()) {
    searchResults.value = [];
    return;
  }

  isLoading.value = true;

  const query = searchTerm.value.toLowerCase().trim();

  searchResults.value = contentStore.notions.filter(notion =>
    notion.title.toLowerCase().includes(query)
    || notion.text.toLowerCase().includes(query)
  );

  isLoading.value = false;
};

const selectNotion = (notion) => {
  emit('select', notion);
  emit('close');
  router.push(`/notions/${notion.id}`);
};
</script>
