import { apiClient, setAuthToken } from "./client";
import { authResponseSchema, userSchema } from "./schemas";
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  TelegramAuthRequest,
  UserResponse,
} from "./types";

export async function authenticateWithTelegram(
  initData: string,
  options?: { inviteCode?: string; language?: string },
): Promise<AuthResponse> {
  const payload: TelegramAuthRequest = {
    initData,
    inviteCode: options?.inviteCode,
    language: options?.language,
  };
  const { data } = await apiClient.post<AuthResponse>("/auth/telegram", payload);
  const parsed = authResponseSchema.parse(data);
  setAuthToken(parsed.token);
  return parsed;
}

export async function loginWithCredentials(
  payload: LoginRequest,
): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>("/auth/login", payload);
  const parsed = authResponseSchema.parse(data);
  setAuthToken(parsed.token);
  return parsed;
}

export async function registerWithCredentials(
  payload: RegisterRequest,
  options?: { persistSession?: boolean },
): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>(
    "/auth/register",
    payload,
  );
  const parsed = authResponseSchema.parse(data);
  if (options?.persistSession !== false) {
    setAuthToken(parsed.token);
  }
  return parsed;
}

export async function fetchCurrentUser(): Promise<UserResponse> {
  const { data } = await apiClient.get<UserResponse>("/auth/me");
  return userSchema.parse(data);
}

export type UpdateProfileRequest = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  country?: string;
  position?: string;
  specialization?: string;
  hourlyRate?: string;
  language?: string;
  timezone?: string;
  telegramUsername?: string;
};

export async function updateProfile(payload: UpdateProfileRequest): Promise<UserResponse> {
  const { data } = await apiClient.put<UserResponse>("/auth/me", payload);
  return userSchema.parse(data);
}

export function logout(): void {
  setAuthToken(null);
}
