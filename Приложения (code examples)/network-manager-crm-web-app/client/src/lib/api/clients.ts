import { apiClient } from "./client";
import { clientSchema, documentSchema, paginatedSchema, projectSchema } from "./schemas";
import { z } from "zod";

export type ClientListQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
};

export async function fetchClients(query: ClientListQuery = {}) {
  const { data } = await apiClient.get("/clients", { params: query });
  return paginatedSchema(clientSchema).parse(data);
}

export async function fetchClient(id: string) {
  const { data } = await apiClient.get(`/clients/${id}`);
  return clientSchema.parse(data);
}

export async function createClient(payload: Record<string, unknown>) {
  const { data } = await apiClient.post("/clients", payload);
  return clientSchema.parse(data);
}

export async function updateClient(id: string, payload: Record<string, unknown>) {
  const { data } = await apiClient.put(`/clients/${id}`, payload);
  return clientSchema.parse(data);
}

export async function fetchClientProjects(clientId: string) {
  const { data } = await apiClient.get(`/clients/${clientId}/projects`);
  return z.array(projectSchema).parse(data);
}

export async function fetchClientDocuments(clientId: string) {
  const { data } = await apiClient.get(`/clients/${clientId}/documents`);
  return z.array(documentSchema).parse(data);
}

export async function fetchClientFinance(clientId: string) {
  const { data } = await apiClient.get(`/clients/${clientId}/finance`);
  return data;
}
