export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return;

  const authStore = useAuthStore();

  if (!authStore.isAuthenticated) {
    authStore.initAuth();
  }

  if (!authStore.isAuthenticated) {
    return navigateTo('/auth');
  }

  if (!authStore.canAccessAdmin) {
    return navigateTo('/');
  }

  if (to.path.startsWith('/admin/users') && !authStore.isAdmin) {
    return navigateTo('/admin');
  }
});
