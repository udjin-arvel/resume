<template>
  <div class="mb-4">
    <div class="flex justify-end">
      <button
        type="button"
        class="text-sm inline-flex items-center gap-1.5 text-beige hover:text-beige/80 hover:underline transition-colors focus:outline-none"
        @click="open = !open"
      >
        Фильтры
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="w-3.5 h-3.5 translate-y-[2px] transition-transform duration-200 ease-standard"
          :class="{ 'rotate-180': open }"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
    </div>

    <div
      v-show="open"
      id="filters"
      class="mt-4 p-5 bg-black border border-beige/40 rounded-lg"
    >
      <p class="md-section-title mb-5">Параметры поиска</p>

      <div :class="['grid gap-5', gridClass]">
        <slot />
      </div>

      <div class="flex flex-wrap gap-3 justify-end mt-6 pt-5 border-t border-white/5">
        <button
          type="button"
          class="md-btn-text"
          @click="emit('clear')"
        >
          Сбросить
        </button>
        <button
          type="button"
          class="md-btn-filled"
          @click="emit('apply')"
        >
          Применить
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  gridClass: {
    type: String,
    default: 'grid-cols-1 md:grid-cols-2'
  }
});

const emit = defineEmits(['apply', 'clear']);

const open = defineModel('open', { type: Boolean, default: false });
</script>
