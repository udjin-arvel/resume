import { useQuery } from "@tanstack/react-query";
import {
  fetchFinanceCategories,
  fetchFinanceOverview,
  fetchFinanceProject,
  fetchFinanceProjects,
  type FinanceScopeQuery,
  fetchFinanceWorker,
  fetchFinanceWorkers,
} from "@/lib/api/finance";
import { fetchWorkerFinanceMine } from "@/lib/api/worker-finance";
import { queryKeys } from "@/lib/api/query-keys";

export function useFinanceOverview(filters: FinanceScopeQuery = {}) {
  return useQuery({
    queryKey: queryKeys.finance.overview(filters),
    queryFn: () => fetchFinanceOverview(filters),
  });
}

export function useFinanceProjects(filters: FinanceScopeQuery = {}) {
  return useQuery({
    queryKey: queryKeys.finance.projects(filters),
    queryFn: () => fetchFinanceProjects(filters),
  });
}

export function useFinanceProject(id: string) {
  return useFinanceProjectQuery(id, true);
}

export function useFinanceProjectQuery(id: string, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.finance.project(id),
    queryFn: () => fetchFinanceProject(id),
    enabled: !!id && enabled,
  });
}

export function useFinanceWorkers(filters: FinanceScopeQuery = {}) {
  return useQuery({
    queryKey: queryKeys.finance.workers(filters),
    queryFn: () => fetchFinanceWorkers(filters),
  });
}

export function useFinanceWorker(id: string) {
  return useFinanceWorkerQuery(id, true);
}

export function useFinanceWorkerQuery(id: string, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.finance.worker(id),
    queryFn: () => fetchFinanceWorker(id),
    enabled: !!id && enabled,
  });
}

export function useFinanceCategories(filters: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: queryKeys.finance.categories(filters),
    queryFn: () => fetchFinanceCategories(filters),
  });
}

export function useWorkerFinanceMine() {
  return useQuery({
    queryKey: queryKeys.finance.mine(),
    queryFn: fetchWorkerFinanceMine,
  });
}
