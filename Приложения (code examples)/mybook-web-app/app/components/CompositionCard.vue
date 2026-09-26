<template>
  <div class="composition-card bg-black rounded-lg border border-beige/40 overflow-hidden">
    <div class="p-6 pb-4">
      <div class="flex justify-between items-start gap-4 mb-4">
        <h2 class="text-xl font-semibold text-gold/90 leading-snug">
          {{ composition.title }}
        </h2>

        <div v-if="canEdit" class="flex flex-wrap justify-end gap-3 shrink-0">
          <button
            type="button"
            class="text-beige text-sm hover:text-white transition-colors focus:outline-none"
            @click="$emit('unpublish', composition.id)"
          >
            Убрать из публикации
          </button>
          <button
            type="button"
            class="text-beige text-sm hover:text-white transition-colors focus:outline-none"
            @click="$emit('edit', composition.id)"
          >
            Редактировать
          </button>
          <button
            type="button"
            class="text-reder text-sm hover:text-red transition-colors focus:outline-none"
            @click="$emit('delete', composition.id)"
          >
            Удалить
          </button>
        </div>
      </div>

      <div class="flex gap-6">
        <div class="flex-1 min-w-0">
          <p
            v-if="composition.description"
            class="text-white/90 mb-4 leading-relaxed"
            v-html="composition.description"
          ></p>

          <div v-if="composition.stories?.length" class="mb-0">
            <h3 class="text-gray-300 font-medium text-sm mb-2">Главы:</h3>
            <div class="space-y-1">
              <div
                v-for="story in composition.stories"
                :key="story.id"
                class="text-white/90 text-sm"
              >
                <button
                  type="button"
                  class="text-beige hover:text-white transition-colors focus:outline-none"
                  @click="$emit('readStory', story.id)"
                >
                  <span v-if="story.chapter">Глава {{ story.chapter }}.</span>
                  {{ story.title }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <Poster
          :poster="composition.poster"
          :alt="composition.title"
          size="sm"
        />
      </div>
    </div>

    <div class="flex justify-between items-end gap-4 px-6 py-4 border-t border-white/5">
      <button
        type="button"
        class="text-sm text-pink hover:text-pink/80 hover:underline transition-colors focus:outline-none"
        @click="$emit('view', composition.id)"
      >
        Список глав
      </button>

      <div class="text-right text-on-surface-muted text-xs space-y-0.5">
        <div>Тип: {{ compositionTypeLabel }}</div>
        <div>Опубликовано: {{ composition.user?.login }}</div>
        <div>Дата создания: {{ formatDate(composition.createdAt) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  composition: {
    type: Object,
    required: true
  },
  canEdit: {
    type: Boolean,
    default: false
  }
});

defineEmits(['view', 'edit', 'unpublish', 'delete', 'readStory']);

const compositionTypeLabel = computed(() => {
  return props.composition.type === 'BOOK' ? 'Книга' : 'Сборник глав';
});

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('ru-RU');
};

</script>
