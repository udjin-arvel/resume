import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  assignTool,
  calibrateTool,
  createTool,
  fetchTool,
  fetchTools,
  reportToolProblem,
  resolveToolProblem,
  returnTool,
  updateTool,
  type ToolListQuery,
} from "@/lib/api/tools";
import { queryKeys } from "@/lib/api/query-keys";

export function useTools(filters: ToolListQuery = {}, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.tools.list(filters),
    queryFn: () => fetchTools(filters),
    enabled: options?.enabled ?? true,
  });
}

export function useTool(id: string) {
  return useQuery({
    queryKey: queryKeys.tools.detail(id),
    queryFn: () => fetchTool(id),
    enabled: !!id,
  });
}

export function useCreateTool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createTool,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.tools.all }),
  });
}

export function useUpdateTool(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => updateTool(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.tools.detail(id) });
      qc.invalidateQueries({ queryKey: queryKeys.tools.all });
    },
  });
}

export function useAssignTool(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => assignTool(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.tools.detail(id) });
      qc.invalidateQueries({ queryKey: queryKeys.tools.all });
    },
  });
}

export function useAssignToolsToProject(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      toolIds,
      responsibleUserId,
    }: {
      toolIds: string[];
      responsibleUserId: string;
    }) => {
      for (const id of toolIds) {
        await assignTool(id, { projectId, responsibleUserId });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.tools.all });
      qc.invalidateQueries({ queryKey: queryKeys.projects.all });
    },
  });
}

export function useReturnTool(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => returnTool(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.tools.detail(id) });
      qc.invalidateQueries({ queryKey: queryKeys.tools.all });
    },
  });
}

export function useCalibrateTool(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => calibrateTool(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.tools.detail(id) });
      qc.invalidateQueries({ queryKey: queryKeys.tools.all });
    },
  });
}

export function useReportToolProblem(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => reportToolProblem(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.tools.detail(id) });
      qc.invalidateQueries({ queryKey: queryKeys.tools.all });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
}

export function useResolveToolProblem(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => resolveToolProblem(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.tools.detail(id) });
      qc.invalidateQueries({ queryKey: queryKeys.tools.all });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
}
