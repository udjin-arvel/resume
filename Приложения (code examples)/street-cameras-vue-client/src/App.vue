<template>
	<div class="w-100">
		<div class="row">
			<nav class="navbar navbar-dark bg-dark">
				<div class="container-fluid">
					<router-link class="navbar-brand px-2" to="/">
						<img src="/logo.png" alt="ООО Фридом">
						<span>Видеонаблюдение</span>
					</router-link>

					<ul class="navbar-nav d-flex flex-row" v-if="$store.getters.isAuth">
						<li class="nav-item px-2">
							<router-link class="nav-link" :class="{ 'active': $route.name === 'cameras' }" to="/cameras">
								Список камер
							</router-link>
						</li>
						<li class="nav-item px-2">
							<router-link class="nav-link" :class="{ 'active': $route.name === 'my-cameras' }" to="/my-cameras">
								Мои камеры
							</router-link>
						</li>
						<li class="nav-item px-2">
							<div class="nav-link" role="button" @click="logout">Выйти</div>
						</li>
						<li class="nav-item px-2">
							<div
								class="nav-link"
								:class="{ 'active': isProfileInfoShow }"
								role="button"
								@click="isProfileInfoShow = !isProfileInfoShow"
							>
								<i class="bi bi-person-circle"></i>
							</div>
						</li>
					</ul>

          <ul class="navbar-nav d-flex flex-row" v-else>
            <li class="nav-item px-2">
              <router-link class="nav-link" :class="{ 'active': $route.name === 'home' }" to="/login">Войти</router-link>
            </li>
          </ul>
				</div>
			</nav>
		</div>

		<div class="profile-card" :class="{ '_visible': isProfileInfoShow }">
			<div class="profile-card__close" role="button" @click="isProfileInfoShow = false">&times;</div>
			<div class="profile-card__login"><strong>Пользователь: </strong>{{ $store.getters.user?.login }}</div>
			<div class="profile-card__address"><strong>Адрес: </strong>{{ $store.getters.user?.address?.full_address }}</div>
		</div>

		<div class="view-wrapper">
			<router-view/>
		</div>

		<div class="container-fluid footer">
			<a class="original-site" href="http://lk.freedom1.ru" target="_blank">© Группа компаний «Фридом» {{ new Date().getFullYear() }}</a>
			<span class="contacts">Телефон абонентской службы +7 (800) 333-88-13</span>
		</div>

		<vue-final-modal name="confirm-modal" v-model="isConfirmModalShow">
			<dialog-modal :data="confirmModalData" @closeModal="isConfirmModalShow = false" />
		</vue-final-modal>

		<loading :is-full-page="true" background-color="#333" :active="$store.getters.isLoading"></loading>
	</div>
</template>

<script>
  import {defineComponent} from 'vue';
  import DialogModal from './components/widgets/DialogModal.vue';
  import Loading from 'vue3-loading-overlay';

  export default defineComponent({
    name: 'App',

    data: () => ({
      confirmModalData:   {},
      isConfirmModalShow: false,
	    isProfileInfoShow: false,
    }),

    methods: {
      confirmDialog(msg, yes, no, callback) {
        yes = typeof yes === 'string' ? yes : 'Подтвердить';

        if (no) {
          no = typeof no === 'string' ? no : 'Отмена';
        }
        if (!callback) {
          callback = () => {};
        }

        this.confirmModalData = {msg, yes, no, callback};
        this.isConfirmModalShow = true;
      },
	    logout() {
        this.$store.commit('SET_USER', null);
        this.$store.commit('FILTER_ONLY_PUBLIC_CAMERAS');
        this.$router.push('/logout');
	    },
    },

	  beforeMount() {
      this.$store.dispatch('GET_SERVER_OFFSET');

      if (this.$store.getters.isAuth) {
        this.$store.dispatch('GET_CONTRACT');
      }
	  },

    components: {
      DialogModal,
      Loading,
    },
  });
</script>

<style lang="less">
	@import './assets/less/app.less';

	.view-wrapper {
		min-height: calc(100vh - 110px);
		overflow-y: auto;
	}

	.footer {
		height: 50px;
	}
</style>
