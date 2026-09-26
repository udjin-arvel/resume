<template>
  <div
    v-if="loading"
    :class="$style.loadingState"
  >
    {{ t('common.loading') }}
  </div>

  <div
    v-else-if="!carsDetails.length"
    :class="$style.emptyState"
  >
    {{ t('needs.trims.no_cars') }}
  </div>

  <div
    v-else
    :class="$style.wrapper"
  >
    <div :class="$style.carBar">
      <div
        :class="$style.carBarNavSpacer"
        aria-hidden="true"
      />
      <div :class="$style.carBarClip">
        <div
          :class="$style.carBarStickyOverlay"
          aria-hidden="true"
        />
        <div
          ref="carBarInnerRef"
          :class="$style.carBarInner"
        >
          <div
            v-for="car in carsDetails"
            :key="car.id"
            :class="$style.carCardCell"
          >
            <div :class="$style.carCard">
              <div :class="$style.carHeaderContent">
                <img
                  v-if="car.img_thumb || car.img"
                  :src="car.img_thumb || car.img"
                  :alt="car.name"
                  :class="$style.carThumb"
                  loading="lazy"
                >
                <div
                  v-else
                  :class="$style.carThumbPlaceholder"
                />
                <div :class="$style.carInfo">
                  <span :class="$style.carName">{{ car.name }}</span>
                  <span :class="$style.carSubtext">{{ car.year }} г. • {{ car.displacement }} л</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div :class="$style.bodyRow">
      <nav
        :class="$style.nav"
        aria-label="Section navigation"
      >
        <ul :class="$style.navList">
          <li
            v-for="section in navSections"
            :key="section.id"
          >
            <button
              type="button"
              :class="[$style.navItem, activeSection === section.id ? $style.navItemActive : '']"
              @click="scrollToSection(section.id)"
            >
              {{ section.name }}
            </button>
          </li>
        </ul>
      </nav>

      <div
        ref="tableAreaRef"
        :class="$style.tableArea"
        @scroll="onTableScroll"
      >
        <table :class="$style.table">
          <tbody>
            <template
              v-for="row in visibleRows"
              :key="row.key"
            >
              <tr
                v-if="row.isSection"
                :id="`compare-section-${row.id}`"
              >
                <td
                  :colspan="carsDetails.length + 1"
                  :class="$style.sectionRow"
                >
                  <div :class="$style.sectionLabel">
                    {{ row.name }}
                  </div>
                </td>
              </tr>

              <tr
                v-else
                :class="$style.paramRow"
              >
                <td :class="$style.labelCell">
                  {{ row.name }}
                </td>
                <td
                  v-for="(val, i) in row.values"
                  :key="i"
                  :class="$style.valueCell"
                >
                  {{ val || '—' }}
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue"
import { useI18n } from "vue-i18n"
import { getParamGroups, extractParamValue } from "@/utils/buildCarParams"
import useSearchRequest from "@/composables/useSearchRequest"

const props = defineProps<{
  cars: any[]
}>()

const { t } = useI18n()
const { getCarDetailsFull } = useSearchRequest()

const carsDetails = ref<any[]>([])
const loading = ref(true)
const activeSection = ref("overview")
const carBarInnerRef = ref<HTMLElement | null>(null)
const tableAreaRef = ref<HTMLElement | null>(null)

onMounted(async () => {
  try {
    const results = await Promise.all(
      props.cars.map(car => getCarDetailsFull(car.id)),
    )
    carsDetails.value = results.filter(Boolean)
  }
  catch (e) {
    console.error("Failed to load car details for comparison", e)
  }
  finally {
    loading.value = false
  }
})

const paramGroups = computed(() => getParamGroups())

const visibleRows = computed(() => {
  if (!carsDetails.value.length) {
    return []
  }

  const rows: any[] = []

  rows.push({
    key: "section-overview",
    isSection: true,
    id: "overview",
    name: t("needs.trims.overview"),
  })

  for (const group of paramGroups.value) {
    if (group.headerKey) {
      const sectionId = group.headerKey.replace(/\./g, "-")
      rows.push({
        key: `section-${sectionId}`,
        isSection: true,
        id: sectionId,
        name: t(group.headerKey),
      })
    }

    for (const param of group.params) {
      const values = carsDetails.value.map(car => extractParamValue(car, param, t))
      if (values.some(v => v)) {
        rows.push({
          key: `param-${param.nameKey}`,
          isSection: false,
          name: t(param.nameKey),
          values,
        })
      }
    }
  }

  return rows
})

