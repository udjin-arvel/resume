<template>
  <div class="page cameras-page position-relative">
    <div class="container">
      <h2 class="mb-4">
        {{
          isMyCamerasPage ? "Список моих камер" : "Список доступных видеокамер"
        }}
      </h2>
      <div class="cameras-amount">
        Количество камер в списке:
        <strong>{{ cameras && cameras.length ? cameras.length : 0 }}</strong>
      </div>

      <div class="maps-container">
        <CamerasMap ref="map" :only-my-cameras="isMyCamerasPage" />
      </div>

      <div class="list-controls mb-4">
        <div
          class="toggle-map-button btn btn-dark"
          role="button"
          @click="toggleMapVisible"
        >
          <i
            class="bi"
            :class="isMapVisible ? 'bi-pin-map-fill' : 'bi-pin-map'"
          ></i
          >&nbsp; {{ isMapVisible ? "Скрыть карту" : "Показать карту" }}
        </div>

        <div
          class="filter-button btn btn-dark"
          role="button"
          @click="isFiltersVisible = true"
          v-if="!isMyCamerasPage"
        >
          <i class="bi bi-filter-square"></i>&nbsp; Настроить фильтры
        </div>

        <div
          class="clear-filter-button"
          :class="{ _faded: isClearFiltersButtonVisible }"
          role="button"
          @click="clearFilters"
          v-if="!isMyCamerasPage"
        >
          Убрать фильтры
        </div>

        <div
          class="add-cameras-button btn btn-dark"
          role="button"
          @click="addCamera"
          v-if="isMyCamerasPage"
        >
          <i class="bi bi-node-plus"></i> Добавить камеры
        </div>

        <div
          class="clear-my-cameras-button btn btn-light"
          role="button"
          @click="clearList"
          v-if="isMyCamerasPage"
        >
          <i class="bi bi-trash3"></i> Очистить список
        </div>

        <div class="sort-button" role="button" @click="changeSort">
          <span>Сортировка:</span>
          <i class="bi bi-sort-alpha-down" v-if="sortListAsc"></i>
          <i class="bi bi-sort-alpha-up" v-else></i>
        </div>

        <div class="grid-buttons">
          <span>Сетка:</span>
          <div class="grid-button" role="button" @click="selectColumnCount(2)">
            <i class="bi bi-grid-fill"></i>
          </div>
          <div class="grid-button" role="button" @click="selectColumnCount(3)">
            <i class="bi bi-grid-3x3-gap-fill"></i>
          </div>
        </div>
      </div>

      <div class="cameras row">
        <div
          :class="`camera ${columnGridClass}`"
          v-for="camera in cameras"
          :key="camera.Id"
        >
          <div class="camera-title">
            <div class="camera-title__name fw-bold">{{ camera.Name }}</div>
            <div class="camera-title__address small">
              {{ camera.Address.FullAddress }}
            </div>
          </div>

          <div class="camera-body" :style="`height: ${cameraHeight}px`">
            <video-widget @remove="removeCamera" :data="camera" />
          </div>
        </div>
      </div>
    </div>

    <vue-final-modal
      name="confirm-modal"
      v-model="$store.getters.isCitiesModalShow"
    >
      <cities-modal @closeModal="$store.commit('TOGGLE_CITY_MODAL', false)" />
    </vue-final-modal>

    <FiltersSidebar
      :is-visible="isFiltersVisible"
      @close="isFiltersVisible = false"
    />
  </div>
</template>

<script>
import { defineComponent } from "vue";
import VideoWidget from "../widgets/VideoWidget";
import FiltersSidebar from "../widgets/FiltersSidebar";
import CitiesModal from "../widgets/CitiesModal";
import CamerasMap from "../widgets/Map";

export default defineComponent({
  name: "CamerasPage",

  data: () => ({
    cameraHeight: 200,
    sortListAsc: null,
    columnsCount: 3,
    isFiltersVisible: false,
    isMapVisible: true,
    tag: null,
    region: null,
    type: null,
    types: [
      { id: 1, label: "Публичные" },
      { id: 2, label: "Дворовые" },
      { id: 3, label: "Личные" },
    ],
  }),

  methods: {
    toggleMapVisible() {
      if (this.$refs.map) {
        this.isMapVisible = !this.isMapVisible;
        this.$refs.map.toggleVisible(this.isMapVisible);
      }
    },
    addCamera() {
      this.$store.commit("TOGGLE_CITY_MODAL", true);
    },
    removeCamera(id) {
      this.$store.commit("REMOVE_MY_CAMERA", Number(id));
    },
    clearList() {
      this.$store.commit("CLEAR_MY_CAMERAS");
    },
    changeSort() {
      this.sortListAsc = !this.sortListAsc;
    },
    clearFilters() {
      this.$store.commit("SET_CAMERAS_FILTERS", {});
    },
    selectColumnCount(count) {
      this.columnsCount = count;
    },
    calcCameraHeight() {
      const camera = this.$el.querySelector(".camera-body");

      if (camera) {
        this.cameraHeight = Math.round(camera.clientWidth * 0.5649);
      }
    },
  },

  computed: {
    isMyCamerasPage() {
      return this.$route.name === "my-cameras";
    },
    isClearFiltersButtonVisible() {
      if (this.$store.getters.filters) {
        return Object.keys(this.$store.getters.filters).length > 0;
      }

      return false;
    },
    columnGridClass() {
      return this.columnsCount === 3 ? "col-md-4" : "col-md-6";
    },
    cameras() {
      let cameras = this.isMyCamerasPage
        ? this.$store.getters.myCameras
        : this.$store.getters.filteredCameras;

      if (this.sortListAsc === true) {
        cameras = cameras.sort((a, b) => (a.Name[0] > b.Name[0] ? 1 : -1));
      } else if (this.sortListAsc === false) {
        cameras = cameras.sort((a, b) => (a.Name[0] < b.Name[0] ? 1 : -1));
      }

      return cameras;
    },
  },

  beforeMount() {
    this.$store.dispatch("GET_CAMERAS");
  },

  mounted() {
    setTimeout(() => this.calcCameraHeight(), 500);
  },

  updated() {
    this.calcCameraHeight();
  },

  components: {
    VideoWidget,
    FiltersSidebar,
    CitiesModal,
    CamerasMap,
  },
});
</script>
