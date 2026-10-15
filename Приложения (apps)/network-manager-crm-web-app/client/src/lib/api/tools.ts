import { apiClient } from "./client";
import {
  paginatedSchema,
  toolDetailSchema,
  toolListItemSchema,
  toolSchema,
} from "./schemas";

export type ToolListQuery = {
  page?: number;
  pageSize?: number;
  status?: string;
  projectId?: string;
};

export type ToolDetail = Awaited<ReturnType<typeof fetchTool>>;

export async function fetchTools(query: ToolListQuery = {}) {
  const { data } = await apiClient.get("/tools", { params: query });
  return paginatedSchema(toolListItemSchema).parse(data);
}

export async function fetchTool(id: string) {
  const { data } = await apiClient.get(`/tools/${id}`);
  return toolDetailSchema.parse(data);
}

export async function createTool(payload: Record<string, unknown>) {
  const { data } = await apiClient.post("/tools", payload);
  return toolSchema.parse(data);
}

export async function updateTool(id: string, payload: Record<string, unknown>) {
  const { data } = await apiClient.put(`/tools/${id}`, payload);
  return toolSchema.parse(data);
}

export async function assignTool(id: string, payload: Record<string, unknown>) {
  const { data } = await apiClient.post(`/tools/${id}/assign`, payload);
  return toolDetailSchema.parse(data);
}

export async function returnTool(id: string, payload: Record<string, unknown>) {
  const { data } = await apiClient.post(`/tools/${id}/return`, payload);
  return toolDetailSchema.parse(data);
}

export async function calibrateTool(id: string, payload: Record<string, unknown>) {
  const { data } = await apiClient.post(`/tools/${id}/calibrate`, payload);
  return toolDetailSchema.parse(data);
}

export async function reportToolProblem(id: string, payload: Record<string, unknown>) {
  const { data } = await apiClient.post(`/tools/${id}/report-problem`, payload);
  return data as { ok: boolean };
}

export async function resolveToolProblem(id: string) {
  const { data } = await apiClient.post(`/tools/${id}/resolve-problem`);
  return toolDetailSchema.parse(data);
}