const navSections = computed(() =>
  visibleRows.value
    .filter(r => r.isSection)
    .map(r => ({ id: r.id, name: r.name })),
)

function scrollToSection(id: string) {
  activeSection.value = id
  const el = document.getElementById(`compare-section-${id}`)
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" })
  }
}

function onTableScroll() {
  if (carBarInnerRef.value && tableAreaRef.value) {
    carBarInnerRef.value.style.transform = `translateX(-${tableAreaRef.value.scrollLeft}px)`
  }
}
</script>

<style module>
.wrapper {
  @apply flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white h-full;
}

.carBar {
  @apply flex flex-row shrink-0 bg-white z-10 border-b border-gray-200;
}

.carBarNavSpacer {
  @apply hidden lg:block w-[200px] shrink-0 bg-white;
}

.carBarClip {
  @apply w-full min-w-0 relative bg-white lg:w-[calc(100%_-_200px)];
}

.carBarStickyOverlay {
  @apply absolute left-0 top-0 bottom-0 w-[120px] bg-white pointer-events-none lg:w-[200px];
}

.carBarInner {
  @apply flex will-change-transform pl-[120px] pr-0 lg:pl-[200px] lg:pr-[200px];
}

.carCardCell {
  @apply w-[260px] min-w-[260px] max-w-[260px] h-[80px] p-1.5 shrink-0 lg:w-[438px] lg:min-w-[438px] lg:max-w-[438px] lg:h-24 lg:p-2;
}

.bodyRow {
  @apply flex flex-row flex-1 overflow-hidden;
}

.nav {
  @apply hidden lg:flex flex-col shrink-0 overflow-y-auto w-[200px] py-3 bg-white border-r border-gray-200;
}

.navList {
  @apply flex flex-col gap-0.5 px-2;
}

.navItem {
  @apply w-full text-left text-sm py-1.5 px-2 rounded transition-colors hover:bg-gray-50 text-[#6A6267];
}

.navItemActive {
  @apply font-medium text-[#1A1117];
}

.tableArea {
  @apply flex-1 min-w-0 overflow-auto;
}

.table {
  @apply border-collapse;
}

.carCard {
  @apply bg-white border border-gray-200 rounded-lg overflow-hidden h-full flex items-center;
}

.carHeaderContent {
  @apply flex flex-row items-center gap-3 px-3 w-full;
}

.carThumb {
  @apply object-cover rounded shrink-0 w-[72px] h-[54px];
}

.carThumbPlaceholder {
  @apply rounded shrink-0 bg-gray-100 w-[72px] h-[54px];
}

.carInfo {
  @apply flex flex-col gap-0.5 min-w-0;
}

.carName {
  @apply text-sm font-medium leading-tight truncate text-[#1A1117];
}

.carSubtext {
  @apply text-xs truncate text-[#757575];
}

.sectionLabelCell {
  @apply sticky left-0 z-10 bg-white pt-3 px-4 pb-2 text-xl font-normal leading-[1.2] text-[#1A1117] border-b border-gray-200 align-bottom whitespace-nowrap;
}

.sectionRow {
  @apply bg-white border-b border-gray-200 pt-3 pb-2 align-bottom;
}

.sectionLabel {
  @apply inline-block sticky left-0 -ml-px font-normal leading-[1.2] text-[#1A1117] whitespace-nowrap text-base px-3 lg:text-xl lg:px-4;
}

.paramRow:hover .labelCell,
.paramRow:hover .valueCell {
  @apply bg-gray-50;
}

.labelCell {
  @apply sticky relative left-0 z-10 bg-white py-2 px-[10px] text-[13px] font-normal text-[#757575] align-top min-w-[120px] max-w-[120px] w-[120px] border-b border-gray-100 lg:px-4 lg:text-base lg:min-w-[200px] lg:max-w-[200px] lg:w-[200px];

  &::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: 1px;
    background: #F3F4F6;
  }
}

.valueCell {
  @apply py-2 px-[10px] text-[13px] font-normal text-[#1A1117] align-top w-[260px] min-w-[260px] max-w-[260px] border-b border-gray-100 lg:px-4 lg:text-base lg:w-[438px] lg:min-w-[438px] lg:max-w-[438px];
}

.loadingState {
  @apply text-gray-500 text-sm py-8 text-center;
}

.emptyState {
  @apply text-gray-400 text-sm py-8 text-center;
}
</style>
