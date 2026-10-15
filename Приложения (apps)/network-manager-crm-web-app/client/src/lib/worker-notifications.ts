import type { z } from "zod";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import type { notificationSchema } from "@/lib/api/schemas";

export type Notification = z.infer<typeof notificationSchema>;

export function unreadNotificationCount(items: Notification[] | undefined): number {
  return (items ?? []).filter((n) => !n.readAt).length;
}

export function resolveNotificationLink(link: string | undefined, _type?: string): string | undefined {
  if (!link) return undefined;
  if (link === "/worker" || link === "/worker/") return "/worker/projects";
  if (link.startsWith("/worker/")) return link;

  const workerReport = link.match(/^\/reports\/worker\/(.+)$/);
  if (workerReport) return `/worker/reports/${workerReport[1]}`;

  const supervisorReport = link.match(/^\/reports\/supervisor\/(.+)$/);
  if (supervisorReport) return `/worker/daily-reports/${supervisorReport[1]}`;

  const project = link.match(/^\/projects\/([^/?]+)$/);
  if (project) return `/worker/projects/${project[1]}`;

  return link;
}

export function isReportReminderNotification(type: string): boolean {
  return (
    type === "worker_weekly_report_reminder" ||
    type === "supervisor_daily_report_reminder" ||
    type === "report_reminder"
  );
}

export function getNotificationIconType(type: string): LucideIcon {
  switch (type) {
    case "project_invite":
    case "worker_joined":
      return UserPlus;
    case "worker_approved":
    case "supervisor_assigned":
      return CheckCircle;
    case "report_returned":
    case "supervisor_attention":
    case "worker_weekly_report_reminder":
    case "supervisor_daily_report_reminder":
    case "report_reminder":
      return AlertCircle;
    default:
      return Clock;
  }
}

export function parseWorkerNotificationNavigateTarget(
  link: string | undefined,
  type?: string,
): { to: string; params?: Record<string, string>; search?: Record<string, string> } | null {
  const resolved = resolveNotificationLink(link, type);
  if (!resolved) return null;

  const workerReport = resolved.match(/^\/worker\/reports\/([^/?]+)$/);
  if (workerReport) {
    return { to: "/worker/reports/$reportId", params: { reportId: workerReport[1] } };
  }

  const dailyReport = resolved.match(/^\/worker\/daily-reports\/([^/?]+)$/);
  if (dailyReport) {
    return { to: "/worker/daily-reports/$dailyId", params: { dailyId: dailyReport[1] } };
  }

  const project = resolved.match(/^\/worker\/projects\/([^/?]+)$/);
  if (project) {
    return { to: "/worker/projects/$projectId", params: { projectId: project[1] } };
  }

  const reportsNew = resolved.match(/^\/worker\/reports\/new\?projectId=([^&]+)/);
  if (reportsNew) {
    return { to: "/worker/reports/new", search: { projectId: reportsNew[1] } };
  }

  const staticRoutes = [
    "/worker/projects",
    "/worker/reports",
    "/worker/finance",
    "/worker/documents",
    "/worker/notifications",
    "/worker/profile",
    "/worker/reports/new",
  ] as const;

  if ((staticRoutes as readonly string[]).includes(resolved)) {
    return { to: resolved };
  }

  return { to: resolved };
}

export function getNotificationIconClassName(type: string): string {
  switch (type) {
    case "project_invite":
    case "worker_joined":
      return "text-blue-500";
    case "worker_approved":
    case "supervisor_assigned":
      return "text-emerald-500";
    case "report_returned":
    case "supervisor_attention":
    case "worker_weekly_report_reminder":
    case "supervisor_daily_report_reminder":
    case "report_reminder":
      return "text-red-600";
    default:
      return "text-slate-500";
  }
}
