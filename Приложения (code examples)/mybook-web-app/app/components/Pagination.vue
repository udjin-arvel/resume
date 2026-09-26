<template>
  <nav
    v-if="pagination && pagination.pages > 1"
    class="mt-8 flex justify-center"
    aria-label="Пагинация"
  >
    <div class="flex flex-wrap justify-center gap-2">
      <button
        v-for="page in pageNumbers"
        :key="page"
        type="button"
        class="md-pagination-btn"
        :class="page === pagination.page ? 'md-pagination-btn-active' : 'md-pagination-btn-inactive'"
        :aria-current="page === pagination.page ? 'page' : undefined"
        @click="selectPage(page)"
      >
        {{ page }}
      </button>
    </div>
  </nav>
</template>

<script setup>
const props = defineProps({
  pagination: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['page-change']);

const pageNumbers = computed(() => {
  if (!props.pagination?.pages) return [];
  return Array.from({ length: props.pagination.pages }, (_, index) => index + 1);
});

const selectPage = (page) => {
  if (page === props.pagination?.page) return;
  emit('page-change', page);
};
</script>
