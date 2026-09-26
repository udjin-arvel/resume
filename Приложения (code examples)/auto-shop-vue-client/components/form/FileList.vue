<template>
  <div class="mt-4">
    <h3 class="text-lg font-semibold">
      {{ title }}
    </h3>
    <p
      v-if="!files.length"
      class="text-gray-500"
    >
      {{ noFilesMessage }} ({{ files.length }})
    </p>
    <ul
      v-else
      class="mt-2 flex flex-col gap-y-2"
    >
      <li
        v-for="file in files"
        :key="file.id"
        class="flex items-center justify-between"
      >
        <a
          :href="file.url"
          :target="isPublic ? '_blank' : undefined"
          class="text-blue-600 hover:underline flex items-center gap-2"
          :class="{ 'opacity-50 pointer-events-none': downloadingFile === file.id }"
          @click.prevent="isPublic ? null : $emit('download', file)"
        >
          <img
            v-if="file.show_url || (isPublic && file.mime_type.startsWith('image/'))"
            :src="file.show_url || file.url"
            :alt="file.name"
            class="h-8 w-8 object-cover rounded"
          >
          <span>{{ file.name }}</span>
          <span
            v-if="downloadingFile === file.id"
            class="ml-2"
          >{{ t('downloading') }}</span>
        </a>
        <div :class="$style.trashWrap">
          <TrashIcon
            :class="$style.trashIcon"
            @click="$emit('delete', file.id)"
          />
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { TrashIcon } from "@heroicons/vue/24/outline"
import { useI18n } from "vue-i18n"
import type { FileResponse } from "~/types/form/file"

defineProps<{
  files: FileResponse[]
  title: string
  noFilesMessage: string
  downloadingFile?: number | null
  isPublic?: boolean
}>()

defineEmits<{
  (e: "delete", id: number): void
  (e: "download", file: FileResponse): void
}>()
const { t } = useI18n()
</script>

<style module>
.trashWrap {
  @apply cursor-pointer flex items-center justify-center rounded-full bg-white p-1 text-black;
}
.trashIcon {
  @apply h-5 w-5;
}
</style>
