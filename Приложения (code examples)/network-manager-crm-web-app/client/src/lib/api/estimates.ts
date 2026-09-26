import { apiClient } from "./client";
import { estimateSchema, paginatedSchema } from "./schemas";

export type EstimateListQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
};

export async function fetchEstimates(query: EstimateListQuery = {}) {
  const { data } = await apiClient.get("/estimates", { params: query });
  return paginatedSchema(estimateSchema).parse(data);
}

export async function fetchEstimate(id: string) {
  const { data } = await apiClient.get(`/estimates/${id}`);
  return estimateSchema.parse(data);
}

export async function createEstimate(payload: Record<string, unknown>) {
  const { data } = await apiClient.post("/estimates", payload);
  return estimateSchema.parse(data);
}

export async function updateEstimate(id: string, payload: Record<string, unknown>) {
  const { data } = await apiClient.put(`/estimates/${id}`, payload);
  return estimateSchema.parse(data);
}

export async function updateEstimateStatus(id: string, status: string) {
  const { data } = await apiClient.post(`/estimates/${id}/status`, { status });
  return estimateSchema.parse(data);
}

export async function exportEstimatePdf(id: string) {
  const { data } = await apiClient.get(`/estimates/${id}/export/pdf`, {
    responseType: "blob",
  });
  return data as Blob;
}

export async function exportEstimateExcel(id: string) {
  const { data } = await apiClient.get(`/estimates/${id}/export/excel`, {
    responseType: "blob",
  });
  return data as Blob;
}
