import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { TriangleAlert, Wrench, UserPlus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { NotParticipateIcon, ReportIcon } from "@/components/icons";
import { AppLayout } from "@/components/layout/AppLayout";
import { LoadingSkeleton } from "@/components/common/LoadingSpinner";
import { PageError } from "@/components/common/PageError";
import { EmptyState } from "@/components/common/EmptyState";
import {
  ActionGrid,
  ActionGridItem,
  DashboardHeader,
  InviteLinkDialog,
  RecentActivity,
  SendNotificationDialog,
  TaskCard,
  UrgentFilterTabs,
  type UrgentFilter,
} from "@/components/dashboard";
import { useDashboardActivity, useUrgentActions } from "@/lib/api/hooks/useDashboard";
import { mapActivityToListItem } from "@/lib/activity-display";
import { urgentToneByKey } from "@/lib/constants/status";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Radar CRM" },
      {
        name: "description",
        content:
          "Операционный экран менеджера: срочные действия, последняя активность и быстрые действия.",
      },
    ],
  }),
  component: ManagerHome,
});

type Tone = "red" | "amber" | "blue";

const toneColors: Record<Tone, string> = {
  red: "#FF3B30",
  amber: "#FF9F0A",
  blue: "#007AFF",
};

const toneIconBgs: Record<Tone, string> = {
  red: "#FEF2F2",
  amber: "#FFF3E0",
  blue: "#EFF6FF",
};

const urgentIcons: Record<string, LucideIcon> = {
  pending_workers: UserPlus,
  unconfirmed_workers: NotParticipateIcon,
  supervisor_reports_review: ReportIcon,
  worker_reports_review: ReportIcon,
  site_issue: TriangleAlert,
  site_downtime: TriangleAlert,
  overdue_reports: TriangleAlert,
  tools_attention: Wrench,
};

function urgentRoute(key: string): string {
  switch (key) {
    case "pending_workers":
      return "/workers";
    case "unconfirmed_workers":
      return "/projects";
    case "worker_reports_review":
    case "supervisor_reports_review":
    case "overdue_reports":
      return "/reports";
    case "site_issue":
    case "site_downtime":
      return "/projects";
    case "tools_attention":
      return "/tools";
    default:
      return "/";
  }
}

function urgentItemRoute(key: string, itemId: string) {
  switch (key) {
    case "pending_workers":
    case "unconfirmed_workers":
      return { to: "/workers/$workerId" as const, params: { workerId: itemId } };
    case "supervisor_reports_review":
      return { to: "/daily-reports/$dailyId" as const, params: { dailyId: itemId } };
    case "worker_reports_review":
    case "overdue_reports":
      return { to: "/reports/$reportId" as const, params: { reportId: itemId } };
    case "site_issue":
    case "site_downtime":
      return { to: "/projects/$projectId" as const, params: { projectId: itemId } };
    case "tools_attention":
      return { to: "/tools/$toolId" as const, params: { toolId: itemId } };
    default:
      return null;
  }
}

function ManagerHome() {
  const navigate = useNavigate();
  const urgent = useUrgentActions();
  const activity = useDashboardActivity();
  const [filter, setFilter] = useState<UrgentFilter>("all");
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  const today = new Date().toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
  });

  const filterCounts = useMemo(() => {
    const counts = { all: 0, red: 0, amber: 0, blue: 0 };
    if (!urgent.data) return counts;

    for (const item of urgent.data) {
      counts.all += item.count;
      const tone = urgentToneByKey[item.key] ?? "blue";
      counts[tone] += item.count;
    }
    return counts;
  }, [urgent.data]);

  const filteredUrgent = useMemo(() => {
    if (!urgent.data) return [];
    if (filter === "all") return urgent.data;
    return urgent.data.filter((item) => (urgentToneByKey[item.key] ?? "blue") === filter);
  }, [urgent.data, filter]);

  const navigateToUrgent = (key: string) => {
    navigate({ to: urgentRoute(key) });
  };

  const navigateToUrgentItem = (key: string, itemId: string) => {
    const route = urgentItemRoute(key, itemId);
    if (route) {
      void navigate(route);
      return;
    }
    navigateToUrgent(key);
  };

  return (
    <AppLayout activeNav="home">
      <DashboardHeader title="Главная" dateLabel={`Сегодня, ${today}`} />

      <div className="space-y-6 px-4 pb-8">
        <ActionGrid>
          <ActionGridItem
            iconSrc="/icons/plus.svg"
            to="/projects"
            search={{ create: "1" }}
            label={<span>Создать<br />проект</span>}
          />
          <ActionGridItem
            iconSrc="/icons/workers.svg"
            to="/workers"
            search={{ create: "1" }}
            label="Добавить работника"
          />
          <ActionGridItem
            iconSrc="/icons/link.svg"
            label="Ссылка на приглашение"
            onClick={() => setInviteOpen(true)}
          />
          <ActionGridItem
            iconSrc="/icons/telegram.svg"
            label="Отправить уведомление"
            onClick={() => setNotifyOpen(true)}
          />
          <ActionGridItem
            iconSrc="/icons/outlay.svg"
            to="/estimates/$estimateId"
            params={{ estimateId: "new" }}
            label={<span>Создать<br />смету</span>}
          />
          <ActionGridItem
            iconSrc="/icons/tool.svg"
            to="/tools"
            search={{ create: "1" }}
            label="Добавить инструмент"
          />
        </ActionGrid>

        <UrgentFilterTabs
          activeFilter={filter}
          onChange={setFilter}
          counts={filterCounts}
        >
          {urgent.isLoading ? (
            <LoadingSkeleton rows={3} />
          ) : urgent.isError ? (
            <PageError onRetry={() => urgent.refetch()} />
          ) : !filteredUrgent.length ? (
            <EmptyState title="Нет срочных действий" />
          ) : (<>
            {filteredUrgent.map((item) => {
              const Icon = urgentIcons[item.key] ?? TriangleAlert;
              const tone = urgentToneByKey[item.key] ?? "blue";
              const badgeColor = toneColors[tone];
              const iconBgColor = toneIconBgs[tone];

              return (
                <TaskCard
                  key={item.key}
                  title={item.title}
                  icon={Icon}
                  iconColor={badgeColor}
                  iconBgColor={iconBgColor}
                  count={item.count}
                  badgeColor={badgeColor}
                  items={item.preview.map((row) => ({
                    id: row.id,
                    title: row.name,
                    subtitle: row.label,
                  }))}
                  onHeaderClick={() => navigateToUrgent(item.key)}
                  onItemClick={(id) => navigateToUrgentItem(item.key, id)}
                  onShowAll={() => navigateToUrgent(item.key)}
                />
              );
            })}
          </>)}
        </UrgentFilterTabs>

        {activity.isLoading ? (
          <LoadingSkeleton rows={4} />
        ) : activity.isError ? (
          <PageError onRetry={() => activity.refetch()} />
        ) : !activity.data?.items.length ? (
          <EmptyState title="Нет активности" />
        ) : (
          <RecentActivity
            items={activity.data.items.map(mapActivityToListItem)}
            showAllLink="/activity"
          />
        )}
      </div>

      <InviteLinkDialog open={inviteOpen} onOpenChange={setInviteOpen} />
      <SendNotificationDialog open={notifyOpen} onOpenChange={setNotifyOpen} />
    </AppLayout>
  );
}
