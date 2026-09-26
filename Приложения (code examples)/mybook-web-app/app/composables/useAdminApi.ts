export const useAdminApi = () => {
  const adminApi = $fetch.create({
    baseURL: '/api/admin',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    onResponseError({ response }) {
      if (import.meta.client && response.status === 401) {
        const authStore = useAuthStore();
        authStore.clearSession();
        navigateTo('/auth');
      }
    },
  });

  const adminFormData = async (path: string, body: FormData, method = 'POST') => {
    return $fetch(path, {
      baseURL: '/api/admin',
      credentials: 'include',
      method,
      body,
    });
  };

  return { adminApi, adminFormData };
};
