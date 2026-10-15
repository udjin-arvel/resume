<template>
    <div class="page welcome-page d-flex align-items-center justify-content-center">
        <div class="card" style="width: 18rem;">
            <div class="card-body text-center">
                <p class="card-text">Для входа в систему необходимо ввести имя пользователя и пароль. Выяснить эти данные можно у своего поставщика услуг.</p>
                <router-link to="/login" class="btn btn-primary">
                    <i className="icon bi-lock-fill"></i> Войти
                </router-link>
            </div>
        </div>
    </div>
</template>

<script>
import { defineComponent } from 'vue';

export default defineComponent({
    name: 'WelcomePage',
});
</script>
  