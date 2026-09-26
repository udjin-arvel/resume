<template>
  <div class="video-widget">
    <video-player
      controls
      autoplay
      :muted="true"
      :poster="poster"
      :src="source"
      v-if="isPlayerShow"
    ></video-player>
    <div
      class="video-card"
      :style="`background-image: url(${poster}), url(/video-stub.jpg)`"
      v-else
    >
      <div class="player-info">
        <div class="player-info__billet">
          <span :class="`billet-${data.CamType}`">{{
            data.CamType || "Другое"
          }}</span>
        </div>
      </div>
      <div class="player-controls">
        <div
          class="player-controls__play"
          @click.stop="play"
          role="button"
          title="Запустить трансляцию"
        >
          <i class="bi bi-play-btn"></i>
        </div>
        <router-link
          class="player-controls__archive"
          :to="`/archive/${data.Id}`"
          title="Архив"
          v-if="visibleArchiveButton"
        >
          <i class="bi bi-folder2"></i>
        </router-link>
        <div
          class="player-controls__remove"
          @click="$emit('remove', data.Id)"
          role="button"
          title="Удалить камеру из списка"
          v-if="isMyCamerasPage && data.CamType !== 3"
        >
          <i class="bi bi-trash3-fill"></i>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent } from "vue";
import { cameraType } from "@/params";
import { AuthService } from "@/services/AuthService";

export default defineComponent({
  name: "VideoWidget",

  props: {
    data: {
      type: Object,
      required: true,
    },
  },

  data: () => ({
    isPlayerShow: false,
  }),

  methods: {
    play() {
      this.isPlayerShow = true;
      this.visibleArchiveButton &&
        setTimeout(() => this.addArchiveLinkToVideoControls(), 1000);
    },
    addArchiveLinkToVideoControls() {
      const archiveLink = document.createElement("div");
      const linkText = document.createTextNode("АРХИВ");

      archiveLink.appendChild(linkText);
      archiveLink.title = `${this.data.Name} - Архив`;
      archiveLink.classList.add("archive-link");

      this.$el.querySelector(".vjs-live-control").appendChild(archiveLink);

      archiveLink.addEventListener("click", () => {
        this.$router.push(`/archive/${this.data.Id}`);
      });
    },
  },

  computed: {
    visibleArchiveButton() {
      return (
        this.$store.getters.isAuth && this.data.CamType !== cameraType.PUBLIC
      );
    },
    isMyCamerasPage() {
      return this.$route.name === "my-cameras";
    },
    poster() {
      const timestamp =
        Math.round(+new Date() / 1000) - this.$store.getters.serverOffset;
      const token = AuthService.getAccessToken();

      return `https://${this.data.Host}/${this.data.URL}/${timestamp}-preview.jpg?token=${token}`;
    },
    source() {
      if (!this.data.available) {
        return "https://video-krd.freedom1.ru/vod/locked.mp4/index.m3u8";
      }

      const token = AuthService.getAccessToken();
      return token
        ? `https://${this.data.Host}/${this.data.URL}/index.fmp4.m3u8?token=${token}`
        : `https://${this.data.Host}/${this.data.URL}/index.fmp4.m3u8`;
    },
  },
});
</script>

<style lang="less" scoped>
.video-widget {
  height: 100%;

  .video-card {
    position: relative;
    height: 100%;
    width: 100%;
    background-size: cover;
    background-repeat: no-repeat;

    .player-info {
      &__billet {
        position: absolute;
        top: 1rem;
        right: 1rem;
        z-index: 1;
        font-size: 14px;

        span {
          color: white;
          padding: 5px 10px;
          background-color: rgba(0, 0, 0, 0.5);
          border-radius: 4px;
        }

        .billet-Публичная {
          background-color: rgba(0, 0, 0, 0.75);
        }

        .billet-Дворовая {
          background-color: rgba(13, 110, 253, 0.75);
        }

        .billet-Личная {
          background-color: rgba(25, 135, 84, 0.75);
        }
      }
    }

    .player-controls {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      font-size: 4rem;
      color: white;
      background-color: rgba(0, 0, 0, 0.2);
      transition: background-color 0.2s ease-in-out;

      &:hover {
        background-color: rgba(0, 0, 0, 0.4);

        .player-controls__remove {
          display: inline-block;
        }
      }

      &__play,
      &__archive {
        padding: 8px;
        color: white;

        &:hover {
          color: #0d6efd;
        }
      }

      &__remove {
        display: none;
        position: absolute;
        bottom: 10px;
        right: 10px;
        opacity: 0.5;
        color: hotpink;
        font-size: 18px;

        &:hover {
          opacity: 1;
        }
      }
    }
  }
}
</style>
