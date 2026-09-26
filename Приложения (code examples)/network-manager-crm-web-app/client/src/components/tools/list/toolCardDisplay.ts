import type { z } from "zod";
import type { toolDetailSchema, toolListItemSchema } from "@/lib/api/schemas";
import { toolStatusMeta } from "@/lib/constants/status";
import { formatDate, pluralDays } from "@/lib/format";

export type ToolListItem = z.infer<typeof toolListItemSchema>;
export type ToolDetail = z.infer<typeof toolDetailSchema>;

export type ToolDisplayFields = Pick<
  ToolListItem,
  | "status"
  | "controlType"
  | "calibrationDueAt"
  | "usageLimit"
  | "usageCount"
  | "lastReturnedAt"
  | "plannedReturnAt"
>;

export function isCalibrationDue(calibrationDueAt?: string | null): boolean {
  if (!calibrationDueAt) return false;
  const d = new Date(
    calibrationDueAt.includes("T") ? calibrationDueAt : `${calibrationDueAt}T00:00:00`,
  );
  return !Number.isNaN(d.getTime()) && d.getTime() <= Date.now();
}

export function isUsageCritical(tool: Pick<ToolDisplayFields, "usageLimit" | "usageCount">): boolean {
  return tool.usageLimit > 0 && tool.usageCount / tool.usageLimit >= 0.9;
}

export function needsAttention(tool: ToolDisplayFields): boolean {
  if (tool.status === "needs_attention") return true;
  if (tool.status === "overdue") return true;
  const calTypes = ["calibration", "expiry", "combined"];
  if (calTypes.includes(tool.controlType) && isCalibrationDue(tool.calibrationDueAt)) return true;
  const usageTypes = ["usage_limit", "combined"];
  if (usageTypes.includes(tool.controlType) && isUsageCritical(tool)) {
    return true;
  }
  return false;
}

export function getToolCardBadge(tool: ToolDisplayFields): { label: string; cls: string } {
  if (needsAttention(tool)) {
    return { label: "Требует внимания", cls: "bg-amber-50 text-amber-700" };
  }
  const meta = toolStatusMeta[tool.status];
  if (meta) return { label: meta.label, cls: meta.cls };
  return { label: tool.status, cls: "bg-slate-100 text-slate-600" };
}

export function getResponsibleRoleLabel(role?: string | null): string {
  switch (role) {
    case "supervisor":
      return "Супервизор";
    case "worker":
      return "Работник";
    case "manager":
      return "Менеджер";
    default:
      return role?.trim() ? role : "—";
  }
}

export function getMetaLine(tool: ToolListItem): string {
  const parts: string[] = [];
  parts.push(`Арт: ${tool.serialNumber || "—"}`);
  const name = tool.activeAssignment?.responsibleName?.trim();
  if (name) parts.push(name);
  const role = getResponsibleRoleLabel(tool.activeAssignment?.responsibleRole);
  if (role !== "—") parts.push(role);
  return parts.join(" · ");
}

export function getArticleLine(tool: Pick<ToolListItem, "serialNumber">): string {
  return `Арт: ${tool.serialNumber || "—"}`;
}

export function getValidityLabel(controlType: string): string {
  return controlType === "expiry" ? "Годен до" : "Калибровка до";
}

export function daysUntil(dateStr?: string | null): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr.includes("T") ? dateStr : `${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export type ToolCardFooterVariant = "assigned" | "attention" | "available" | "overdue" | "written_off" | "none";

export function getFooterVariant(
  tool: ToolDisplayFields & { activeAssignment?: unknown | null },
): ToolCardFooterVariant {
  if (tool.status === "written_off") return "written_off";
  if (tool.status === "overdue") return "overdue";
  if (tool.status === "needs_attention" && tool.activeAssignment) return "assigned";
  if (tool.status === "needs_attention") return "attention";
  if (tool.status === "assigned") return "assigned";
  if (tool.status === "available" && !needsAttention(tool)) return "available";
  if (needsAttention(tool)) return "attention";
  return "none";
}

export function getFooterText(tool: ToolListItem, variant: ToolCardFooterVariant): string | null {
  switch (variant) {
    case "assigned": {
      const days = daysUntil(tool.plannedReturnAt);
      if (days == null) return null;
      if (days > 0) return `До возврата осталось ${days} ${pluralDays(days)}`;
      if (days === 0) return "Возврат сегодня";
      return `Просрочен возврат на ${Math.abs(days)} ${pluralDays(Math.abs(days))}`;
    }
    case "attention":
      if (tool.lastReturnedAt) return `Возвращен ${formatDate(tool.lastReturnedAt)}`;
      return null;
    case "overdue":
      if (tool.calibrationDueAt) return `Просрочен ${formatDate(tool.calibrationDueAt)}`;
      return "Просрочен";
    case "written_off":
      return "Списан";
    default:
      return null;
  }
}

export function showUsageBar(tool: Pick<ToolDisplayFields, "controlType" | "usageLimit">): boolean {
  return (
    (tool.controlType === "usage_limit" || tool.controlType === "combined") &&
    tool.usageLimit > 0
  );
}
