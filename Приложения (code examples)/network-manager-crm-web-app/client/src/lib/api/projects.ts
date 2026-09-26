import { apiClient } from "./client";
import { paginatedSchema, myProjectSchema, projectSchema, documentSchema, projectWorkerDocumentsGroupSchema, activityItemSchema, projectWorkerSchema, sendProjectNotificationsResponseSchema, projectIssueSchema, supervisorCandidatesSchema } from "./schemas";
import type { PaginatedResponse } from "./types";
import { z } from "zod";

export type ProjectListQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  clientId?: string;
};

export async function fetchProjects(query: ProjectListQuery = {}) {
  const { data } = await apiClient.get("/projects", { params: query });
  return paginatedSchema(projectSchema).parse(data);
}

export async function fetchProject(id: string) {
  const { data } = await apiClient.get(`/projects/${id}`, {
    params: { include: "workers" },
  });
  return projectSchema.parse(data);
}

export async function createProject(payload: Record<string, unknown>) {
  const path =
    payload.estimateId && !payload.clientId ? "/projects/from-estimate" : "/projects";
  const { data } = await apiClient.post(path, payload);
  return projectSchema.parse(data);
}

export async function updateProject(id: string, payload: Record<string, unknown>) {
  const { data } = await apiClient.put(`/projects/${id}`, payload);
  return projectSchema.parse(data);
}

export async function assignProjectWorker(
  projectId: string,
  payload: { userId: string; role?: string },
) {
  const { data } = await apiClient.post(`/projects/${projectId}/workers`, payload);
  return data;
}

export async function inviteToProject(projectId: string, userId: string) {
  await apiClient.post(`/projects/${projectId}/invite`, { userId });
}

export async function removeProjectWorker(projectId: string, workerId: string) {
  await apiClient.delete(`/projects/${projectId}/workers/${workerId}`);
}

export async function changeWorkerRole(
  projectId: string,
  workerId: string,
  role: string,
) {
  const { data } = await apiClient.put(
    `/projects/${projectId}/workers/${workerId}/role`,
    { role },
  );
  return data;
}

export type MyProjectListQuery = {
  status?: string;
  confirmationStatus?: string;
};

export async function fetchMyProjects(query: MyProjectListQuery = {}) {
  const { data } = await apiClient.get("/projects/mine", { params: query });
  return z.array(myProjectSchema).parse(data);
}

export async function fetchMyProject(id: string) {
  const { data } = await apiClient.get(`/projects/${id}`);
  return myProjectSchema.parse(data);
}

export async function confirmProjectParticipation(projectId: string) {
  await apiClient.post(`/projects/${projectId}/confirm`);
}

export async function declineProjectParticipation(projectId: string) {
  await apiClient.post(`/projects/${projectId}/decline`);
}

export async function fetchProjectCrew(projectId: string) {
  const { data } = await apiClient.get(`/projects/${projectId}/crew`);
  return z.array(projectWorkerSchema).parse(data);
}

export async function fetchProjectIssues(
  projectId: string,
  filters: { status?: string } = {},
) {
  const { data } = await apiClient.get(`/projects/${projectId}/issues`, { params: filters });
  return z.array(projectIssueSchema).parse(data);
}

export async function uploadProjectDocument(projectId: string, formData: FormData) {
  const { data } = await apiClient.post(`/projects/${projectId}/documents`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return documentSchema.parse(data);
}

export async function fetchProjectWorkerDocuments(projectId: string) {
  const { data } = await apiClient.get(`/projects/${projectId}/worker-documents`);
  return z.array(projectWorkerDocumentsGroupSchema).parse(data);
}

export async function fetchProjectHistory(projectId: string) {
  const { data } = await apiClient.get(`/projects/${projectId}/history`);
  return z.array(activityItemSchema).parse(data);
}

export async function updateProjectIssueStatus(
  projectId: string,
  issueId: string,
  status: string,
) {
  const { data } = await apiClient.patch(`/projects/${projectId}/issues/${issueId}/status`, {
    status,
  });
  return projectIssueSchema.parse(data);
}

export async function assignProjectWorkersBatch(
  projectId: string,
  payload: { userIds: string[]; role?: string },
) {
  const { data } = await apiClient.post(`/projects/${projectId}/workers/batch`, payload);
  return z.array(projectWorkerSchema).parse(data);
}

export async function setProjectSupervisor(projectId: string, userId: string) {
  const { data } = await apiClient.post(`/projects/${projectId}/supervisor`, { userId });
  return projectWorkerSchema.parse(data);
}

export async function fetchSupervisorCandidates(projectId: string) {
  const { data } = await apiClient.get(`/projects/${projectId}/supervisor-candidates`);
  return supervisorCandidatesSchema.parse(data);
}

export async function sendProjectNotifications(
  projectId: string,
  payload: {
    userIds: string[];
    title?: string;
    body: string;
    link?: string;
  },
) {
  const { data } = await apiClient.post(`/projects/${projectId}/notifications`, payload);
  return sendProjectNotificationsResponseSchema.parse(data);
}
