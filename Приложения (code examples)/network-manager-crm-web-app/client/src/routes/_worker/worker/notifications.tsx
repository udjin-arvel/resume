import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BellOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { WorkerAppLayout } from "@/components/layout/WorkerAppLayout";
import { EmptyState } from "@/components/common/EmptyState";
import { PageError } from "@/components/common/PageError";
import {
  NotificationCard,
  NotificationCardSkeleton,
} from "@/components/worker/notifications/NotificationCard";
import {
  useMarkNotificationRead,
  useNotifications,
} from "@/lib/api/hooks/useNotifications";
import { resolveNotificationLink, parseWorkerNotificationNavigateTarget } from "@/lib/worker-notifications";

export const Route = createFileRoute("/_worker/worker/notifications")({
  head: () => ({ meta: [{ title: "Уведомления — Работник" }] }),
  component: WorkerNotificationsPage,
});

function WorkerNotificationsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useNotifications();
  const markRead = useMarkNotificationRead();

  const handleOpen = async (notification: NonNullable<typeof data>[number]) => {
    if (!notification.readAt) {
      try {
        await markRead.mutateAsync(notification.id);
      } catch {
        // navigation still allowed
      }
    }
    const target = parseWorkerNotificationNavigateTarget(
      notification.link,
      notification.notificationType,
    );
    if (target) {
      void navigate(target as Parameters<typeof navigate>[0]);
    }
  };

  return (
    <WorkerAppLayout 
      activeNav="notifications" 
      className="bg-[#F1F5F9]"
      title={t("worker.notifications.title")}
    >
      <div className="px-4 pb-6 pt-4">
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <NotificationCardSkeleton key={i} />
            ))}
          </div>
        ) : isError ? (
          <PageError onRetry={() => refetch()} />
        ) : !data?.length ? (
          <EmptyState icon={BellOff} title={t("worker.notifications.empty")} />
        ) : (
          <div className="flex flex-col gap-3">
            {data.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onClick={() => void handleOpen(notification)}
              />
            ))}
          </div>
        )}
      </div>
    </WorkerAppLayout>
  );
}
