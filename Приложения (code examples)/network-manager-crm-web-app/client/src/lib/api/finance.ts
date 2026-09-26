import { apiClient } from "./client";
import {
  expenseCategorySchema,
  financeOverviewSchema,
  projectFinanceSchema,
  workerFinanceMineSchema,
  workerFinanceSchema,
} from "./schemas";
import { z } from "zod";

export type FinanceScopeQuery = {
  projectStatus?: "all" | "active" | "completed";
  projectId?: string;
};

export async function fetchFinanceOverview(query: FinanceScopeQuery = {}) {
  const { data } = await apiClient.get("/finance/overview", { params: query });
  return financeOverviewSchema.parse(data);
}

export async function fetchFinanceProjects(query: FinanceScopeQuery = {}) {
  const { data } = await apiClient.get("/finance/projects", { params: query });
  return z.array(projectFinanceSchema).parse(data ?? []);
}

export async function fetchFinanceProject(id: string) {
  const { data } = await apiClient.get(`/finance/projects/${id}`);
  return projectFinanceSchema.parse(data);
}

export async function fetchFinanceWorkers(query: FinanceScopeQuery = {}) {
  const { data } = await apiClient.get("/finance/workers", { params: query });
  return z.array(workerFinanceSchema).parse(data ?? []);
}

export async function fetchFinanceWorker(id: string) {
  const { data } = await apiClient.get(`/finance/workers/${id}`);
  return workerFinanceMineSchema.parse(data);
}

export type FinanceCategoryQuery = FinanceScopeQuery & {
  from?: string;
  to?: string;
};

export async function fetchFinanceCategories(query: FinanceCategoryQuery = {}) {
  const { data } = await apiClient.get("/finance/categories", { params: query });
  return z.array(expenseCategorySchema).parse(data ?? []);
}
