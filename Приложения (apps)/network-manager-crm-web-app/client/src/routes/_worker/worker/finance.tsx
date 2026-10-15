import { createFileRoute } from "@tanstack/react-router";
import { Wallet } from "lucide-react";
import { useTranslation } from "react-i18next";
import { WorkerAppLayout } from "@/components/layout/WorkerAppLayout";
import { EmptyState } from "@/components/common/EmptyState";
import { PageError } from "@/components/common/PageError";
import {
  FinanceStatsGrid,
  FinanceStatsGridSkeleton,
} from "@/components/worker/finance/FinanceStatsGrid";
import {
  ProjectFinanceCard,
  ProjectFinanceCardSkeleton,
} from "@/components/worker/finance/ProjectFinanceCard";
import { useWorkerFinanceMine } from "@/lib/api/hooks/useFinance";

export const Route = createFileRoute("/_worker/worker/finance")({
  head: () => ({ meta: [{ title: "Финансы — Работник" }] }),
  component: WorkerFinancePage,
});

function WorkerFinancePage() {
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = useWorkerFinanceMine();

  return (
    <WorkerAppLayout 
      activeNav="finance" 
      className="bg-slate-50"
      title={t("worker.finance.title")}
    >
      <div className="space-y-0 px-4 pb-6 pt-4">
        {isLoading ? (
          <>
            <FinanceStatsGridSkeleton />
            <h2 className="mb-3 mt-6 text-sm font-bold text-gray-500">
              {t("worker.finance.projectsTitle")}
            </h2>
            <div className="flex flex-col gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <ProjectFinanceCardSkeleton key={i} />
              ))}
            </div>
          </>
        ) : isError ? (
          <PageError onRetry={() => refetch()} />
        ) : (
          <>
            <FinanceStatsGrid
              data={{
                totalHours: data?.totalHours ?? "0",
                confirmedHours: data?.confirmedHours ?? "0",
                paidAmount: data?.paidAmount ?? "0",
                remainingAmount: data?.remainingAmount ?? "0",
              }}
            />

            <h2 className="mb-3 mt-6 text-sm font-bold text-gray-500">
              {t("worker.finance.projectsTitle")}
            </h2>

            {!data?.projects.length ? (
              <EmptyState
                icon={Wallet}
                title={t("worker.finance.empty")}
              />
            ) : (
              <div className="flex flex-col gap-3">
                {data.projects.map((project) => (
                  <ProjectFinanceCard key={project.projectId} project={project} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </WorkerAppLayout>
  );
}
