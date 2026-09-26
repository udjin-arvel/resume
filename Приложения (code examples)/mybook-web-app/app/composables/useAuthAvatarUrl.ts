import { storeToRefs } from 'pinia';
import { resolveAvatarUrl } from '~/composables/useUserAvatar';

/** URL аватара текущего пользователя из auth store (единый источник для sidebar, profile и т.д.) */
export function useAuthAvatarUrl() {
  const authStore = useAuthStore();
  const { user } = storeToRefs(authStore);

  const avatarUrl = computed(() => resolveAvatarUrl(user.value?.avatar));

  return {
    avatarUrl,
    avatarPath: computed(() => user.value?.avatar ?? null),
  };
}
