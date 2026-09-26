<template>
  <div class="camera-popup">
    <div class="camera-popup__list" v-if="isSeveralCameras && !showVideoWidget">
      <div
          class="camera-item"
          role="button"
          v-for="camera in data"
          :key="camera.id"
          @click.prevent.stop="selectCamera(camera)"
      >
        <h6><strong>- {{ camera.Name }}: {{ camera.Address.FullAddress }}</strong></h6>
      </div>
    </div>
    <div class="camera-popup__container" v-if="showVideoWidget">
      <span class="text-black-50 camera-popup__back" role="button" @click.prevent.stop="backToList" v-if="isSeveralCameras">{{ '< назад' }}</span>
      <h6 :class="{ 'p-r__50': isSeveralCameras }"><strong>{{ selectedCamera.Name }}: {{ selectedCamera.Address.FullAddress }}</strong></h6>
      <video-widget :data="selectedCamera" />
    </div>
  </div>
</template>

<script>
import VideoWidget from './VideoWidget';

export default {
  name: "MapPopup",

  props: {
    data: {
      type: [Array, Object],
      required: true,
    },
  },

  data: () => ({
    selectedCamera: {},
    showVideoWidget: false,
    isSeveralCameras: false,
  }),

  methods: {
    selectCamera(camera) {
      this.selectedCamera = camera;
      this.showVideoWidget = true;
    },
    backToList() {
      this.selectedCamera = {};
      this.showVideoWidget = false;
    },
  },

  beforeMount() {
    if (Array.isArray(this.data)) {
      this.isSeveralCameras = true;
    } else {
      this.selectedCamera = this.data;
      this.showVideoWidget = true;
    }
  },

  components: {
    VideoWidget,
  },
}
</script>

<style lang="less" scoped>
.camera-popup {
  padding-bottom: 0.25rem;
  position: relative;

  .camera-item {
    &:hover {
      text-decoration: underline;
    }
  }

  &__back {
    position: absolute;
    top: 0;
    right: 0;
    font-weight: bold;

    &:hover {
      text-decoration: underline;
    }
  }

  &__container {
    h6 {
      &.p-r__50 {
        padding-right: 50px;
      }
    }
  }

  .video-widget {
    width: 306px;
    height: 202px;
  }
}
</style>