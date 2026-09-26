<template>
  <HeadlessTransitionRoot
    appear
    :show="isOpen"
    as="template"
  >
    <HeadlessDialog
      as="div"
      class="relative z-50"
      @close="closeModal"
    >
      <HeadlessTransitionChild
        as="template"
        enter="duration-300 ease-out"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="duration-200 ease-in"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-black/50 transition-opacity" />
      </HeadlessTransitionChild>

      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4 text-center">
          <HeadlessTransitionChild
            as="template"
            enter="duration-300 ease-out"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="duration-200 ease-in"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <HeadlessDialogPanel class="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
              <button
                type="button"
                class="absolute top-5 right-5 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                @click="closeModal"
              >
                <span class="sr-only">{{ t('home.feedback.close') }}</span>
                <XMarkIcon
                  class="h-6 w-6"
                  aria-hidden="true"
                />
              </button>

              <HeadlessDialogTitle
                as="h3"
                class="text-2xl font-bold leading-6 text-gray-900 pr-8"
              >
                {{ t('home.feedback.title') }}
              </HeadlessDialogTitle>

              <div class="mt-2 mb-6 pr-8">
                <p class="text-sm text-gray-500">
                  {{ t('home.feedback.subtitle') }}
                </p>
              </div>

              <form
                class="space-y-4"
                @submit.prevent="submitForm"
              >
                <FormInput
                  v-model="form.name"
                  required
                  :disabled="isLoading"
                  :placeholder="t('home.feedback.name')"
                  :invalid-message="errors.get('name')"
                  @update:model-value="errors.clear('name')"
                />

                <FormInput
                  v-model="form.phone"
                  v-maska
                  type="tel"
                  required
                  :disabled="isLoading"
                  :placeholder="t('home.feedback.phone')"
                  data-maska="+7 (###) ###-##-##"
                  :invalid-message="errors.get('phone')"
                  @update:model-value="errors.clear('phone')"
                />

                <FormInput
                  v-model="form.city"
                  required
                  :disabled="isLoading"
                  :placeholder="t('home.feedback.city')"
                  :invalid-message="errors.get('city')"
                  @update:model-value="errors.clear('city')"
                />

                <div class="flex items-start pt-2">
                  <div class="flex h-6 items-center">
                    <input
                      id="policy"
                      v-model="acceptedPolicy"
                      type="checkbox"
                      class="h-4 w-4 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                    >
                  </div>
                  <div class="ml-3 text-xs leading-5">
                    <label
                      for="policy"
                      class="text-gray-500"
                    >
                      <a
                        href="/Согласие_на_обработку_персональных_данных.docx"
                        target="_blank"
                        class="underline hover:text-gray-800 transition-colors"
                      >
                        {{ t('home.feedback.policy') }}
                      </a>
                    </label>
                  </div>
                </div>

                <div class="mt-6">
                  <CommonButton
                    kind="primary"
                    type="submit"
                    size="lg"
                    :disabled="isLoading || !acceptedPolicy"
                  >
                    {{ isLoading ? t('home.feedback.sending') : t('home.feedback.submit') }}
                  </CommonButton>
                </div>
              </form>
            </HeadlessDialogPanel>
          </HeadlessTransitionChild>
        </div>
      </div>
    </HeadlessDialog>
  </HeadlessTransitionRoot>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue"
import { XMarkIcon } from "@heroicons/vue/24/solid"
import { vMaska } from "maska/vue"
import { useI18n } from "vue-i18n"
import { useFeedback } from "@/composables/useFeedback"

defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: "update:isOpen", value: boolean): void
  (e: "submit-success"): void
}>()

const { t } = useI18n()
const { submitFeedback, isLoading, errors } = useFeedback()

const acceptedPolicy = ref(true)

const form = reactive({
  name: "",
  phone: "",
  city: "",
})

const closeModal = () => {
  emit("update:isOpen", false)
}

const submitForm = async () => {
  if (!acceptedPolicy.value) {
    return
  }

  await submitFeedback(form)

  if (!errors.value.any()) {
    form.name = ""
    form.phone = ""
    form.city = ""

    closeModal()
  }
}
</script>
