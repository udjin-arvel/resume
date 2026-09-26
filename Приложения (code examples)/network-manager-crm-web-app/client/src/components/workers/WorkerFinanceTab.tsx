import { useMemo } from "react";
import { LoadingSkeleton } from "@/components/common/LoadingSpinner";
import { PageError } from "@/components/common/PageError";
import {
  ProjectFinanceCard,
  ProjectFinanceCardSkeleton,
} from "@/components/worker/finance/ProjectFinanceCard";
import {
  WorkerFinanceSummaryGrid,
  WorkerFinanceSummaryGridSkeleton,
} from "@/components/workers/WorkerFinanceSummaryGrid";
import { useFinanceWorker } from "@/lib/api/hooks/useFinance";
import { parseDecimal } from "@/lib/format";

type WorkerFinanceTabProps = {
  workerId: string;
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="px-1 text-[14px] font-medium text-slate-500">{children}</h2>
  );
}

export function WorkerFinanceTab({ workerId }: WorkerFinanceTabProps) {
  const financeQuery = useFinanceWorker(workerId);

  const summary = useMemo(() => {
    const data = financeQuery.data;
    if (!data) return null;

    const totalLaborAmount = data.projects.reduce(
      (sum, p) => sum + parseDecimal(p.projectAmount),
      0,
    );
    const totalExtraExpenses = data.projects.reduce(
      (sum, p) => sum + parseDecimal(p.extraExpenses),
      0,
    );

    return {
      confirmedHours: data.confirmedHours,
      totalLaborAmount,
      totalExtraExpenses,
      paidAmount: data.paidAmount,
      remainingAmount: data.remainingAmount,
    };
  }, [financeQuery.data]);

  if (financeQuery.isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <SectionTitle>Всего</SectionTitle>
          <WorkerFinanceSummaryGridSkeleton />
        </div>
        <div className="space-y-3">
          <SectionTitle>По проектам</SectionTitle>
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <ProjectFinanceCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (financeQuery.isError) {
    return <PageError onRetry={() => financeQuery.refetch()} />;
  }

  const projects = financeQuery.data?.projects ?? [];

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div className="space-y-0.5">
          <SectionTitle>Всего</SectionTitle>
          <p className="px-1 text-[12px] text-slate-400">
            Финансы считаются только на основе принятых отчётов
          </p>
        </div>
        {summary ? <WorkerFinanceSummaryGrid data={summary} /> : null}
      </section>

      <section className="space-y-3">
        <SectionTitle>По проектам</SectionTitle>
        {projects.length === 0 ? (
          <div className="rounded-[12px] border border-dashed border-[#F0F0F0] bg-white px-4 py-8 text-center text-[12px] md:text-[14px] text-slate-500">
            Нет данных по проектам
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map((project) => (
              <ProjectFinanceCard
                key={project.projectId}
                project={project}
                variant="workerDetail"
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
