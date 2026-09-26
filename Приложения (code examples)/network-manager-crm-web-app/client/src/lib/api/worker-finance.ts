import { apiClient } from "./client";
import { workerFinanceMineSchema } from "./schemas";

export async function fetchWorkerFinanceMine() {
  const { data } = await apiClient.get("/finance/mine");
  return workerFinanceMineSchema.parse(data);
}
