import type { TFunction } from "i18next";

export type WorkerCertificateId =
  | "cscs"
  | "ecs"
  | "vca"
  | "safety_pass"
  | "ipaf"
  | "confined_space"
  | "sssts"
  | "first_aider";

export const WORKER_CERTIFICATE_IDS: WorkerCertificateId[] = [
  "cscs",
  "ecs",
  "vca",
  "safety_pass",
  "ipaf",
  "confined_space",
  "sssts",
  "first_aider",
];

export function parseCertificates(value: string | undefined | null): WorkerCertificateId[] {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return [];

  return trimmed
    .split(",")
    .map((part) => part.trim())
    .filter((part): part is WorkerCertificateId =>
      WORKER_CERTIFICATE_IDS.includes(part as WorkerCertificateId),
    );
}

export function serializeCertificates(ids: readonly string[]): string {
  return ids
    .map((id) => id.trim())
    .filter((id) => WORKER_CERTIFICATE_IDS.includes(id as WorkerCertificateId))
    .join(",");
}

export function getCertificateLabel(id: string, t: TFunction): string {
  if (WORKER_CERTIFICATE_IDS.includes(id as WorkerCertificateId)) {
    return t(`workers.certificates.${id}`);
  }
  return id;
}

export function formatCertificatesList(value: string | undefined | null, t: TFunction): string {
  const ids = parseCertificates(value);
  if (ids.length === 0) return "";
  return ids.map((id) => getCertificateLabel(id, t)).join(", ");
}
