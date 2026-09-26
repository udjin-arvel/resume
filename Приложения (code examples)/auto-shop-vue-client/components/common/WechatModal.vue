<template>
  <a
    href="#"
    class="cursor-pointer"
    v-bind="$attrs"
    @click.prevent="isOpen = true"
  >
    <slot />
  </a>

  <ClientOnly>
    <TransitionRoot
      appear
      :show="isOpen"
      as="template"
    >
      <Dialog
        as="div"
        class="relative z-[100]"
        @close="closeModal"
      >
        <TransitionChild
          as="template"
          enter="duration-300 ease-out"
          enter-from="opacity-0"
          enter-to="opacity-100"
          leave="duration-200 ease-in"
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </TransitionChild>

        <div class="fixed inset-0 overflow-y-auto">
          <div class="flex min-h-full items-center justify-center p-4 text-center">
            <TransitionChild
              as="template"
              enter="duration-300 ease-out"
              enter-from="opacity-0 scale-95"
              enter-to="opacity-100 scale-100"
              leave="duration-200 ease-in"
              leave-from="opacity-100 scale-100"
              leave-to="opacity-0 scale-95"
            >
              <DialogPanel class="w-full max-w-md transform overflow-hidden rounded-[1.25rem] bg-white p-[3rem_2rem_2.5rem] text-center align-middle shadow-2xl transition-all relative">
                <button
                  type="button"
                  class="absolute right-[1rem] top-[1rem] flex h-[2.5rem] w-[2.5rem] items-center justify-center rounded-full bg-gray-100 text-[1.25rem] text-gray-500 transition-colors hover:bg-gray-200 border-none cursor-pointer"
                  @click="closeModal"
                >
                  ✕
                </button>

                <DialogTitle
                  as="h3"
                  class="mb-[1.5rem] text-[1.5rem] font-bold text-black leading-tight"
                >
                  Отсканируйте QR-код WeChat
                </DialogTitle>

                <div class="mt-2">
                  <img
                    src="/wechat-qr.png?v=2"
                    alt="WeChat QR Code"
                    class="mx-auto mb-[1.5rem] w-[18rem] h-[21rem] rounded-[1rem] border-2 border-gray-100 object-cover shadow-sm"
                  >
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </TransitionRoot>
  </ClientOnly>
</template>

<script setup lang="ts">
import { ref } from "vue"
import {
  TransitionRoot,
  TransitionChild,
  Dialog,
  DialogPanel,
  DialogTitle,
} from "@headlessui/vue"

defineOptions({
  inheritAttrs: false,
})

const isOpen = ref(false)

function closeModal() {
  isOpen.value = false
}
</script>
