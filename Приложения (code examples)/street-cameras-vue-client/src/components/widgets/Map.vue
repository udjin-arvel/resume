<template>
  <div
    class="map-component"
    :class="{ _hidden: !isMapVisible, _fullscreen: isFullscreen }"
    v-touch:swipe="swipeHandler"
    v-touch:drag="movingHandler"
  >
    <l-map
      ref="map"
      :zoom="mapZoom"
      :center="mapCenter"
      :crs="crs"
      v-if="!isFullscreen"
    >
      <l-control-layers position="topright"></l-control-layers>
      <l-tile-layer
        v-for="tileProvider in tileProviders"
        :key="tileProvider.name"
        :name="tileProvider.name"
        :visible="tileProvider.visible"
        :url="tileProvider.url"
        :options="tileProvider.options || {}"
        layer-type="base"
      />
      <l-control position="bottomright">
        <button
          class="map-fullscreen-button"
          :title="isFullscreen ? 'Свернуть карту' : 'Увеличить карту'"
          @click.stop.prevent="fullscreen"
        >
          <i class="bi bi-fullscreen-exit" v-if="isFullscreen"></i>
          <i class="bi bi-fullscreen" v-else></i>
        </button>
      </l-control>
      <l-marker
        v-for="marker in markers"
        :key="marker.id"
        :lat-lng="marker.latLng"
      >
        <l-popup>
          <map-popup :data="getPopupDataByCoords(marker.latLng)" />
        </l-popup>
      </l-marker>
    </l-map>

    <div class="fullscreen-map" v-else>
      <l-map ref="map" :zoom="mapZoom" :center="mapCenter" :crs="crs">
        <l-control-layers position="topright"></l-control-layers>
        <l-tile-layer
          v-for="tileProvider in tileProviders"
          :key="tileProvider.name"
          :name="tileProvider.name"
          :visible="tileProvider.visible"
          :url="tileProvider.url"
          :options="tileProvider.options || {}"
          layer-type="base"
        />
        <l-control position="bottomright">
          <button
            class="map-fullscreen-button"
            :title="isFullscreen ? 'Свернуть карту' : 'Увеличить карту'"
            @click.stop.prevent="fullscreen"
          >
            <i class="bi bi-fullscreen-exit" v-if="isFullscreen"></i>
            <i class="bi bi-fullscreen" v-else></i>
          </button>
        </l-control>
        <l-marker
          v-for="marker in markers"
          :key="marker.id"
          :lat-lng="marker.latLng"
        >
          <l-popup>
            <map-popup :data="getPopupDataByCoords(marker.latLng)" />
          </l-popup>
        </l-marker>
      </l-map>
    </div>
  </div>
</template>

<script>
import { CRS } from "leaflet";
import {
  LMap,
  LTileLayer,
  LControlLayers,
  LMarker,
  LPopup,
  LControl,
} from "@vue-leaflet/vue-leaflet";
import MapPopup from "../widgets/MapPopup";

