import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  approveSupervisorReport,
  approveWorkerReport,
  attentionSupervisorReport,
  commentSupervisorReport,
  createSupervisorReport,
  createWorkerReport,
  fetchSupervisorReport,
  fetchSupervisorReports,
  fetchWorkerReport,
  fetchWorkerReports,
  patchSupervisorReport,
  rejectWorkerReport,
  remindWorkerReport,
  revertWorkerReportReturn,
  transcribeSupervisorReport,
  updateWorkerReport,
} from "@/lib/api/reports";
import { queryKeys } from "@/lib/api/query-keys";

export function useWorkerReports(filters: Record<string, unknown> = {}, enabled = true) {
  return useQuery({
    queryKey: queryKeys.reports.worker.list(filters),
    queryFn: () => fetchWorkerReports(filters),
    enabled,
  });
}

export function useWorkerReport(id: string) {
  return useQuery({
    queryKey: queryKeys.reports.worker.detail(id),
    queryFn: () => fetchWorkerReport(id),
    enabled: !!id,
  });
}

export function useCreateWorkerReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createWorkerReport,
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.reports.worker.lists() }),
  });
}

export function useUpdateWorkerReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      updateWorkerReport(id, payload),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.reports.all }),
  });
}

export function useApproveWorkerReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: approveWorkerReport,
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.reports.all }),
  });
}

export function useRejectWorkerReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment?: string }) =>
      rejectWorkerReport(id, comment),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.reports.all }),
  });
}

export function useRevertWorkerReportReturn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: revertWorkerReportReturn,
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.reports.all }),
  });
}

export function useRemindWorkerReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: remindWorkerReport,
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.reports.all }),
  });
}

export function useSupervisorReports(filters: Record<string, unknown> = {}, enabled = true) {
  return useQuery({
    queryKey: queryKeys.reports.supervisor.list(filters),
    queryFn: () => fetchSupervisorReports(filters),
    enabled,
  });
}

export function useSupervisorReport(id: string) {
  return useQuery({
    queryKey: queryKeys.reports.supervisor.detail(id),
    queryFn: () => fetchSupervisorReport(id),
    enabled: !!id,
  });
}

export function useApproveSupervisorReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: approveSupervisorReport,
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.reports.all }),
  });
}

export function useAttentionSupervisorReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: attentionSupervisorReport,
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.reports.all }),
  });
}

export function useCommentSupervisorReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment: string }) =>
      commentSupervisorReport(id, comment),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.reports.all }),
  });
}

export function useCreateSupervisorReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createSupervisorReport,
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.reports.supervisor.lists() }),
  });
}

export function usePatchSupervisorReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      patchSupervisorReport(id, payload),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.reports.all }),
  });
}

export function useTranscribeSupervisorReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, transcription }: { id: string; transcription: string }) =>
      transcribeSupervisorReport(id, transcription),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.reports.all }),
  });
}
