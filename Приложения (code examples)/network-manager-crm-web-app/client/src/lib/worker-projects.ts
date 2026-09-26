import type { MyProjectListQuery } from "@/lib/api/projects";

export type ProjectListTab = "all" | "invitations" | "active" | "completed";

export const PROJECT_LIST_TABS: { id: ProjectListTab; labelKey: string }[] = [
  { id: "all", labelKey: "worker.projects.tabs.all" },
  { id: "invitations", labelKey: "worker.projects.tabs.invitations" },
  { id: "active", labelKey: "worker.projects.tabs.active" },
  { id: "completed", labelKey: "worker.projects.tabs.completed" },
];

export function tabToMineQuery(tab: ProjectListTab): MyProjectListQuery {
  switch (tab) {
    case "invitations":
      return { confirmationStatus: "pending" };
    case "active":
      return { status: "active", confirmationStatus: "confirmed" };
    case "completed":
      return { status: "done" };
    default:
      return {};
  }
}

export function parseProjectListTab(value: string | undefined): ProjectListTab {
  if (value === "invitations" || value === "active" || value === "completed") {
    return value;
  }
  return "all";
}

export type ProjectRole = "worker" | "supervisor";

export function isProjectSupervisor(project: { role: string }): boolean {
  return project.role === "supervisor";
}

export function isProjectWorker(project: { role: string }): boolean {
  return project.role !== "supervisor";
}

export function filterProjectsByRole<T extends { role: string }>(
  projects: T[],
  role: ProjectRole,
): T[] {
  return projects.filter((p) =>
    role === "supervisor" ? isProjectSupervisor(p) : isProjectWorker(p),
  );
}

export function getProjectRoleBadge(role: string): { labelKey: string; cls: string } {
  if (role === "supervisor") {
    return { labelKey: "worker.projects.supervisor", cls: "bg-[#EFF6FF] text-[#2563EB]" };
  }
  return { labelKey: "worker.projects.workerRole", cls: "bg-slate-100 text-slate-600" };
}

export function getWorkerProjectStatusBadge(project: {
  confirmationStatus: string;
  status: string;
}): { labelKey: string; cls: string } {
  if (project.confirmationStatus === "pending") {
    return { labelKey: "worker.projects.status.invitation", cls: "bg-[#FFF9EB] text-[#A6632B]" };
  }
  if (project.confirmationStatus === "declined") {
    return { labelKey: "worker.projects.status.declined", cls: "bg-[#FEF2F2] text-[#B91C1C]" };
  }
  if (project.status === "done") {
    return { labelKey: "worker.projects.status.completed", cls: "bg-[#EEF2FF] text-[#4338CA]" };
  }
  return { labelKey: "worker.projects.status.active", cls: "bg-[#ECFDF5] text-[#15803D]" };
}
