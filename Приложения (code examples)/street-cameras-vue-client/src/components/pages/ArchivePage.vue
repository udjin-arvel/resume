<template>
	<div class="archive-page">
		<div class="archive-panel">
			<div class="archive-panel__title">
				<h4>Архив: {{ camera.Name }}</h4>
			</div>
			<div class="archive-panel__back" @click.stop="$router.back" role="button" title="Вернуться на предыдущую страницу">
				<i class="bi bi-arrow-return-left"></i>
			</div>
		</div>

		<iframe class="archive-video" allowfullscreen :src="archive"></iframe>
	</div>
</template>

<script>
  import {AuthService} from "@/services/AuthService";

  export default {
    name: 'ArchivePage',

	  data: () => ({
		  camera: null,
	  }),

    computed: {
      archive() {
        if (!this.camera) {
          return '';
        }

        if (!this.camera.available) {
          return 'https://video-krd.freedom1.ru/vod/locked.mp4/index.m3u8';
        }

        let url = `https://${this.camera.Host}/${this.camera.URL}/embed.html?dvr=true`;
        let token = AuthService.getAccessToken();
        if (token) url += `&token=${token}`;

        return url;
      },
    },
	  
	  beforeMount() {
      if (this.$route.params && this.$route.params.id) {
        this.camera = this.$store.getters.cameras.find(camera => camera.Id == this.$route.params.id);
      } else {
        this.$router.push('/');
      }
	  },
  };
</script>

<style lang="less" scoped>
	.archive-page {
		position: relative;
		background-color: black;
		padding-top: 50px;

		.archive-panel {
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			color: #fff;
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 10px 2.5rem;

			&__title, &__back {
				opacity: 0.5;
				transition: opacity .15s ease-in-out;

				&:hover {
					opacity: 1;
				}
			}

			&__back {
				font-size: 20px;
				border: solid 1px #fff;
				padding: 2px 10px;
				border-radius: 10px;
				margin-top: -8px;
			}
		}

		.archive-video {
			width: 100%;
			height: calc(100vh - 110px);

			.media-control {
				width: 98%;
				margin: 0 auto;
			}
		}
	}

	@media screen and (max-width: 1020px) {
		.archive-page {
			.archive-panel {
				padding: 5px 1rem;

				&__title {
					h4 {
						font-size: 16px;
					}
				}
			}
		}
	}
</style>