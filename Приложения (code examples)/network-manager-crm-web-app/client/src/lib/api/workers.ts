import { apiClient } from "./client";
import { paginatedSchema, workerProjectSchema, workerResourceStatSchema, workerSchema } from "./schemas";
import { z } from "zod";

export type WorkerListQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  specialization?: string;
  projectId?: string;
  clientId?: string;
};

export type CreateWorkerPayload = {
  firstName: string;
  lastName: string;
  phone?: string;
  email: string;
  password: string;
  position?: string;
  specialization?: string;
  hourlyRate?: string;
  internalComment?: string;
  telegramUsername?: string;
};

export type UpdateWorkerPayload = CreateWorkerPayload;

export async function fetchWorkers(query: WorkerListQuery = {}) {
  const { data } = await apiClient.get("/workers", { params: query });
  return paginatedSchema(workerSchema).parse(data);
}

export async function fetchWorker(id: string) {
  const { data } = await apiClient.get(`/workers/${id}`);
  return workerSchema.parse(data);
}

export async function updateWorker(id: string, payload: UpdateWorkerPayload) {
  const { data } = await apiClient.put(`/workers/${id}`, payload);
  return workerSchema.parse(data);
}

export async function fetchWorkerProjects(id: string) {
  const { data } = await apiClient.get(`/workers/${id}/projects`);
  return z.array(workerProjectSchema).parse(data);
}

export async function createWorker(payload: CreateWorkerPayload) {
  const { data } = await apiClient.post("/workers", payload);
  return workerSchema.parse(data);
}

export type ApplicationReviewPayload = {
  reasons: string[];
  comment?: string;
};

export async function approveWorker(id: string) {
  const { data } = await apiClient.post(`/workers/${id}/approve`);
  return workerSchema.parse(data);
}

export async function rejectWorker(id: string, payload: ApplicationReviewPayload) {
  const { data } = await apiClient.post(`/workers/${id}/reject`, payload);
  return workerSchema.parse(data);
}

export async function returnWorkerApplication(id: string, payload: ApplicationReviewPayload) {
  const { data } = await apiClient.post(`/workers/${id}/return`, payload);
  return workerSchema.parse(data);
}

export type BlockWorkerPayload = {
  reason: string;
  projectId?: string;
};

export async function blockWorker(id: string, payload: BlockWorkerPayload) {
  const { data } = await apiClient.post(`/workers/${id}/block`, payload);
  return workerSchema.parse(data);
}

export async function unblockWorker(id: string) {
  const { data } = await apiClient.post(`/workers/${id}/unblock`);
  return workerSchema.parse(data);
}

export async function fetchWorkerResources() {
  const { data } = await apiClient.get("/workers/resources");
  return z.array(workerResourceStatSchema).parse(data);
}

export async function fetchAvailableWorkers(projectId?: string) {
  const { data } = await apiClient.get("/workers/available", {
    params: projectId ? { projectId } : undefined,
  });
  return z.array(workerSchema).parse(data);
}
