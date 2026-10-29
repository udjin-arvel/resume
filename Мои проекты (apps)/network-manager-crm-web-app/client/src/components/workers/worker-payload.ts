import type { z } from "zod";
import type { workerSchema } from "@/lib/api/schemas";
import type { UpdateWorkerPayload } from "@/lib/api/workers";
import { parseDecimal } from "@/lib/format";

export type Worker = z.infer<typeof workerSchema>;

export {
  formatTelegramDisplay,
  normalizeTelegramUsername,
} from "@/lib/telegram";

export function buildWorkerPayload(
  worker: Worker,
  patch: Partial<UpdateWorkerPayload>,
): UpdateWorkerPayload {
  return {
    firstName: worker.firstName,
    lastName: worker.lastName,
    phone: worker.phone ?? "",
    email: worker.email ?? "",
    position: worker.position ?? "",
    specialization: worker.specialization ?? "",
    hourlyRate: worker.hourlyRate ?? "0",
    internalComment: worker.internalComment ?? "",
    telegramUsername: worker.telegramUsername ?? "",
    ...patch,
  };
}

export function parseHourlyRateInput(value: string) {
  const cleaned = value.replace(/[€\s]/g, "").replace(",", ".");
  const n = parseDecimal(cleaned);
  return String(n);
}
