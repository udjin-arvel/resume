import axios, { type AxiosError } from "axios";

const baseURL =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.DEV ? "/api/v1" : "http://localhost:8080/api/v1");

let localeProvider: (() => string) | null = null;
let onUnauthorized: (() => void) | null = null;

export function setLocaleProvider(fn: () => string) {
  localeProvider = fn;
}

export function setOnUnauthorized(fn: () => void) {
  onUnauthorized = fn;
}

export const apiClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("crm_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const locale = localeProvider?.() ?? "ru";
    config.headers["Accept-Language"] = locale;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error?: string; details?: Record<string, string> }>) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("crm_token");
      onUnauthorized?.();
    }
    return Promise.reject(error);
  },
);

export function setAuthToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem("crm_token", token);
  } else {
    localStorage.removeItem("crm_token");
  }
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("crm_token");
}

export class ApiError extends Error {
  status: number;
  details?: Record<string, string>;

  constructor(message: string, status: number, details?: Record<string, string>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export function parseApiError(error: unknown): string {
  if (typeof error === "string") return error;
  if (error instanceof ApiError) return error.message;
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { error?: string; details?: Record<string, string> }
      | undefined;
    if (data?.error) return data.error;
    if (error.message) return error.message;
  }
  if (error instanceof Error) return error.message;
  return "Unknown error";
}

export async function checkHealth(): Promise<{ status: string }> {
  const healthBase = import.meta.env.DEV
    ? "http://localhost:8080"
    : baseURL.replace(/\/api\/v1$/, "");
  const { data } = await axios.get(`${healthBase}/health`);
  return data;
}
