import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  approveWorker,
  blockWorker,
  createWorker,
  fetchAvailableWorkers,
  fetchWorker,
  fetchWorkerProjects,
  fetchWorkerResources,
  fetchWorkers,
  rejectWorker,
  returnWorkerApplication,
  unblockWorker,
  updateWorker,
  type ApplicationReviewPayload,
  type BlockWorkerPayload,
  type UpdateWorkerPayload,
  type WorkerListQuery,
} from "@/lib/api/workers";
import { queryKeys } from "@/lib/api/query-keys";

export function useWorkers(filters: WorkerListQuery = {}) {
  return useQuery({
    queryKey: queryKeys.workers.list(filters),
    queryFn: () => fetchWorkers(filters),
  });
}

export function useWorker(id: string) {
  return useQuery({
    queryKey: queryKeys.workers.detail(id),
    queryFn: () => fetchWorker(id),
    enabled: !!id,
  });
}

export function useWorkerProjects(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.workers.projects(id),
    queryFn: () => fetchWorkerProjects(id),
    enabled: !!id && enabled,
  });
}

export function useUpdateWorker(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateWorkerPayload) => updateWorker(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.workers.detail(id) });
      qc.invalidateQueries({ queryKey: queryKeys.workers.all });
    },
  });
}

export function useWorkerResources() {
  return useQuery({
    queryKey: queryKeys.workers.resources(),
    queryFn: fetchWorkerResources,
  });
}

export function useAvailableWorkers(projectId?: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.workers.available(projectId),
    queryFn: () => fetchAvailableWorkers(projectId),
    enabled,
  });
}

export function useApproveWorker() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: approveWorker,
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: queryKeys.workers.detail(id) });
      qc.invalidateQueries({ queryKey: queryKeys.workers.all });
    },
  });
}

export function useRejectWorker() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ApplicationReviewPayload }) =>
      rejectWorker(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.workers.detail(id) });
      qc.invalidateQueries({ queryKey: queryKeys.workers.all });
    },
  });
}

export function useReturnWorkerApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ApplicationReviewPayload }) =>
      returnWorkerApplication(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.workers.detail(id) });
      qc.invalidateQueries({ queryKey: queryKeys.workers.all });
    },
  });
}

export function useBlockWorker() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: BlockWorkerPayload }) =>
      blockWorker(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.workers.detail(id) });
      qc.invalidateQueries({ queryKey: queryKeys.workers.all });
      qc.invalidateQueries({ queryKey: queryKeys.auth.me() });
    },
  });
}

export function useUnblockWorker() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: unblockWorker,
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: queryKeys.workers.detail(id) });
      qc.invalidateQueries({ queryKey: queryKeys.workers.all });
      qc.invalidateQueries({ queryKey: queryKeys.auth.me() });
    },
  });
}

export function useCreateWorker() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createWorker,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.workers.all }),
  });
}
