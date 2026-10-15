<template>
  <div
      class="border rounded p-4 m-2 cursor-pointer transition-all"
      :class="{
      'bg-blue-100 border-blue-500': selected,
      'bg-gray-50 hover:bg-gray-100': !selected
    }"
      @click="$emit('select', item)"
  >
    <div class="text-sm text-gray-500">ID: {{ item.id }}</div>
    <div class="font-bold">{{ item.name }}</div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  item: {
    id: number
    name: string
  }
  selected: boolean
}>()

defineEmits<{
  (e: 'select', item: { id: number, name: string }): void
}>()
</script>