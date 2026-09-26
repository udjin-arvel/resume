<template>
  <Dialog
    as="div"
    static
    :open="modelValue"
    class="relative z-50"
    @close="emit('update:modelValue', false)"
  >
    <div
      :class="[
        'fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity ease-in-out duration-500',
        modelValue ? 'opacity-100' : 'pointer-events-none opacity-0',
      ]"
    />

    <div
      :class="[
        'fixed inset-0 overflow-hidden',
        modelValue ? 'pointer-events-auto' : 'pointer-events-none',
      ]"
    >
      <div class="absolute inset-0 overflow-hidden">
        <div class="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
          <DialogPanel
            :class="[
              'pointer-events-auto relative w-screen max-w-full transform transition ease-in-out duration-500 sm:duration-700',
              modelValue ? 'translate-x-0' : 'translate-x-full',
              panelClass,
            ]"
          >
            <div class="flex h-full flex-col bg-white shadow-xl">
              <div class="px-4 py-5 sm:px-6 flex items-center justify-between border-b border-gray-200">
                <DialogTitle class="text-xl font-bold text-gray-900">
                  {{ title }}
                </DialogTitle>
                <button
                  type="button"
                  class="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  @click="emit('update:modelValue', false)"
                >
                  <span class="sr-only">{{ closeLabel }}</span>
                  <XMarkIcon
                    class="h-6 w-6"
                    aria-hidden="true"
                  />
                </button>
              </div>

              <slot name="before-body" />

              <div :class="['relative flex-1 overflow-y-auto px-4 py-6 sm:px-6', bodyClass]">
                <slot />
              </div>
            </div>
          </DialogPanel>
        </div>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/vue"
import { XMarkIcon } from "@heroicons/vue/24/solid"

withDefaults(defineProps<{
  modelValue: boolean
  title: string
  closeLabel?: string
  panelClass?: string
  bodyClass?: string
}>(), {
  closeLabel: "Close panel",
  panelClass: "md:max-w-2xl lg:max-w-3xl",
  bodyClass: "",
})

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void
}>()
</script>
