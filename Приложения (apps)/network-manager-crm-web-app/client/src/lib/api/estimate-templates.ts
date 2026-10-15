import { apiClient } from "./client";
import { estimateTemplateSchema } from "./schemas";
import { z } from "zod";

export async function fetchEstimateTemplates() {
  const { data } = await apiClient.get("/estimate-templates");
  return z.array(estimateTemplateSchema).parse(data);
}

export async function createEstimateTemplate(payload: {
  estimateId: string;
  name: string;
}) {
  const { data } = await apiClient.post("/estimate-templates", payload);
  return estimateTemplateSchema.parse(data);
}

export async function createEstimateFromTemplate(payload: {
  templateId: string;
  name?: string;
}) {
  const { data } = await apiClient.post("/estimates/from-template", payload);
  return data;
}
