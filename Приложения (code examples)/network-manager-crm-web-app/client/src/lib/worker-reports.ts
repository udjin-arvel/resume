import type { ReportListQuery } from "@/lib/api/reports";
import {
  filterProjectsByRole,
  isProjectSupervisor,
  type ProjectRole,
} from "@/lib/worker-projects";

export type ReportStatusFilter = "all" | "review" | "approved" | "returned" | "overdue";

export type ReportTypeTab = "weekly" | "daily";

export const REPORT_TYPE_TABS: { id: ReportTypeTab; labelKey: string }[] = [
  { id: "weekly", labelKey: "worker.reports.tabs.weekly" },
  { id: "daily", labelKey: "worker.reports.tabs.daily" },
];

export type ReportTypeAvailability = {
  hasWorkerProjects: boolean;
  hasSupervisorProjects: boolean;
};

export function getReportTypeAvailability(
  projects: { role: string }[],
): ReportTypeAvailability {
  return {
    hasWorkerProjects: filterProjectsByRole(projects, "worker").length > 0,
    hasSupervisorProjects: filterProjectsByRole(projects, "supervisor").length > 0,
  };
}

export function reportTypeToProjectRole(type: ReportTypeTab): ProjectRole {
  return type === "daily" ? "supervisor" : "worker";
}

export function parseReportTypeTab(
  value: string | undefined,
  availability: ReportTypeAvailability,
): ReportTypeTab {
  if (value === "weekly" && availability.hasWorkerProjects) return "weekly";
  if (value === "daily" && availability.hasSupervisorProjects) return "daily";
  if (availability.hasWorkerProjects) return "weekly";
  if (availability.hasSupervisorProjects) return "daily";
  return "weekly";
}

export function resolveReportTypeTab(
  projects: { id: string; role: string }[],
  searchType: string | undefined,
  projectId: string | undefined,
): ReportTypeTab {
  const availability = getReportTypeAvailability(projects);

  if (projectId && projectId !== "all") {
    const project = projects.find((p) => p.id === projectId);
    if (project) {
      return isProjectSupervisor(project) ? "daily" : "weekly";
    }
  }

  return parseReportTypeTab(searchType, availability);
}

export const WEEKLY_STATUS_TABS: { id: ReportStatusFilter; labelKey: string }[] = [
  { id: "all", labelKey: "worker.reports.filters.all" },
  { id: "review", labelKey: "worker.reports.filters.review" },
  { id: "approved", labelKey: "worker.reports.filters.approved" },
  { id: "returned", labelKey: "worker.reports.filters.returned" },
];

export function normalizeReportStatus(status: string): string {
  return status === "accepted" ? "approved" : status;
}

export function shouldOpenReportForm(status: string): boolean {
  const s = normalizeReportStatus(status);
  return s === "draft" || s === "review" || s === "returned" || s === "attention";
}

export function reportStatusBadgeMeta(status: string): { labelKey: string; cls: string } {
  const key = normalizeReportStatus(status);
  switch (key) {
    case "returned":
      return { labelKey: "worker.reports.status.returned", cls: "bg-[#FEF2F2] text-[#B91C1C]" };
    case "approved":
      return { labelKey: "worker.reports.status.approved", cls: "bg-[#ECFDF5] text-[#15803D]" };
    case "overdue":
      return { labelKey: "worker.reports.status.overdue", cls: "bg-[#FEF2F2] text-[#B91C1C]" };
    case "draft":
      return { labelKey: "worker.reports.status.draft", cls: "bg-slate-100 text-slate-600" };
    default:
      return { labelKey: "worker.reports.status.review", cls: "bg-[#FFF9EB] text-[#A6632B]" };
  }
}

export function supervisorReportStatusBadgeMeta(status: string): { labelKey: string; cls: string } {
  const key = normalizeReportStatus(status);
  if (key === "approved") {
    return { labelKey: "worker.reports.status.approved", cls: "bg-[#ECFDF5] text-[#15803D]" };
  }
  if (key === "attention") {
    return { labelKey: "worker.reports.status.attention", cls: "bg-[#FEF2F2] text-[#B91C1C]" };
  }
  return { labelKey: "worker.reports.status.review", cls: "bg-[#FFF9EB] text-[#A6632B]" };
}

