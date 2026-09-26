import { createRouter, createWebHistory } from 'vue-router'
import { AuthService } from '../services/AuthService';

import LoginPage from '../components/pages/LoginPage.vue';
import CamerasPage from '../components/pages/CamerasPage.vue';
import ArchivePage from '../components/pages/ArchivePage.vue';

const routes = [
  {
    path: '/',
    name: 'home',
    beforeEnter: function() {
      return AuthService.getAccessToken() ? { path: '/my-cameras' } : { path: '/cameras' };
    },
  },
  {
    path: '/cameras',
    name: 'cameras',
    component: CamerasPage,
  },
  {
    path: '/archive/:id',
    name: 'archive',
    component: ArchivePage,
  },
  {
    path: '/my-cameras',
    name: 'my-cameras',
    component: CamerasPage,
  },
  {
    path: '/login',
    name: 'login',
    component: LoginPage,
  },
  {
    path: "/logout",
    name: "logout",
    component: {
      beforeRouteEnter(to, from, next) {
        AuthService.logout();
        next({ path: '/' });
      }
    }
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});

export default router;
