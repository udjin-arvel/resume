import { useQuery } from "@tanstack/react-query";
import { checkHealth } from "@/lib/api/client";
import { fetchCurrentUser } from "@/lib/api/auth";
import { queryKeys } from "@/lib/api/query-keys";
import { getAuthToken } from "@/lib/api/client";

export function useCurrentUser(enabled = true) {
  return useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: fetchCurrentUser,
    enabled: enabled && !!getAuthToken(),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useHealth() {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: checkHealth,
    enabled: import.meta.env.DEV,
    retry: false,
  });
}
