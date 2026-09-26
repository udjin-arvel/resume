import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { LoadingSkeleton } from "@/components/common/LoadingSpinner";
import { PageError } from "@/components/common/PageError";
import { WorkerApplicationView } from "@/components/workers/application/WorkerApplicationView";
import { WorkerApplicationRejectedView } from "@/components/workers/application/WorkerApplicationRejectedView";
import {
  WorkerBlockedBanner,
  WorkerDetailHeader,
  WorkerDocumentsTab,
  WorkerFinanceTab,
  WorkerProfileTab,
  WorkerProjectsTab,
  WorkerReportsTab,
  WorkerTabBar,
  WorkerToolsTab,
  type WorkerTabItem,
} from "@/components/workers";
import { useDocuments } from "@/lib/api/hooks/useDocuments";
import { useTools } from "@/lib/api/hooks/useTools";
import { useUnblockWorker, useWorker, useWorkerProjects } from "@/lib/api/hooks/useWorkers";
import { showError, showSuccess } from "@/lib/toast";

export const Route = createFileRoute("/_authenticated/workers/$workerId")({
  head: ({ params }) => ({
    meta: [{ title: `Работник — ${params.workerId}` }],
  }),
  component: WorkerDetail,
});

type Tab = "profile" | "documents" | "projects" | "reports" | "finance" | "tools";

function WorkerDetail() {
  const { workerId } = Route.useParams();
  const workerQuery = useWorker(workerId);
  const projectsQuery = useWorkerProjects(workerId);
  const documentsQuery = useDocuments({ entityType: "user", entityId: workerId });
  const toolsQuery = useTools({ pageSize: 200 });
  const unblockWorker = useUnblockWorker();
  const [tab, setTab] = useState<Tab>("profile");
  const [unblockDialogOpen, setUnblockDialogOpen] = useState(false);

  const toolsCount = useMemo(
    () =>
      (toolsQuery.data?.items ?? []).filter(
        (tool) => tool.activeAssignment?.responsibleUserId === workerId,
      ).length,
    [toolsQuery.data?.items, workerId],
  );

  const tabs = useMemo<WorkerTabItem<Tab>[]>(
    () => [
      { id: "profile", label: "Профиль" },
      {
        id: "documents",
        label: "Документы",
        count: documentsQuery.data?.length,
      },
      {
        id: "projects",
        label: "Проекты",
        count: projectsQuery.data?.length,
      },
      { id: "reports", label: "Отчёты" },
      { id: "finance", label: "Финансы" },
      { id: "tools", label: "Инструменты", count: toolsCount },
    ],
    [documentsQuery.data?.length, projectsQuery.data?.length, toolsCount],
  );

  if (workerQuery.isLoading) {
    return (
      <AppLayout activeNav="workers">
        <LoadingSkeleton rows={6} />
      </AppLayout>
    );
  }

  if (workerQuery.isError || !workerQuery.data) {
    return (
      <AppLayout activeNav="workers">
        <PageError onRetry={() => workerQuery.refetch()} />
      </AppLayout>
    );
  }

  const worker = workerQuery.data;

  if (worker.status === "pending") {
    return (
      <AppLayout activeNav="workers" className="bg-[#F5F6F8]">
        <div className="space-y-4 bg-[#F5F6F8] pb-6 text-[#111827]">
          <WorkerApplicationView worker={worker} workerId={workerId} />
        </div>
      </AppLayout>
    );
  }

  if (worker.status === "rejected") {
    return (
      <AppLayout activeNav="workers" className="bg-[#F5F6F8]">
        <div className="space-y-4 bg-[#F5F6F8] pb-6 text-[#111827]">
          <WorkerApplicationRejectedView worker={worker} workerId={workerId} />
        </div>
      </AppLayout>
    );
  }

  const handleUnblock = async () => {
    try {
      await unblockWorker.mutateAsync(workerId);
      showSuccess("Работник разблокирован");
      setUnblockDialogOpen(false);
    } catch (err) {
      showError(err);
    }
  };

  return (
    <AppLayout activeNav="workers" className="bg-[#F5F6F8]">
      <div className="space-y-4 bg-[#F5F6F8] pb-6 text-[#111827]">
        <WorkerDetailHeader worker={worker} />

        <div className="space-y-4 px-2">
          <WorkerTabBar tabs={tabs} activeTab={tab} onChange={setTab} />

          {worker.status === "blocked" ? (
            <WorkerBlockedBanner
              worker={worker}
              onUnblock={() => setUnblockDialogOpen(true)}
              unblockPending={unblockWorker.isPending}
            />
          ) : null}

          <main className="space-y-4">
            {tab === "profile" && <WorkerProfileTab worker={worker} />}
            {tab === "documents" && <WorkerDocumentsTab workerId={workerId} />}
            {tab === "projects" && <WorkerProjectsTab workerId={workerId} />}
            {tab === "reports" && <WorkerReportsTab workerId={workerId} />}
            {tab === "finance" && <WorkerFinanceTab workerId={workerId} />}
            {tab === "tools" && <WorkerToolsTab workerId={workerId} />}
          </main>
        </div>
      </div>

      <ConfirmDialog
        open={unblockDialogOpen}
        onOpenChange={setUnblockDialogOpen}
        title="Разблокировать пользователя?"
        confirmLabel="Да"
        onConfirm={handleUnblock}
      />
    </AppLayout>
  );
}
