import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  authenticateWithTelegram,
  fetchCurrentUser,
  loginWithCredentials,
  logout as apiLogout,
  registerWithCredentials,
  updateProfile,
  type UpdateProfileRequest,
} from "@/lib/api/auth";
import { getAuthToken, setLocaleProvider, setOnUnauthorized } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import { useCurrentUser } from "@/lib/api/hooks/useAuth";
import type {
  LoginRequest,
  RegisterRequest,
  UserResponse,
  UserRole,
} from "@/lib/api/types";
import { i18n } from "@/i18n";
import { showError } from "@/lib/toast";

type AuthMethod = "telegram" | "credentials" | null;

type AuthContextValue = {
  user: UserResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  role: UserRole | null;
  authMethod: AuthMethod;
  login: (payload: LoginRequest) => Promise<UserResponse>;
  register: (
    payload: RegisterRequest,
    options?: { persistSession?: boolean },
  ) => Promise<UserResponse>;
  loginTelegram: (
    initData?: string,
    options?: { inviteCode?: string; language?: string },
  ) => Promise<UserResponse>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<UserResponse | null>;
  updateUserProfile: (payload: UpdateProfileRequest) => Promise<UserResponse>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const hasToken = typeof window !== "undefined" && !!getAuthToken();
  const { data: user, isLoading, refetch } = useCurrentUser(hasToken);
  const authMethod: AuthMethod = user?.telegramId
    ? "telegram"
    : user
      ? "credentials"
      : null;

  useEffect(() => {
    setLocaleProvider(() => i18n.language || "ru");
    setOnUnauthorized(() => {
      queryClient.setQueryData(queryKeys.auth.me(), null);
    });
  }, [queryClient]);

  useEffect(() => {
    const lang = user?.language?.trim();
    if (!lang || lang === i18n.language) return;
    void i18n.changeLanguage(lang);
  }, [user?.language]);

  const refreshUser = useCallback(async () => {
    if (!getAuthToken()) return null;
    const result = await refetch();
    return result.data ?? null;
  }, [refetch]);

  const login = useCallback(
    async (payload: LoginRequest) => {
      try {
        const data = await loginWithCredentials(payload);
        queryClient.setQueryData(queryKeys.auth.me(), data.user);
        return data.user;
      } catch (error) {
        showError(error);
        throw error;
      }
    },
    [queryClient],
  );

  const register = useCallback(
    async (payload: RegisterRequest, options?: { persistSession?: boolean }) => {
      try {
        const data = await registerWithCredentials(payload, options);
        if (options?.persistSession !== false) {
          queryClient.setQueryData(queryKeys.auth.me(), data.user);
        }
        return data.user;
      } catch (error) {
        showError(error);
        throw error;
      }
    },
    [queryClient],
  );

  const loginTelegram = useCallback(
    async (
      initData?: string,
      options?: { inviteCode?: string; language?: string },
    ) => {
      try {
        const data = initData ?? "";
        if (!data) throw new Error("Telegram initData is empty");
        const auth = await authenticateWithTelegram(data, options);
        queryClient.setQueryData(queryKeys.auth.me(), auth.user);
        return auth.user;
      } catch (error) {
        showError(error);
        throw error;
      }
    },
    [queryClient],
  );

  const logout = useCallback(async () => {
    apiLogout();
    queryClient.setQueryData(queryKeys.auth.me(), null);
    await queryClient.removeQueries({ queryKey: queryKeys.auth.all });
  }, [queryClient]);

  const updateUserProfile = useCallback(
    async (payload: UpdateProfileRequest) => {
      try {
        const updated = await updateProfile(payload);
        queryClient.setQueryData(queryKeys.auth.me(), updated);
        return updated;
      } catch (error) {
        showError(error);
        throw error;
      }
    },
    [queryClient],
  );

  useEffect(() => {
    if (!user || user.status === "blocked") return;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!tz || tz === user.timezone) return;
    void updateProfile({ timezone: tz })
      .then((updated) => queryClient.setQueryData(queryKeys.auth.me(), updated))
      .catch(() => {});
  }, [user, queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: user ?? null,
      isAuthenticated: !!user,
      isLoading: hasToken && isLoading,
      role: user?.role ?? null,
      authMethod,
      login,
      register,
      loginTelegram,
      logout,
      refreshUser,
      updateUserProfile,
    }),
    [
      user,
      hasToken,
      isLoading,
      authMethod,
      login,
      register,
      loginTelegram,
      logout,
      refreshUser,
      updateUserProfile,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export async function ensureAuth(
  queryClient: ReturnType<typeof useQueryClient>,
): Promise<UserResponse | null> {
  if (!getAuthToken()) return null;
  try {
    return await queryClient.fetchQuery({
      queryKey: queryKeys.auth.me(),
      queryFn: fetchCurrentUser,
      staleTime: 60_000,
    });
  } catch {
    return null;
  }
}
