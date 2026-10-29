import { apiClient } from "./client";
import {
  activityItemSchema,
  paginatedSchema,
  problemProjectSchema,
  urgentActionSchema,
} from "./schemas";
import { z } from "zod";

export async function fetchUrgentActions() {
  const { data } = await apiClient.get("/dashboard/urgent");
  return z.array(urgentActionSchema).parse(data);
}

export async function fetchProblemProjects() {
  const { data } = await apiClient.get("/dashboard/problem-projects");
  return z.array(problemProjectSchema).parse(data);
}

export async function fetchActivity(params: { page?: number; pageSize?: number } = {}) {
  const { data } = await apiClient.get("/dashboard/activity", { params });
  return paginatedSchema(activityItemSchema).parse(data);
}
