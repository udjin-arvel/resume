import { Car, IdCard, type LucideIcon } from "lucide-react";

export type WorkerDocumentType = "passport" | "license";

export const WORKER_DOCUMENT_TYPES: WorkerDocumentType[] = ["passport", "license"];

export const workerDocumentTypeMeta: Record<
  WorkerDocumentType,
  { labelKey: string; icon: LucideIcon }
> = {
  passport: { labelKey: "onboarding.passport", icon: IdCard },
  license: { labelKey: "onboarding.license", icon: Car },
};
