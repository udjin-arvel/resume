import type { ToolDetail } from "@/lib/api/tools";
import {
  isCalibrationDue,
  isUsageCritical,
  needsAttention,
} from "@/components/tools/list/toolCardDisplay";
import { formatDate } from "@/lib/format";

export type AccordionSection = "general" | "calibration" | "usage";

export function formatToolCost(cents?: number): string {
  if (!cents) return "—";
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function getToolSubtitle(tool: ToolDetail): string {
  if (tool.model?.trim()) {
    return `${tool.model} · ${tool.serialNumber || "—"}`;
  }
  return `Арт: ${tool.serialNumber || "—"}`;
}

export function hasReportedProblem(tool: Pick<ToolDetail, "problemType" | "problemReportedAt">): boolean {
  return Boolean(tool.problemType?.trim() || tool.problemReportedAt);
}

export function showAccordions(tool: ToolDetail): boolean {
  return tool.status === "assigned" || needsAttention(tool);
}

export function showGeneralInfo(tool: ToolDetail): boolean {
  return !!tool.activeAssignment;
}

export function showCalibrationSection(tool: ToolDetail): boolean {
  return ["calibration", "expiry", "combined"].includes(tool.controlType);
}

export function showUsageSection(tool: ToolDetail): boolean {
  return (
    (tool.controlType === "usage_limit" || tool.controlType === "combined") &&
    tool.usageLimit > 0
  );
}

export function getAccordionDefaultOpen(tool: ToolDetail, section: AccordionSection): boolean {
  if (tool.status === "assigned") return true;
  if (tool.activeAssignment && section === "general") return true;
  if (!needsAttention(tool)) return false;
  if (section === "usage" && isUsageCritical(tool)) return true;
  if (section === "calibration" && isCalibrationDue(tool.calibrationDueAt)) return true;
  return false;
}

export function formatAssignmentSubtitle(assignment: {
  responsibleName?: string;
  assignedAt: string;
  returnedAt?: string | null;
}): string {
  const name = assignment.responsibleName?.trim() || "—";
  const issued = formatDate(assignment.assignedAt);
  if (!assignment.returnedAt) {
    return `${name} · ${issued}`;
  }
  return `${name} · ${issued} → ${formatDate(assignment.returnedAt)}`;
}
