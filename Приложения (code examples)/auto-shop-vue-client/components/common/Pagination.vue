<template>
  <div>
    <div v-if="showTotal">
      <p :class="$style.rangeTotal">
        {{
          t("pagination.range_total", {
            start: Number(offset) + 1,
            end: Number(offset) + Number(limit) > props.total ? props.total : Number(offset) + Number(limit),
            items: props.total,
          })
        }}
      </p>
    </div>
    <div :class="$style.wrap">
      <div v-if="pagination.length > 0">
        <nav
          :class="$style.nav"
          aria-label="Pagination"
        >
          <button
            :class="$style.btnLeft"
            :disabled="currentPage === 1 || disabled"
            @click="prev()"
          >
            <span
              v-t="'pagination.backward'"
              :class="$style.srOnly"
            />
            <ChevronLeftIcon
              :class="$style.icon"
              aria-hidden="true"
            />
          </button>
          <template
            v-for="page in pagination"
            :key="page"
          >
            <button
              v-if="page > 0"
              :class="[$style.item, page === currentPage ? $style.itemCurrent : $style.itemDefault]"
              :aria-current="page === currentPage ? 'page' : false"
              :disabled="disabled"
              @click="__currentPage = page"
            >
              {{ page }}
            </button>
            <span
              v-else
              v-t="'pagination.dots'"
              :class="[$style.item, $style.itemDefault]"
            />
          </template>
          <button
            :class="$style.btnRight"
            :disabled="currentPage === lastPage || disabled"
            @click="next()"
          >
            <span
              v-t="'pagination.forward'"
              :class="$style.srOnly"
            />
            <ChevronRightIcon
              :class="$style.icon"
              aria-hidden="true"
            />
          </button>
        </nav>
      </div>
      <div
        v-if="showLimits"
        :class="$style.limitsOuter"
      >
        <div :class="$style.limitsWrap">
          <p
            v-t="'pagination.page_sizes'"
            :class="$style.limitsPageTitle"
          />
          <FormListBoxByValue
            v-model="__limit"
            :options="limits"
            :disabled="disabled"
            :view="'row'"
            :with-border="true"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/vue/20/solid"
import type { PaginationData } from "@/types/common/pagination"
import type { OptionBase } from "@/types/form/optionType"

const props = withDefaults(defineProps<{
  currentPage: number
  total: number
  limit: number
  limits?: OptionBase[]
  disabled?: boolean
  showTotal?: boolean
  showLimits?: boolean
}>(), {
  disabled: false,
  showTotal: true,
  showLimits: true,
  limits: () => [
    { id: 1, value: 10, name: 10, disabled: false },
    { id: 2, value: 20, name: 20, disabled: false },
    { id: 3, value: 50, name: 50, disabled: false },
  ],
})

const emits = defineEmits(["changePage"])
const { t } = useI18n()

const { __currentPage, lastPage, next, prev, offset, __limit, pagination, total } = usePagination({
  limit: toRef(props, "limit").value,
  total: toRef(props, "total").value,
  currentPage: toRef(props, "currentPage").value,
})

const limits = computed(() => props.limits)

watch(
  () => [props.total, props.currentPage, props.limit],
  () => {
    total.value = toRef(props, "total").value
    __currentPage.value = toRef(props, "currentPage").value
    __limit.value = toRef(props, "limit").value
  },
)
watch(
  [__currentPage, __limit],
  () => {
    if (
      Number(__currentPage.value) === Number(props.currentPage)
      && Number(__limit.value) === Number(props.limit)
    ) {
      return
    }

    emits("changePage", {
      currentPage: Number(__currentPage.value),
      lastPage: Number(lastPage.value),
      limit: Number(__limit.value),
      offset: Number(offset.value),
    } as PaginationData)
  },
  { immediate: false },
)
</script>

<style module>
.wrap {
    @apply flex flex-col space-y-4 items-center justify-between sm:flex-row sm:space-y-0;
    @apply sm:space-y-0 sm:flex-row sm:items-center sm:justify-between;
    @apply gap-4;
}
.limitsWrap {
    @apply flex items-center justify-between w-44;
    @apply sm:w-44 w-full sm:justify-between justify-start gap-4;
}
.nav {
    @apply relative z-0 inline-flex rounded-md -space-x-px;
    @apply sm:justify-start justify-center w-full flex-wrap;
}
.rangeTotal {
    @apply text-sm text-gray-700 mb-2;
}
.limitsPageTitle {
    @apply text-sm text-gray-700;
}
.item {
    @apply relative inline-flex items-center px-4 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-no-drop rounded-md;
}
.itemDefault {
    @apply bg-white text-gray-500 hover:bg-gray-50;
}
.itemCurrent {
    @apply z-10 bg-black text-white;
}
.btnLeft {
    @apply relative inline-flex items-center px-2 py-2 rounded-md bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-no-drop;
}
.btnRight {
    @apply relative inline-flex items-center px-2 py-2 rounded-md bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-no-drop;
}
.icon {
    @apply h-5 w-5;
}
.srOnly {
    @apply sr-only;
}
.limitsOuter {
    @apply sm:block hidden;
}

@media (max-width: 640px) {
  .wrap {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  .nav {
    justify-content: center;
    width: 100%;
    flex-wrap: wrap;
  }
  .limitsWrap {
    width: 100%;
    justify-content: flex-start;
    gap: 1rem;
  }
  .limitsOuter {
    display: none !important;
  }
}
</style>
