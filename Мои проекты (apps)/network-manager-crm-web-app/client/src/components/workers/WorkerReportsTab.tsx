import { useMemo } from "react";
import type { z } from "zod";
import { LoadingSkeleton } from "@/components/common/LoadingSpinner";
import { PageError } from "@/components/common/PageError";
import { ProjectSectionHeader } from "@/components/projects/ProjectSectionHeader";
import { WorkerReportMiniCard } from "@/components/workers/WorkerReportMiniCard";
import {
  useApproveWorkerReport,
  useRejectWorkerReport,
  useRemindWorkerReport,
  useRevertWorkerReportReturn,
  useWorkerReports,
} from "@/lib/api/hooks/useReports";
import type { workerReportSchema } from "@/lib/api/schemas";
import { showError, showSuccess } from "@/lib/toast";

type WorkerReport = z.infer<typeof workerReportSchema>;

type WorkerReportsTabProps = {
  workerId: string;
};

type ProjectGroup = {
  projectId: string;
  projectName: string;
  reports: WorkerReport[];
  latestWeekStart: string;
};

function groupReportsByProject(reports: WorkerReport[]): ProjectGroup[] {
  const map = new Map<string, ProjectGroup>();

  for (const report of reports) {
    const key = report.projectId;
    const existing = map.get(key);
    if (existing) {
      existing.reports.push(report);
      if (report.weekStart > existing.latestWeekStart) {
        existing.latestWeekStart = report.weekStart;
      }
    } else {
      map.set(key, {
        projectId: key,
        projectName: report.projectName ?? "—",
        reports: [report],
        latestWeekStart: report.weekStart,
      });
    }
  }

  return [...map.values()]
    .map((group) => ({
      ...group,
      reports: [...group.reports].sort((a, b) => a.weekStart.localeCompare(b.weekStart)),
    }))
    .sort((a, b) => b.latestWeekStart.localeCompare(a.latestWeekStart));
}

export function WorkerReportsTab({ workerId }: WorkerReportsTabProps) {
  const reportsQuery = useWorkerReports({ workerId, pageSize: 50 });
  const approveReport = useApproveWorkerReport();
  const rejectReport = useRejectWorkerReport();
  const revertReturn = useRevertWorkerReportReturn();
  const remindReport = useRemindWorkerReport();

  const grouped = useMemo(
    () => groupReportsByProject(reportsQuery.data?.items ?? []),
    [reportsQuery.data?.items],
  );

  const handleApprove = async (id: string) => {
    try {
      await approveReport.mutateAsync(id);
      showSuccess("Отчёт принят");
    } catch (err) {
      showError(err);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectReport.mutateAsync({ id });
      showSuccess("Отчёт возвращён");
    } catch (err) {
      showError(err);
    }
  };

  const handleRevertReturn = async (id: string) => {
    try {
      await revertReturn.mutateAsync(id);
      showSuccess("Возврат отменён");
    } catch (err) {
      showError(err);
    }
  };

  const handleRemind = async (id: string) => {
    try {
      await remindReport.mutateAsync(id);
      showSuccess("Напоминание отправлено");
    } catch (err) {
      showError(err);
    }
  };

  if (reportsQuery.isLoading) {
    return <LoadingSkeleton rows={4} />;
  }

  if (reportsQuery.isError) {
    return <PageError onRetry={() => reportsQuery.refetch()} />;
  }

  if (grouped.length === 0) {
    return (
      <div className="rounded-[12px] border border-dashed border-[#F0F0F0] bg-white px-4 py-8 text-center text-[12px] md:text-[14px] text-slate-500">
        Нет отчётов
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {grouped.map((group) => (
        <section key={group.projectId}>
          <ProjectSectionHeader title={group.projectName} />
          <ul className="mt-3 space-y-3">
            {group.reports.map((report) => (
              <WorkerReportMiniCard
                key={report.id}
                report={report}
                onApprove={handleApprove}
                onReject={handleReject}
                onRevertReturn={handleRevertReturn}
                onRemind={handleRemind}
                approvePending={approveReport.isPending}
                rejectPending={rejectReport.isPending}
                revertPending={revertReturn.isPending}
                remindPending={remindReport.isPending}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
