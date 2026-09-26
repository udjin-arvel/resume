import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createClient,
  fetchClient,
  fetchClientDocuments,
  fetchClientFinance,
  fetchClientProjects,
  fetchClients,
  updateClient,
  type ClientListQuery,
} from "@/lib/api/clients";
import { queryKeys } from "@/lib/api/query-keys";

export function useClients(filters: ClientListQuery = {}) {
  return useQuery({
    queryKey: queryKeys.clients.list(filters),
    queryFn: () => fetchClients(filters),
  });
}

export function useClient(id: string) {
  return useQuery({
    queryKey: queryKeys.clients.detail(id),
    queryFn: () => fetchClient(id),
    enabled: !!id,
  });
}

export function useClientProjects(clientId: string) {
  return useQuery({
    queryKey: queryKeys.clients.projects(clientId),
    queryFn: () => fetchClientProjects(clientId),
    enabled: !!clientId,
  });
}

export function useClientDocuments(clientId: string) {
  return useQuery({
    queryKey: queryKeys.clients.documents(clientId),
    queryFn: () => fetchClientDocuments(clientId),
    enabled: !!clientId,
  });
}

export function useClientFinance(clientId: string) {
  return useQuery({
    queryKey: queryKeys.clients.finance(clientId),
    queryFn: () => fetchClientFinance(clientId),
    enabled: !!clientId,
  });
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createClient,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.clients.all }),
  });
}

export function useUpdateClient(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => updateClient(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.clients.detail(id) });
      qc.invalidateQueries({ queryKey: queryKeys.clients.all });
    },
  });
}
