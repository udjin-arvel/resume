<template>
  <div class="page login-page d-flex align-items-center">
    <div class="container">
      <div class="row">
        <div class="col-md-6 col-sm-12">
          <h4 class="mb-3"><i class="icon bi-lock-fill"></i> Вход в систему</h4>
          <form @submit.prevent="auth">
            <div class="mb-3">
              <input type="text" class="form-control" placeholder="Пользователь" v-model="login">
            </div>
            <div class="mb-3">
              <input type="password" class="form-control" placeholder="Пароль" v-model="password">
            </div>
            <button type="submit" class="btn btn-primary">
              <i class="icon bi-box-arrow-in-right"></i> Войти
            </button>
          </form>
        </div>
        <div class="col-md-6 col-sm-12">
          <h2 class="mt-3">
            <div class="arrow-icon"><i class="icon bi-arrow-left"></i></div>
            Введите имя и пароль для входа
          </h2>
          <p>Имя и пароль можно выяснить у вашего поставщика услуг видеонаблюдения.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {defineComponent} from 'vue';

export default defineComponent({
  name: 'LoginPage',

  data: () => ({
    login: '',
    password: '',
  }),

  methods: {
    async auth() {
      if (this.login && this.password) {
        this.$store.commit('TOGGLE_LOADING', true);
        const data = await this.$store.dispatch('AUTH', {login: this.login, password: this.password});

        if (data) {
          await this.$store.dispatch('GET_CONTRACT');
          await this.$store.dispatch('GET_CAMERAS');
          this.$router.push('/my-cameras');
        } else {
          this.$root.confirmDialog('Авторизация не удалась. Попробуйте другой логин или пароль.', 'Закрыть');
        }

        this.$store.commit('TOGGLE_LOADING', false);
      } else {
        this.$root.confirmDialog('Укажите логин и пароль.', 'Закрыть');
      }
    },
  }
});
</script>

<style lang="less" scoped>
@media (max-width: 768px) {
  .arrow-icon {
    display: inline-block;
    transform: rotate(90deg);
  }
}
</style>
