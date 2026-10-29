<template>
  <div :class="$style.section">
    <div :class="$style.inner">
      <h2 :class="$style.title">
        {{ $t('home.feedback.title') }}
      </h2>
      <p :class="$style.subtitle">
        {{ $t('home.feedback.subtitle') }}
      </p>

      <form @submit.prevent="submitForm">
        <div :class="$style.row">
          <input
            v-model="form.name"
            type="text"
            required
            :disabled="isLoading"
            :placeholder="$t('home.feedback.name')"
            :class="[errors.get('name') ? $style.input_invalid : $style.input]"
            @input="errors.clear('name')"
          >
          <input
            v-model="form.phone"
            v-maska
            type="tel"
            required
            :disabled="isLoading"
            :placeholder="$t('home.feedback.phone')"
            data-maska="+7 (###) ###-##-##"
            :class="[errors.get('phone') ? $style.input_invalid : $style.input]"
            @input="errors.clear('phone')"
          >
          <input
            v-model="form.city"
            type="text"
            required
            :disabled="isLoading"
            :placeholder="$t('home.feedback.city')"
            :class="[errors.get('city') ? $style.input_invalid : $style.input]"
            @input="errors.clear('city')"
          >
          <button
            type="submit"
            :disabled="isLoading || !acceptedPolicy"
            :class="$style.btn"
          >
            {{ isLoading ? $t('home.feedback.sending') : $t('home.feedback.submit') }}
          </button>
        </div>

        <div :class="$style.policy">
          <input
            id="cta-policy"
            v-model="acceptedPolicy"
            type="checkbox"
            :class="$style.checkbox"
          >
          <label
            for="cta-policy"
            :class="$style.policy__label"
          >
            <a
              href="/Согласие_на_обработку_персональных_данных.docx"
              target="_blank"
              :class="$style.policy__link"
            >
              {{ $t('home.feedback.policy') }}
            </a>
          </label>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue"
import { vMaska } from "maska/vue"
import { useFeedback } from "@/composables/useFeedback"

const emit = defineEmits<{
  (e: "submit-success"): void
}>()

const { submitFeedback, isLoading, errors } = useFeedback()

const acceptedPolicy = ref(true)

const form = reactive({
  name: "",
  phone: "",
  city: "",
})

const submitForm = async () => {
  if (!acceptedPolicy.value) {
    return
  }

  await submitFeedback(form)

  if (!errors.value.any()) {
    form.name = ""
    form.phone = ""
    form.city = ""
    emit("submit-success")
  }
}
</script>

<style module>
.section {
  @apply shadow-[0_0.5rem_1.5rem_rgba(0,0,0,0.08)] border border-grey-300 rounded-[1.25rem] bg-white mb-[2.55rem];
}

.inner {
  @apply px-[3.75rem] py-[3.125rem] text-center;
}

.title {
  @apply text-[2rem] font-bold text-gray-900 mb-3 leading-tight;
}

.subtitle {
  @apply text-[1rem] text-gray-500 mb-8;
}

.row {
  @apply flex flex-wrap gap-3 justify-center items-center;
}

.input {
  @apply flex-1 min-w-[12rem] px-4 py-3 rounded-lg border border-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm bg-white disabled:bg-gray-50 disabled:text-gray-500;
}

.input_invalid {
  @apply flex-1 min-w-[12rem] px-4 py-3 rounded-lg border border-red-400 placeholder-red-300 text-red-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm bg-white;
}

.btn {
  @apply px-8 py-3 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap;
}

.policy {
  @apply flex items-center justify-center gap-2 mt-4 text-xs text-gray-500;
}

.checkbox {
  @apply h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer;
}

.policy__label {
  @apply cursor-pointer;
}

.policy__link {
  @apply underline hover:text-gray-800 transition-colors;
}

@media (max-width: 640px) {
  .section {
    @apply px-[1.25rem] pt-[2.5rem] pb-[1.25rem];
  }

  .inner {
    @apply px-0 py-0;
  }

  .title {
    @apply text-[1.5rem];
  }

  .row {
    @apply flex-col;
  }

  .input,
  .input_invalid {
    @apply w-full min-w-0 flex-none;
  }

  .btn {
    @apply w-full;
  }
}
</style>
