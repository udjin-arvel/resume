import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import axios from "axios";
import { vfmPlugin } from "vue-final-modal";
import * as VideoPlayer from "@videojs-player/vue";
import Vue3TouchEvents from "vue3-touch-events";

import { AuthService } from "./services/AuthService";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "vue-select/dist/vue-select.css";
import "vue3-loading-overlay/dist/vue3-loading-overlay.css";
import "video.js/dist/video-js.css";
import "leaflet/dist/leaflet.css";

// Add auth interceptor
axios.interceptors.request.use(
  (config) => {
    const token = AuthService.getAccessToken();

    if (token) {
      config.headers["Authorization"] = "Bearer " + token;
    }

    return config;
  },
  async (error) => {
    if (error.response.status === 401 && !error.config._retry) {
      error.config._retry = true;

      if (await AuthService.refreshToken()) {
        const token = AuthService.getAccessToken();
        axios.defaults.headers.common["Authorization"] = "Bearer " + token;
      }
    }
  },
);

// Response interceptor - обрабатывает ошибки ответов
axios.interceptors.response.use(
  (response) => response, // Просто возвращаем успешный ответ
  async (error) => {
    const originalRequest = error.config;

    // Проверяем, что это ошибка 401 и мы еще не пробовали обновить токен
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Пытаемся обновить токен
        const refreshed = await AuthService.refreshToken();

        if (refreshed) {
          // Получаем новый токен
          const newToken = AuthService.getAccessToken();

          // Обновляем заголовок для повторного запроса
          originalRequest.headers["Authorization"] = "Bearer " + newToken;

          // Повторяем оригинальный запрос
          return axios(originalRequest);
        } else {
          // Не удалось обновить токен - разлогиниваем
          AuthService.logout();
          router.push("/login");
          return Promise.reject(error);
        }
      } catch (refreshError) {
        // Ошибка при обновлении токена
        AuthService.logout();
        router.push("/login");
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);

const app = createApp(App)
  .use(store)
  .use(router)
  .use(VideoPlayer)
  .use(vfmPlugin)
  .use(Vue3TouchEvents);

app.mount("#app");
