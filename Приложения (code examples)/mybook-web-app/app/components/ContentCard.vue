<template>
  <div class="content-card bg-black rounded-lg border border-beige/40 overflow-hidden hover:border-beige/80 transition-colors">
    <div class="p-4 md:p-6 pb-3 md:pb-4">
      <!-- Title + admin actions -->
      <div class="flex flex-col gap-3 mb-4">
        <h2 class="text-lg md:text-xl font-semibold text-gold/90 leading-snug">
          {{ item.title }}
        </h2>

        <div
          v-if="canEdit"
          class="flex flex-wrap gap-x-4 gap-y-2 -mx-1 px-1"
        >
          <button
            type="button"
            class="text-beige text-sm hover:text-white transition-colors focus:outline-none"
            @click="$emit('unpublish', item.id)"
          >
            Убрать из публикации
          </button>
          <button
            type="button"
            class="text-beige text-sm hover:text-white transition-colors focus:outline-none"
            @click="$emit('edit', item.id)"
          >
            Редактировать
          </button>
          <button
            v-if="showAddImageButton"
            type="button"
            class="text-beige text-sm hover:text-white transition-colors focus:outline-none"
            @click="$emit('addImage', item.id)"
          >
            Добавить изображение
          </button>
          <button
            type="button"
            class="text-reder text-sm hover:text-red transition-colors focus:outline-none"
            @click="$emit('delete', item.id)"
          >
            Удалить
          </button>
        </div>
      </div>

      <!-- Preview without poster -->
      <template v-if="type === 'stories' && !item.poster">
        <div
          class="story-prose text-white/90 text-sm md:text-base"
          :style="contentTextStyle"
          v-html="preview"
        ></div>
      </template>

      <!-- Preview with poster -->
      <div
        v-else
        class="flex flex-col gap-4 md:flex-row md:gap-6 md:items-start"
      >
        <Poster
          :poster="item.poster"
          :alt="item.title"
          size="sm"
          class="w-full md:w-auto md:self-start"
        />

        <div class="flex-1 min-w-0 w-full">
          <div
            class="story-prose text-white/90 text-sm md:text-base"
            :style="contentTextStyle"
            v-html="preview"
          ></div>
        </div>
      </div>
    </div>

    <!-- Footer: actions + meta -->
    <div class="flex flex-col gap-4 px-4 md:px-6 py-3 md:py-4 border-t border-white/5 sm:flex-row sm:justify-between sm:items-end">
      <div class="flex flex-wrap gap-x-5 gap-y-2">
        <button
          v-if="type === 'stories' || type === 'lore'"
          type="button"
          class="text-pink hover:text-pink/80 hover:underline transition-colors focus:outline-none text-sm"
          @click="$emit('read', item.id)"
        >
          Читать
        </button>
        <button
          v-else-if="type === 'notions'"
          type="button"
          class="text-pink hover:text-pink/80 hover:underline transition-colors focus:outline-none text-sm"
          @click="$emit('read', item.id)"
        >
          Смотреть
        </button>
        <button
          v-if="(type === 'notions' || type === 'lore') && (item.poster || (item.images && item.images.length > 0))"
          type="button"
          class="text-beige hover:text-beige/80 hover:underline transition-colors focus:outline-none text-sm"
          @click="$emit('viewGallery', item.id)"
        >
          Смотреть галерею
        </button>
      </div>

      <div class="text-on-surface-muted text-xs space-y-1 sm:text-right sm:space-y-0.5">
        <div v-if="typeLabel">{{ typeLabel }}</div>
        <div>Опубликовано: {{ item.user?.login }}</div>
        <div>Дата создания: {{ formatDate(item.createdAt) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useFontSettings } from '~/composables/useFontSettings';

const { contentTextStyle } = useFontSettings();

const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  type: {
    type: String,
    required: true,
    validator: (value) => ['stories', 'lore', 'notions'].includes(value)
  },
  preview: {
    type: String,
    required: true
  },
  canEdit: {
    type: Boolean,
    default: false
  }
});

defineEmits(['read', 'edit', 'unpublish', 'delete', 'addImage', 'viewGallery']);

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('ru-RU');
};

const showAddImageButton = computed(() => {
  return props.type === 'lore' || props.type === 'notions';
});

const typeLabel = computed(() => {
  if (props.type === 'stories') {
    const types = {
      STORY: 'История',
      ANNOUNCEMENT: 'Анонс'
    };
    return `Тип истории: ${types[props.item.type] || props.item.type}`;
  } else if (props.type === 'notions') {
    const types = {
      DEFINITION: 'Определение',
      CHARACTER: 'Персонаж',
      PLACE: 'Место',
      OBJECT: 'Объект',
      ENTITY: 'Сущность',
      EVENT: 'Событие'
    };
    return `Тип: ${types[props.item.type] || props.item.type}`;
  }
  return null;
});

</script>