export default {
  name: "MapWidget",

  props: {
    onlyMyCameras: {
      type: Boolean,
      default: false,
    },
  },

  data: () => ({
    isMapVisible: true,
    isFullscreen: false,
    startTouchTime: 0,
    diffTouchTime: 0,
    crs: CRS.EPSG3395,
    tileProviders: [
      {
        name: "Яндекс", // EPSG3395
        visible: true,
        url: "https://core-renderer-tiles.maps.yandex.net/tiles?l=map&x={x}&y={y}&z={z}&lang=ru_RU",
      },
      {
        name: "2ГИС", // EPSG3857
        visible: false,
        url: "https://tile2.maps.2gis.com/tiles?x={x}&y={y}&z={z}",
      },
    ],
  }),

  methods: {
    toggleVisible(flag = null) {
      this.isMapVisible = typeof flag === "boolean" ? flag : !this.isMapVisible;
    },
    movingHandler() {
      const timestamp = +new Date();

      if (this.startTouchTime === 0) {
        this.startTouchTime = timestamp;
      } else {
        this.diffTouchTime = timestamp - this.startTouchTime;
      }
    },
    swipeHandler() {
      if (this.diffTouchTime === 0) {
        const { top, height } = this.$el.getBoundingClientRect();
        window.scrollTo({ top: Math.round(top + height), behavior: "smooth" });
      }

      this.startTouchTime = 0;
      this.diffTouchTime = 0;
    },
    getPopupDataByCoords(latLng) {
      const index = latLng.join(",");

      if (this.coords[index].length > 1) {
        return this.coords[index];
      }

      return this.coords[index][0];
    },
    fullscreen() {
      this.isFullscreen = !this.isFullscreen;
      this.changeTileLayerCrs(CRS.EPSG3395);
      this.handleLayerChange();
    },
    changeTileLayerCrs(crs) {
      this.crs = crs;
    },
    handleLayerChange() {
      setTimeout(() => {
        const layersButtons = this.$el.querySelectorAll(
          ".leaflet-control-layers-selector",
        );

        if (layersButtons.length >= 2) {
          const yandexButton = layersButtons[0];
          const twogisButton = layersButtons[1];

          // Проверяем, что элементы существуют перед добавлением обработчиков
          if (yandexButton) {
            yandexButton.addEventListener("input", () =>
              this.changeTileLayerCrs(CRS.EPSG3395),
            );
          }

          if (twogisButton) {
            twogisButton.addEventListener("input", () =>
              this.changeTileLayerCrs(CRS.EPSG3857),
            );
          }
        } else {
          // Если кнопки не найдены, пробуем еще раз
          setTimeout(this.handleLayerChange, 200);
        }
      }, 500); // Уменьшил задержку до 500 мс
    },
  },

  computed: {
    cameras() {
      return this.onlyMyCameras
        ? this.$store.getters.myCameras
        : this.$store.getters.filteredCameras;
    },
    markers() {
      return this.cameras
        .filter((camera) => camera.latitude && camera.longitude)
        .map((camera) =>
          Object.assign(camera, {
            id: `marker-camera-${camera.Id}`,
            latLng: [camera.latitude, camera.longitude],
          }),
        );
    },
    coords() {
      const coords = {};

      this.markers.forEach((marker) => {
        const index = marker.latLng.join(",");

        if (Object.prototype.hasOwnProperty.call(coords, index)) {
          coords[index].push(marker);
        } else {
          coords[index] = [marker];
        }
      });

      return coords;
    },
    mapCenter() {
      let centerLatitude, centerLongitude;

      if (this.cameras?.length) {
        const latitudes = [],
          longitudes = [];

        for (const marker of this.markers) {
          latitudes.push(marker.latitude);
          longitudes.push(marker.longitude);
        }

        const minLatitude = Math.min(...latitudes);
        const maxLatitude = Math.max(...latitudes);
        const minLongitude = Math.min(...longitudes);
        const maxLongitude = Math.max(...longitudes);

        centerLatitude = minLatitude + (maxLatitude - minLatitude) / 2;
        centerLongitude = minLongitude + (maxLongitude - minLongitude) / 2;
      } else {
        centerLatitude = this.$store.getters.geoData?.latitude || 46.149465;
        centerLongitude = this.$store.getters.geoData?.longitude || 39.523938;
      }

      return [centerLatitude, centerLongitude];
    },
    mapZoom() {
      let zoom = 4;
      if (this.$store.getters.geoData) {
        zoom = 8;
      }
      if (this.onlyMyCameras) {
        zoom = 12;
      }
      if (this.isFullscreen && this.crs.code === "EPSG:3857") {
        zoom = zoom + 1;
      }
      return zoom;
    },
  },

  mounted() {
    this.handleLayerChange();
  },

  components: {
    LMap,
    LTileLayer,
    LMarker,
    LPopup,
    LControl,
    LControlLayers,
    MapPopup,
  },
};
</script>

<style lang="less" scoped>
.map-component {
  position: relative;
  height: 320px;
  width: 100%;
  margin-bottom: 2rem;
  transition: height 0.2s ease-in-out;

  &._hidden {
    height: 0;
    margin-bottom: 0;
  }

  .fullscreen-map {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    width: 100vw;
    z-index: 2;
    overflow: hidden;

    .map-fullscreen-button {
      margin-right: 10px;
    }
  }

  .camera-popup {
    padding-bottom: 0.25rem;

    .video-widget {
      width: 306px;
      height: 202px;
    }
  }

  .map-fullscreen-button {
    background-color: #fff;
    border: solid 2px rgba(0, 0, 0, 0.35);
    padding: 4px 8px 3px;
    font-size: 16px;
    color: rgba(0, 0, 0, 0.9);
    border-radius: 4px;

    &:hover {
      box-shadow: rgba(0, 0, 0, 0.25) 0 0 10px;
    }
  }
}
</style>
