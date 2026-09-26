export const useApi = () => {
  const config = useRuntimeConfig();

  const apiClient = $fetch.create({
    baseURL: '/api',
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

  const apiFormData = async (url: string, options: { method?: string; body: FormData }) => {
    return $fetch(url, {
      baseURL: '/api',
      credentials: 'include',
      method: options.method || 'POST',
      body: options.body,
    });
  };

  const uploadsUrl = (config.public.apiBase || 'http://localhost:3001') + '/uploads';

  return {
    api: apiClient,
    apiFormData,
    uploadsUrl,
  };
};
