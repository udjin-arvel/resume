import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createEstimateFromTemplate,
  createEstimateTemplate,
  fetchEstimateTemplates,
} from "@/lib/api/estimate-templates";
import { queryKeys } from "@/lib/api/query-keys";

export function useEstimateTemplates() {
  return useQuery({
    queryKey: queryKeys.estimates.templates(),
    queryFn: fetchEstimateTemplates,
  });
}

export function useCreateEstimateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createEstimateTemplate,
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.estimates.templates() }),
  });
}

export function useCreateFromTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createEstimateFromTemplate,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.estimates.all }),
  });
}
