import { defineStore } from 'pinia';
import { getFetchErrorMessage } from '~/utils/fetchError';

interface User {
  id: number
  login: string
  email: string
  status: string
  level: number
  experience: number
  tokens: number
  info?: string
  avatar?: string | null
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
}

let checkAuthInFlight: Promise<boolean> | null = null;

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    isAuthenticated: false,
    loading: false,
  }),

  getters: {
    isAdmin: (state) => state.user?.status === 'ADMIN',
    isModerator: (state) => state.user?.status === 'MODERATOR',
    isWriter: (state) => state.user?.status === 'WRITER',
    canEdit: (state) => ['ADMIN', 'MODERATOR', 'WRITER'].includes(state.user?.status || ''),
    canAccessAdmin: (state) => ['ADMIN', 'MODERATOR'].includes(state.user?.status || ''),
  },

  actions: {
    setUser(user: User) {
      this.user = user;
      this.isAuthenticated = true;
      if (import.meta.client) {
        localStorage.setItem('user', JSON.stringify(user));
      }
    },

    updateAvatar(avatar: string | null) {
      if (!this.user) return;
      this.user = { ...this.user, avatar };
      if (import.meta.client) {
        localStorage.setItem('user', JSON.stringify(this.user));
      }
    },

    clearSession() {
      this.user = null;
      this.isAuthenticated = false;
      if (import.meta.client) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    },

    async login(credentials: { login?: string; email?: string; password: string }) {
      this.loading = true;
      try {
        const body = {
          login: credentials.login || credentials.email,
          password: credentials.password,
        };

        const response = await $fetch('/api/auth/login', {
          method: 'POST',
          credentials: 'include',
          body,
        });

        if (response.success) {
          this.setUser(response.data.user);
          return { success: true };
        }

        return { success: false, error: typeof response.error === 'string' ? response.error : 'Ошибка авторизации' };
      } catch (error: unknown) {
        console.error('Login error:', error);
        return {
          success: false,
          error: getFetchErrorMessage(error, 'Ошибка авторизации'),
        };
      } finally {
        this.loading = false;
      }
    },

    async register(userData: { login: string; email: string; password: string; info?: string }) {
      this.loading = true;
      try {
        const response = await $fetch('/api/auth/register', {
          method: 'POST',
          credentials: 'include',
          body: userData,
        });

        if (response.success) {
          this.setUser(response.data.user);
          return { success: true };
        }

        return { success: false, error: typeof response.error === 'string' ? response.error : 'Ошибка регистрации' };
      } catch (error: unknown) {
        console.error('Register error:', error);
        return {
          success: false,
          error: getFetchErrorMessage(error, 'Ошибка регистрации'),
        };
      } finally {
        this.loading = false;
      }
    },

    async logout() {
      try {
        await $fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include',
        });
      } catch (error) {
        console.error('Logout error:', error);
      } finally {
        this.clearSession();
      }
    },

    async checkAuth() {
      if (!import.meta.client) return false;

      if (checkAuthInFlight) {
        return checkAuthInFlight;
      }

      checkAuthInFlight = (async () => {
        try {
          const response = await $fetch<{ success: boolean; data: User }>('/api/auth/profile', {
            credentials: 'include',
          });

          if (response.success && response.data) {
            this.setUser(response.data);
            return true;
          }

          this.clearSession();
          return false;
        } catch (error: unknown) {
          const status = (error as { statusCode?: number; status?: number })?.statusCode
            ?? (error as { status?: number })?.status;

          if (status === 401) {
            this.clearSession();
            return false;
          }

          console.error('Auth check error:', error);
          return this.isAuthenticated;
        } finally {
          checkAuthInFlight = null;
        }
      })();

      return checkAuthInFlight;
    },

    async updateProfile(profileData: Partial<User>) {
      try {
        const response = await $fetch('/api/auth/profile', {
          method: 'PUT',
          credentials: 'include',
          body: profileData,
        });

        if (response.success) {
          this.user = { ...this.user, ...response.data };
          if (import.meta.client) {
            localStorage.setItem('user', JSON.stringify(this.user));
          }
          return { success: true };
        }

        return { success: false, error: typeof response.error === 'string' ? response.error : 'Ошибка обновления профиля' };
      } catch (error: unknown) {
        console.error('Profile update error:', error);
        return {
          success: false,
          error: getFetchErrorMessage(error, 'Ошибка обновления профиля'),
        };
      }
    },

    initAuth() {
      if (!import.meta.client) return;

      localStorage.removeItem('token');
      // Пользователя всегда подтягиваем через checkAuth — не кэшируем устаревший профиль из localStorage.
    },

    applyAvatarFromUpload(payload: { user?: User | null; avatar?: string | null }) {
      const avatar = payload.user?.avatar ?? payload.avatar ?? null;

      if (payload.user) {
        this.setUser({ ...payload.user, avatar });
        return;
      }

      this.updateAvatar(avatar);
    },
  },
});
