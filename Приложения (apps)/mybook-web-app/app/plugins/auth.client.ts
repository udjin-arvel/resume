export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore();

  authStore.initAuth();
  await authStore.checkAuth();
});