export function formatWeekLabel(weekStart: string): string {
  const start = new Date(weekStart.includes("T") ? weekStart : `${weekStart}T12:00:00`);
  if (Number.isNaN(start.getTime())) return "";
  const day = start.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(start);
  monday.setDate(start.getDate() + mondayOffset);
  const yearStart = new Date(monday.getFullYear(), 0, 1);
  const week = Math.ceil(((monday.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `worker.reports.weekLabel:${week}`;
}

export function getWeekLabel(weekStart: string, t: (key: string, opts?: { count?: number }) => string): string {
  const week = getWeekNumber(weekStart);
  if (week === null) return "";
  return t("worker.reports.weekLabel", { count: week });
}

export function getWeekNumber(weekStart: string): number | null {
  const start = new Date(weekStart.includes("T") ? weekStart : `${weekStart}T12:00:00`);
  if (Number.isNaN(start.getTime())) return null;
  const day = start.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(start);
  monday.setDate(start.getDate() + mondayOffset);
  const yearStart = new Date(monday.getFullYear(), 0, 1);
  return Math.ceil(((monday.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
}

export function formatReportWeekLabel(weekStart: string): string {
  const week = getWeekNumber(weekStart);
  if (week === null) return "—";
  return `Отчёт за ${week}-ю неделю`;
}

export function formatWeekShortLabel(weekStart: string): string {
  const week = getWeekNumber(weekStart);
  if (week === null) return "—";
  return `Неделя ${week}`;
}

export function statusToApiFilter(status: ReportStatusFilter): string | undefined {
  if (status === "all") return undefined;
  if (status === "approved") return "accepted";
  return status;
}

export type ReportListSearch = {
  type?: string;
  status?: string;
  projectId?: string;
};

export function parseReportStatusFilter(value: string | undefined): ReportStatusFilter {
  if (value === "review" || value === "approved" || value === "returned" || value === "overdue") {
    return value;
  }
  return "all";
}

export function buildReportListQuery(
  status: ReportStatusFilter,
  projectId: string,
): ReportListQuery {
  return {
    pageSize: 50,
    status: statusToApiFilter(status),
    projectId: projectId === "all" ? undefined : projectId,
  };
}

export function sanitizeAmountInput(value: string): string {
  return value.replace(/[^\d.,]/g, "").replace(",", ".");
}

export const REPORT_DAY_FIELDS = [
  { key: "hoursMon", labelKey: "worker.reports.days.monShort" },
  { key: "hoursTue", labelKey: "worker.reports.days.tueShort" },
  { key: "hoursWed", labelKey: "worker.reports.days.wedShort" },
  { key: "hoursThu", labelKey: "worker.reports.days.thuShort" },
  { key: "hoursFri", labelKey: "worker.reports.days.friShort" },
  { key: "hoursSat", labelKey: "worker.reports.days.satShort" },
  { key: "hoursSun", labelKey: "worker.reports.days.sunShort" },
] as const;

export type ReportDayFieldKey = (typeof REPORT_DAY_FIELDS)[number]["key"];

export const REPORT_EXPENSE_TYPES = [
  { value: "flight", labelKey: "worker.reports.expense.flight" },
  { value: "hotel", labelKey: "worker.reports.expense.hotel" },
  { value: "transport", labelKey: "worker.reports.expense.transport" },
  { value: "food", labelKey: "worker.reports.expense.food" },
  { value: "materials", labelKey: "worker.reports.expense.materials" },
  { value: "other", labelKey: "worker.reports.expense.other" },
] as const;

export const reportInputClass =
  "w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors text-sm";

export function getCurrentWeekStart(): string {
  const d = new Date();
  const day = d.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + mondayOffset);
  return d.toISOString().slice(0, 10);
}

export const reportHoursInputClass =
  "h-10 w-full rounded-lg border border-gray-200 text-center text-sm focus:border-blue-500 focus:outline-none focus:ring-0";
