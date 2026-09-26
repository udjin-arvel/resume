export const DEFAULT_AVATAR = '/avatar.png';

export function resolveAvatarUrl(avatar: string | null | undefined): string {
  if (!avatar) {
    return DEFAULT_AVATAR;
  }

  if (avatar.startsWith('http') || avatar.startsWith('data:') || avatar === DEFAULT_AVATAR) {
    return avatar;
  }

  // Загрузки проксируются через Nuxt (/uploads → API) — относительный путь работает везде
  if (avatar.startsWith('/uploads')) {
    return avatar;
  }

  const config = useRuntimeConfig();
  const apiBase = config.public.apiBase || 'http://localhost:3001';

  if (avatar.startsWith('uploads/')) {
    return `${apiBase}/${avatar}`;
  }

  return avatar;
}

export function useUserAvatar() {
  return {
    DEFAULT_AVATAR,
    resolveAvatarUrl,
  };
}
