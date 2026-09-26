import type { TFunction } from "i18next";

export type WorkerSpecializationId =
  | "site_manager"
  | "site_supervisor"
  | "team_lead"
  | "fibre_engineer"
  | "copper_engineer"
  | "labourer"
  | "containment_technician"
  | "containment_labourer";

export const WORKER_SPECIALIZATION_IDS: WorkerSpecializationId[] = [
  "site_manager",
  "site_supervisor",
  "team_lead",
  "fibre_engineer",
  "copper_engineer",
  "labourer",
  "containment_technician",
  "containment_labourer",
];

export type SpecGroup = "all" | "management" | "engineers" | "containment" | "labour";

export const specGroupMap: Record<SpecGroup, WorkerSpecializationId[] | "all"> = {
  all: "all",
  management: ["site_manager", "site_supervisor", "team_lead"],
  engineers: ["fibre_engineer", "copper_engineer"],
  containment: ["containment_technician", "containment_labourer"],
  labour: ["labourer"],
};

export const specGroupLabels: { id: SpecGroup; labelKey: string }[] = [
  { id: "all", labelKey: "workers.specializationGroups.all" },
  { id: "management", labelKey: "workers.specializationGroups.management" },
  { id: "engineers", labelKey: "workers.specializationGroups.engineers" },
  { id: "containment", labelKey: "workers.specializationGroups.containment" },
  { id: "labour", labelKey: "workers.specializationGroups.labour" },
];

export const SPECIALIZATION_OTHER = "__other__";

const LEGACY_SPECIALIZATION_MAP: Record<string, WorkerSpecializationId> = {
  "Site Manager": "site_manager",
  "Site manager": "site_manager",
  "Site Supervisor": "site_supervisor",
  "Team lead": "team_lead",
  "Team Lead": "team_lead",
  "Fibre engineer": "fibre_engineer",
  "Fiber engineer": "fibre_engineer",
  "Fiber Technician": "fibre_engineer",
  "Copper engineer": "copper_engineer",
  Labourer: "labourer",
  Laborer: "labourer",
  "Containment technician": "containment_technician",
  "Containment labourer": "containment_labourer",
  "Electrical Supervisor": "site_supervisor",
  "Mechanical Supervisor": "site_supervisor",
  "Electrician Level 1": "copper_engineer",
  "Electrician Level 2": "copper_engineer",
  "Electrician Level 3": "copper_engineer",
  "Mechanical Installer": "containment_technician",
  "Cable Puller": "labourer",
  "Cable Technician": "copper_engineer",
  "QA/QC Technician": "containment_technician",
  "Commissioning Technician": "fibre_engineer",
};

export function normalizeSpecializationId(value: string | undefined | null): WorkerSpecializationId | null {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return null;
  if (WORKER_SPECIALIZATION_IDS.includes(trimmed as WorkerSpecializationId)) {
    return trimmed as WorkerSpecializationId;
  }
  return LEGACY_SPECIALIZATION_MAP[trimmed] ?? null;
}

export function allSpecializationValues(): string[] {
  return [...WORKER_SPECIALIZATION_IDS];
}

export function getSpecializationLabel(value: string | undefined | null, t: TFunction): string {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return "";

  const id = normalizeSpecializationId(trimmed);
  if (id) {
    return t(`workers.specializations.${id}`);
  }

  return trimmed;
}

export function formatWorkerPositionLabel(
  position: string | undefined,
  t: TFunction,
  fallbackKey = "workers.defaultRole",
): string {
  const label = getSpecializationLabel(position, t);
  if (label) return label;

  const pos = position?.trim();
  if (pos) return pos;

  return t(fallbackKey);
}

/** @deprecated Use formatWorkerPositionLabel — role comes from position, not specialization. */
export function formatWorkerRoleLabel(
  specialization: string | undefined,
  position: string | undefined,
  t: TFunction,
  fallbackKey = "workers.defaultRole",
): string {
  void specialization;
  return formatWorkerPositionLabel(position, t, fallbackKey);
}

export function workerMatchesSpecGroup(position: string | undefined, group: SpecGroup): boolean {
  const allowed = specGroupMap[group];
  if (allowed === "all") return true;

  const normalized = normalizeSpecializationId(position);
  if (!normalized) return false;

  return allowed.includes(normalized);
}
