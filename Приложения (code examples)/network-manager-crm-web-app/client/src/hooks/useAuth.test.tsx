import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import type { ReactNode } from "react";

vi.mock("@/lib/api/auth", () => ({
  loginWithCredentials: vi.fn().mockResolvedValue({
    token: "t",
    user: {
      id: "1",
      role: "manager",
      status: "active",
      firstName: "Admin",
      lastName: "User",
      email: "a@b.com",
      phone: "",
    },
  }),
  registerWithCredentials: vi.fn(),
  authenticateWithTelegram: vi.fn(),
  fetchCurrentUser: vi.fn(),
  logout: vi.fn().mockResolvedValue(undefined),
}));

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
}

describe("useAuth", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("login updates authenticated state", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      await result.current.login({ email: "a@b.com", password: "password" });
    });
    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.role).toBe("manager");
    });
  });
});
