import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchActivity,
  fetchProblemProjects,
  fetchUrgentActions,
} from "@/lib/api/dashboard";
import { queryKeys } from "@/lib/api/query-keys";

const ACTIVITY_PREVIEW_SIZE = 3;
const ACTIVITY_PAGE_SIZE = 20;

export function useUrgentActions() {
  return useQuery({
    queryKey: queryKeys.dashboard.urgent(),
    queryFn: fetchUrgentActions,
  });
}

export function useProblemProjects() {
  return useQuery({
    queryKey: queryKeys.dashboard.problemProjects(),
    queryFn: fetchProblemProjects,
  });
}

export function useDashboardActivity() {
  return useQuery({
    queryKey: queryKeys.dashboard.activity({ page: 1, pageSize: ACTIVITY_PREVIEW_SIZE }),
    queryFn: () => fetchActivity({ page: 1, pageSize: ACTIVITY_PREVIEW_SIZE }),
  });
}

export function useActivityInfinite(pageSize = ACTIVITY_PAGE_SIZE) {
  return useInfiniteQuery({
    queryKey: queryKeys.dashboard.activity({ infinite: true, pageSize }),
    queryFn: ({ pageParam }) => fetchActivity({ page: pageParam, pageSize }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.page < last.totalPages ? last.page + 1 : undefined,
  });
}

export function useInvalidateDashboard() {
  const qc = useQueryClient();
  return () =>
    qc.invalidateQueries({ queryKey: queryKeys.dashboard.all });
}
