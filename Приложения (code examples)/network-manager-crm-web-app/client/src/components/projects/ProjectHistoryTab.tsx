import { LoadingSkeleton } from "@/components/common/LoadingSpinner";
import { useProjectHistory } from "@/lib/api/hooks/useProjects";
import { ProjectHistoryEventCard } from "./ProjectHistoryEventCard";

type ActivityItem = {
  id: string;
  actorName: string;
  action: string;
  label: string;
  createdAt: string;
};

const actionFallbackLabels: Record<string, (item: ActivityItem) => string> = {
  project_created: () => "Проект создан",
  worker_assigned: (item) => {
    if (!item.label || item.label === item.action) return "Добавлен работник";
    if (item.label.startsWith("Добавлен")) return item.label;
    return `Добавлен работник ${item.label}`;
  },
  supervisor_assigned: (item) => {
    if (!item.label || item.label === item.action) return "Назначен супервайзер";
    if (item.label.startsWith("Назначен")) return item.label;
    return `Назначен супервайзер: ${item.label}`;
  },
  document_uploaded: (item) => item.label || "Загружен документ",
  budget_changed: (item) => item.label || "Изменён бюджет проекта",
  downtime_recorded: (item) => item.label || "Зафиксирован простой",
  participation_confirmed: () => "Работник подтвердил участие",
  supervisor_report_approved: () => "Ежедневный отчёт супервайзера принят",
  report_submitted: (item) => `Отправлен отчёт: ${item.label || "проект"}`,
  report_approved: (item) => `Отчёт принят: ${item.label || "проект"}`,
  report_returned: (item) => `Отчёт возвращён: ${item.label || "проект"}`,
  tool_assigned: (item) => `Назначен инструмент: ${item.label || ""}`.trim(),
};

function resolveHistoryLabel(item: ActivityItem): string {
  const fallback = actionFallbackLabels[item.action];
  if (fallback) {
    return fallback(item);
  }
  if (item.label && item.label !== item.action) {
    return item.label;
  }
  if (item.actorName) {
    return `${item.action} · ${item.actorName}`;
  }
  return item.action;
}

type ProjectHistoryTabProps = {
  projectId: string;
};

export function ProjectHistoryTab({ projectId }: ProjectHistoryTabProps) {
  const historyQuery = useProjectHistory(projectId);
  const items = historyQuery.data ?? [];

  if (historyQuery.isLoading) {
    return <LoadingSkeleton rows={6} />;
  }

  return (
    <section className="space-y-3">
      <h2 className="px-1 text-[14px] font-medium text-gray-900">История проекта</h2>

      {items.length === 0 ? (
        <div className="rounded-[12px] border border-dashed border-[#F0F0F0] bg-white px-4 py-10 text-center text-sm text-gray-500">
          Событий пока нет
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id}>
              <ProjectHistoryEventCard
                label={resolveHistoryLabel(item)}
                createdAt={item.createdAt}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
