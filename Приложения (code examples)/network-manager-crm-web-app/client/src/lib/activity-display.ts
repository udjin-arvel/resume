import { Clock } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { formatDate } from "@/lib/format";
import type { z } from "zod";
import type { activityItemSchema } from "@/lib/api/schemas";

type ActivityItem = z.infer<typeof activityItemSchema>;

export type ActivityListItemData = {
  id: string;
  project: string;
  action: string;
  time: string;
  icon?: LucideIcon;
};

const actionLabels: Record<string, string> = {
  participation_confirmed: "Работник подтвердил участие",
  participation_declined: "Работник отказался от участия",
  report_submitted: "Загружен отчёт",
  report_approved: "Отчёт одобрен",
  report_returned: "Отчёт возвращён на доработку",
  document_uploaded: "Загружен документ",
  project_created: "Проект создан",
  budget_changed: "Изменён бюджет",
  supervisor_assigned: "Назначен супервайзер",
  worker_assigned: "Добавлен работник",
  worker_approved: "Работник одобрен",
  tool_assigned: "Инструмент выдан на проект",
  tool_returned: "Инструмент возвращён",
  tool_calibrated: "Проведена калибровка",
  supervisor_report_created: "Создан отчёт супервайзера",
  supervisor_report_approved: "Отчёт супервайзера одобрен",
  supervisor_attention: "Требует внимания супервайзера",
  downtime_recorded: "Зафиксирован простой",
};

function activityActionLabel(action: string, label: string): string {
  if (actionLabels[action]) return actionLabels[action];
  if (label && label !== action) return label;
  return action;
}

function activityProjectTitle(item: ActivityItem): string {
  const actionText = activityActionLabel(item.action, item.label);
  const genericLabels = new Set([item.action, actionText, actionLabels[item.action]].filter(Boolean));

  if (item.label && !genericLabels.has(item.label)) {
    return item.label;
  }

  return "—";
}

export function formatActivityTime(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "только что";
  if (mins < 60) return `${mins} мин назад`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ч назад`;
  return formatDate(iso);
}

export function mapActivityToListItem(item: ActivityItem): ActivityListItemData {
  const actionText = activityActionLabel(item.action, item.label);
  const projectTitle = activityProjectTitle(item);

  return {
    id: item.id,
    project: projectTitle,
    action: actionText,
    time: formatActivityTime(item.createdAt),
    icon: Clock,
  };
}
