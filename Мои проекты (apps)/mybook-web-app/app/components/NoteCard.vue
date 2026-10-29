<template>
  <div class="note-card bg-black rounded-lg border border-beige/40 overflow-hidden flex flex-col h-full">
    <div class="p-6 pb-4 flex-1">
      <div class="flex justify-between items-start gap-3 mb-4">
        <h2 class="text-lg font-semibold text-gold/90 leading-snug flex-1 min-w-0">
          {{ note.title }}
        </h2>

        <div v-if="canEdit" class="flex gap-2 shrink-0">
          <button
            type="button"
            class="md-icon-button w-8 h-8 border border-beige/40 focus:outline-none"
            title="Редактировать"
            @click="$emit('edit', note.id)"
          >
            <Icon name="fa6-solid:pencil" class="w-3.5 h-3.5 text-beige" />
          </button>
          <button
            type="button"
            class="md-icon-button w-8 h-8 border border-beige/40 focus:outline-none hover:border-reder/60"
            title="Удалить"
            @click="$emit('delete', note.id)"
          >
            <Icon name="fa6-solid:trash" class="w-3.5 h-3.5 text-beige" />
          </button>
        </div>
      </div>

      <div
        class="story-prose text-white/90 text-sm"
        v-html="preview"
      ></div>
    </div>

    <div class="px-6 py-4 border-t border-white/5 space-y-3">
      <div class="flex justify-between items-center text-xs">
        <div class="text-pink">
          Важность: {{ note.importance }}
        </div>
        <div class="text-on-surface-muted">
          {{ note.isContent ? 'Платный контент' : 'Обычная заметка' }}
        </div>
      </div>

      <div v-if="note.isContent">
        <button
          type="button"
          class="w-full px-4 py-2 bg-gold text-black rounded hover:bg-golder transition-colors text-sm font-medium focus:outline-none"
          @click="$emit('buy', note.id)"
        >
          Купить за {{ note.price }} токенов
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  note: {
    type: Object,
    required: true
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

defineEmits(['edit', 'delete', 'buy']);
</script>
