import type { z } from "zod";
import type { projectWorkerSchema } from "@/lib/api/schemas";
import { formatMoney } from "@/lib/format";

export type ProjectWorker = z.infer<typeof projectWorkerSchema>;

export function workerDisplayName(w: { firstName: string; lastName: string }) {
  return `${w.firstName} ${w.lastName}`.trim();
}

export function workerSubtitle(w: {
  specialization?: string;
  position?: string;
  hourlyRate?: string;
}) {
  const role = w.specialization || w.position || "Работник";
  const rate = w.hourlyRate ? `${formatMoney(w.hourlyRate)}/ч` : null;
  return rate ? `${role} · ${rate}` : role;
}

export function groupProjectWorkers(workers: ProjectWorker[]) {
  return {
    supervisors: workers.filter((w) => w.role === "supervisor"),
    crew: workers.filter((w) => w.role !== "supervisor"),
  };
}

export function filterWorkersBySearch(workers: ProjectWorker[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return workers;
  return workers.filter((w) => {
    const haystack = [
      w.firstName,
      w.lastName,
      w.specialization,
      w.position,
      workerDisplayName(w),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}
