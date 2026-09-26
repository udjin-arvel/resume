<template>
  <div :class="$style.video">
    <div :class="$style.video__bal">
      <div :class="$style.video__ell">
        <img
          src="/ell.svg"
          alt=""
        >
      </div>
      <div :class="$style.video__txt">
        {{ $t('land.video') }}
      </div>
    </div>
    <div :class="$style.video__second">
      <div
        v-if="showOverlay"
        :class="$style.video__tri"
        @click="handleOverlayClick"
      >
        <img
          :class="$style.video__triangle"
          src="/tri.svg"
          alt="Play"
        >
      </div>
      <video
        ref="videoRef"
        :class="$style.video__video"
        src="/IMG_6986.mp4"
        :controls="hasControls"
        @play="onPlay"
      />
    </div>
    <div :class="$style.video__main">
      <img
        :class="$style.video__cam"
        src="/camera2.svg"
        alt="camera"
      >
      <div :class="$style.video__title">
        {{ $t('land.every') }}
      </div>
      <MainOl
        :items="[
          { key: 'land.li11' },
          { key: 'land.li12' },
          { key: 'land.li13' },
          { key: 'land.li14' },
        ]"
      />
      <NuxtLink
        to="https://disk.yandex.ru/d/LRdpc8zpgEW8MA"
        target="_blank"
        rel="nofollow noopener noreferrer"
        :class="$style.video__btn"
      >
        <img
          :class="$style.video__ico"
          src="/folder.svg"
          alt="folder"
        >
        <img
          :class="$style.video__ico"
          src="/camera.svg"
          alt="folder"
        >
        <img
          :class="$style.video__ico"
          src="/video.svg"
          alt="folder"
        >
        <span :class="$style.video__span">{{ $t('land.look') }}</span>
        <img
          :class="$style.video__arr"
          src="/arr3.svg"
          alt="arrow"
        >
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue"

const showOverlay = ref(true)
const hasControls = ref(false)
const videoRef = ref<HTMLVideoElement | null>(null)

const handleOverlayClick = () => {
  showOverlay.value = false
  hasControls.value = true
  if (videoRef.value) {
    videoRef.value.play()
  }
}

const onPlay = () => {}
</script>

<style module>
.video {
  @apply p-[1.875rem_1.75rem_1.8125rem] shadow-[0_0.5rem_1.5rem_rgba(0,0,0,0.08)] border border-grey-300 bg-white rounded-[1.25rem] mb-[2.5rem] flex flex-wrap relative;
}

.video__ell {
  @apply absolute left-[9.4375rem] top-[10.25rem];
}

.video__ico {
  @apply mr-[0.625rem];
}

.video__arr {
  @apply ml-[0.8125rem];
}

.video__btn {
  @apply inline-flex mb-[0.625rem] px-[1.875rem] py-[0.5625rem] text-[1.25rem] font-medium text-primary bg-white border border-primary rounded-[0.625rem] items-center hover:bg-primary hover:text-white transition-colors duration-300;
}

.video__btn:hover .video__ico,
.video__btn:hover .video__arr {
  @apply filter brightness-0 invert;
}

.video__title {
  @apply text-[1.875rem] font-bold mb-[1.125rem];
}

.video__main {
  @apply pl-[3.25rem] w-1/2;
}

.video__tri {
  @apply cursor-pointer bg-white/30 border border-[rgba(0,0,0,0.3)] absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[8.75rem] h-[8.75rem] rounded-full flex flex-wrap z-10 items-center justify-center;
}

.video__cam {
  @apply mb-[1.125rem];
}

.video__bal {
  @apply pt-[3.0625rem] pl-[1.375rem] pr-[0.8125rem] w-[15%] [background:url('/bal.svg')_no-repeat_left_2rem] text-[0.9375rem];
}

.video__txt {
  @apply rotate-[-2deg];
}

.video__second {
  @apply w-[20%] relative;
}

.video__video {
  @apply rounded border border-grey-300;
}

@media (max-width: 1350px) {
  .video__bal {
    @apply w-1/4;
  }
  .video__txt {
    @apply w-[10rem] max-w-full;
  }
  .video__second {
    @apply w-1/4;
  }
}

@media (max-width: 1100px) {
  .video__main {
    @apply pl-0 w-full;
  }
  .video__bal {
    @apply w-[30%];
  }
  .video__second {
    @apply w-1/2;
  }
}

@media (max-width: 750px) {
  .video {
    @apply -mx-5 px-10 pt-0;
  }
  .video__ell {
    @apply left-[5.8rem] top-[5.75rem] rotate-90;
  }
  .video__span {
    @apply w-full;
  }
  .video__bal {
    @apply w-[69%] ml-[42%] pb-[2.0625rem];
  }
  .video__btn {
    @apply flex flex-row flex-wrap relative;
  }
  .video__arr {
    @apply absolute right-[1.875rem] top-[0.9375rem];
  }
  .video__ico {
    @apply mb-3;
  }
  .video__title {
    @apply text-2xl;
  }
  .video__second {
    @apply w-full mb-10;
  }
}
</style>
