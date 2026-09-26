import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createEstimate,
  exportEstimateExcel,
  exportEstimatePdf,
  fetchEstimate,
  fetchEstimates,
  updateEstimate,
  updateEstimateStatus,
  type EstimateListQuery,
} from "@/lib/api/estimates";
import { queryKeys } from "@/lib/api/query-keys";

export function useEstimates(filters: EstimateListQuery = {}) {
  return useQuery({
    queryKey: queryKeys.estimates.list(filters),
    queryFn: () => fetchEstimates(filters),
  });
}

export function useEstimate(id: string) {
  return useQuery({
    queryKey: queryKeys.estimates.detail(id),
    queryFn: () => fetchEstimate(id),
    enabled: !!id,
  });
}

export function useCreateEstimate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createEstimate,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.estimates.all }),
  });
}

export function useUpdateEstimate(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => updateEstimate(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.estimates.detail(id) });
      qc.invalidateQueries({ queryKey: queryKeys.estimates.all });
    },
  });
}

export function useUpdateEstimateStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (status: string) => updateEstimateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.estimates.detail(id) });
      qc.invalidateQueries({ queryKey: queryKeys.estimates.all });
    },
  });
}

export function useExportEstimatePdf(id: string) {
  return useMutation({ mutationFn: () => exportEstimatePdf(id) });
}

export function useExportEstimateExcel(id: string) {
  return useMutation({ mutationFn: () => exportEstimateExcel(id) });
}
