<template>
  <div
    :class="[$style.wrapper, isInvalid && $style.wrapperIsInvalid]"
    @drop.prevent="change($event.dataTransfer?.files)"
  >
    <div :class="$style.spacer">
      <svg
        :class="$style.icon"
        stroke="currentColor"
        fill="none"
        viewBox="0 0 48 48"
        aria-hidden="true"
      >
        <path
          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      <div :class="$style.text">
        <label
          :for="uuid"
          :class="$style.label"
        >
          <span>{{ t("files.upload_file") }}</span>
          <input
            :id="uuid"
            :name="name"
            type="file"
            :accept="accept"
            class="sr-only"
            :disabled="disabled"
            :multiple="multiple"
            @change="change(($event.target as HTMLInputElement)?.files)"
          >
        </label>
        <p class="pl-1">
          {{ t("files.or_drag_and_drop") }}
        </p>
      </div>
      <p :class="$style.restrictions">
        {{ accept.toUpperCase() }} {{ t("files.up_to") }} {{ uploadMaxFilesize }}
      </p>
    </div>
  </div>
  <p
    v-if="isInvalid"
    :class="$style.invalidMessage"
  >
    <slot name="invalid-message">
      {{ invalidMessage }}
    </slot>
  </p>
  <ul
    role="list"
    :class="$style.listImage"
  >
    <li
      v-for="(file, k) in imagesPreview"
      :key="k"
      :class="$style.listImageItem"
    >
      <div :class="$style.listImageWrap">
        <img
          :src="file"
          :alt="images[k].name"
          :class="$style.listImageImg"
        >
      </div>
      <div :class="$style.trashWrap">
        <TrashIcon
          :class="$style.trashIcon"
          @click="deleteImage(k)"
        />
      </div>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { TrashIcon } from "@heroicons/vue/24/outline"

interface Props {
  id?: string
  name?: string
  multiple?: boolean
  disabled?: boolean
  maxFiles?: number
  accept: string
  invalidMessage?: string
  modelValue: Array<File>
  uploadMaxFilesize: string
}
const props = withDefaults(defineProps<Props>(), {
  id: undefined,
  multiple: false,
  disabled: false,
  name: "files",
  maxFiles: 10,
  invalidMessage: undefined,
})

const { t } = useI18n()
const images = ref<Array<File>>([])
const imagesPreview = ref<string[]>([])
const notificationsStore = useNotificationsStore()
const uploadMaxFilesizeMb: number = Number(props.uploadMaxFilesize.replace(/[^0-9]/g, ""))

const { uuid, isInvalid } = useFormElements(props)
const emit = defineEmits(["update:modelValue"])

const change = (value?: FileList | null) => {
  if (!value) {
    return
  }
  const filesUpload = Array.from(value) as File[]

  if (images.value.length + filesUpload.length > props.maxFiles) {
    notificationsStore.warningNotify(t("files.limit_is_max", { n: Number(props.maxFiles) }))
    return
  }

  filesUpload.forEach((file: File) => {
    if (file.size === 0) {
      notificationsStore.warningNotify(t("files.no_added_files_size_empty", { name: file.name }))
      return
    }

    if (file.size / 1024 / 1024 > uploadMaxFilesizeMb) {
      notificationsStore.warningNotify(
        t("files.no_added_files_wrong_size", {
          name: file.name,
          n: uploadMaxFilesizeMb,
        }),
      )
      return
    }
    images.value.push(file)
  })

  previewImages()
}
const previewImages = () => {
  const readers: any = []
  if (images.value.length === 0) {
    imagesPreview.value = []
    return
  }

  for (let i = 0; i < images.value.length; i++) {
    readers.push(fileToBase64(images.value[i]))
  }
  Promise.all(readers).then((values: string[]) => {
    imagesPreview.value = values
  })
}

const deleteImage = (index: number) => {
  images.value = images.value.filter((_, i) => i !== index)
  imagesPreview.value = imagesPreview.value.filter((_, i) => i !== index)
}

watch(
  () => props.modelValue,
  (newValue) => {
    images.value = newValue
    previewImages()
  },
  { immediate: true },
)
watch(
  images,
  (newValue) => {
    emit("update:modelValue", newValue)
  },
  { immediate: true },
)

const preventDefaults = (e: Event) => e.preventDefault()
const events = ["dragenter", "dragover", "dragleave", "drop"]

onMounted(() => {
  events.forEach(event => document.body.addEventListener(event, preventDefaults))
})
onUnmounted(() => {
  events.forEach(event => document.body.removeEventListener(event, preventDefaults))
})
</script>

<script lang="ts">
export default {
  inheritAttrs: false,
}
</script>

<style module>
.wrapper {
  @apply flex justify-center rounded-md border-2 border-dashed border-gray-300 px-6 pt-5 pb-6;
}
.wrapperIsInvalid {
  @apply border-red-600;
}
.spacer {
  @apply space-y-1 text-center;
}
.icon {
  @apply mx-auto h-12 w-12 text-gray-400;
}
.text {
  @apply flex text-sm text-gray-600 justify-center;
}
.label {
  @apply relative cursor-pointer rounded-md bg-white font-medium text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-primary-600 focus-within:ring-offset-2 hover:text-primary-600;
}
.restrictions {
  @apply text-xs text-gray-500;
}
.listImage {
  @apply grid grid-cols-2 gap-x-4 gap-y-4 mt-4 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4 xl:gap-x-4;
}
.listImageItem {
  @apply relative;
}
.listImageWrap {
  @apply aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-md bg-gray-200 lg:aspect-none group-hover:opacity-75 lg:h-32;
}
.listImageImg {
  @apply h-full w-full object-cover object-center lg:h-full lg:w-full;
}
.trashWrap {
  @apply cursor-pointer absolute left-1 top-1 z-10 flex items-center justify-center rounded-full bg-white p-1 text-black;
}
.trashIcon {
  @apply h-5 w-5;
}
.invalidMessage {
  @apply mt-2 text-sm text-red-600;
}
</style>
