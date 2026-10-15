import { apiClient } from "./client";
import {
  paginatedSchema,
  supervisorReportSchema,
  workerReportSchema,
} from "./schemas";

export type ReportListQuery = {
  page?: number;
  pageSize?: number;
  projectId?: string;
  clientId?: string;
  workerId?: string;
  supervisorId?: string;
  siteStatus?: string;
  status?: string;
  from?: string;
  to?: string;
};

export async function fetchWorkerReports(params: ReportListQuery = {}) {
  const { data } = await apiClient.get("/reports/worker", { params });
  return paginatedSchema(workerReportSchema).parse(data);
}

export async function fetchWorkerReport(id: string) {
  const { data } = await apiClient.get(`/reports/worker/${id}`);
  return workerReportSchema.parse(data);
}

export async function createWorkerReport(payload: Record<string, unknown>) {
  const { data } = await apiClient.post("/reports/worker", payload);
  return workerReportSchema.parse(data);
}

export async function updateWorkerReport(id: string, payload: Record<string, unknown>) {
  const { data } = await apiClient.put(`/reports/worker/${id}`, payload);
  return workerReportSchema.parse(data);
}

export async function approveWorkerReport(id: string) {
  const { data } = await apiClient.post(`/reports/worker/${id}/approve`);
  return workerReportSchema.parse(data);
}

export async function rejectWorkerReport(id: string, comment?: string) {
  const { data } = await apiClient.post(`/reports/worker/${id}/reject`, { comment: comment ?? "" });
  return workerReportSchema.parse(data);
}

export async function revertWorkerReportReturn(id: string) {
  const { data } = await apiClient.post(`/reports/worker/${id}/revert-return`);
  return workerReportSchema.parse(data);
}

export async function remindWorkerReport(id: string) {
  const { data } = await apiClient.post(`/reports/worker/${id}/remind`);
  return workerReportSchema.parse(data);
}

export async function fetchSupervisorReports(params: ReportListQuery = {}) {
  const { data } = await apiClient.get("/reports/supervisor", { params });
  return paginatedSchema(supervisorReportSchema).parse(data);
}

export async function fetchSupervisorReport(id: string) {
  const { data } = await apiClient.get(`/reports/supervisor/${id}`);
  return supervisorReportSchema.parse(data);
}

export async function createSupervisorReport(payload: Record<string, unknown>) {
  const { data } = await apiClient.post("/reports/supervisor", payload);
  return supervisorReportSchema.parse(data);
}

export async function patchSupervisorReport(id: string, payload: Record<string, unknown>) {
  const { data } = await apiClient.patch(`/reports/supervisor/${id}`, payload);
  return supervisorReportSchema.parse(data);
}

export async function transcribeSupervisorReport(id: string, transcription: string) {
  const { data } = await apiClient.post(`/reports/supervisor/${id}/transcribe`, {
    transcription,
  });
  return supervisorReportSchema.parse(data);
}

export async function approveSupervisorReport(id: string) {
  const { data } = await apiClient.post(`/reports/supervisor/${id}/approve`);
  return supervisorReportSchema.parse(data);
}

export async function attentionSupervisorReport(id: string) {
  const { data } = await apiClient.post(`/reports/supervisor/${id}/attention`);
  return supervisorReportSchema.parse(data);
}

export async function commentSupervisorReport(id: string, comment: string) {
  const { data } = await apiClient.post(`/reports/supervisor/${id}/comment`, {
    comment,
  });
  return supervisorReportSchema.parse(data);
}
