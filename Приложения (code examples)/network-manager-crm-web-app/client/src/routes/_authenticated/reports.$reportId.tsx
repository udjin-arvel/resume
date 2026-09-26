import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import type { z } from "zod";
import { AppLayout } from "@/components/layout/AppLayout";
import { LoadingSkeleton } from "@/components/common/LoadingSpinner";
import { PageError } from "@/components/common/PageError";
import {
  WorkerReportCalculationSection,
  WorkerReportDescriptionSection,
  WorkerReportDetailHeader,
  WorkerReportExpensesSection,
  WorkerReportFilesSection,
  WorkerReportGeneralSection,
  WorkerReportHoursSection,
  WorkerReportReviewActions,
  dayDefs,
} from "@/components/reports/worker-report-detail";
import { useDocuments } from "@/lib/api/hooks/useDocuments";
import {
  useApproveWorkerReport,
  useRejectWorkerReport,
  useSupervisorReports,
  useWorkerReport,
} from "@/lib/api/hooks/useReports";
import type { workerReportSchema } from "@/lib/api/schemas";
import { parseDecimal } from "@/lib/format";
import { showError, showSuccess } from "@/lib/toast";

type WorkerReport = z.infer<typeof workerReportSchema>;

export const Route = createFileRoute("/_authenticated/reports/$reportId")({
  head: () => ({
    meta: [{ title: "Отчёт работника — Менеджер" }],
  }),
  component: ReportDetail,
});

function ReportDetail() {
  const { reportId } = Route.useParams();
  const { data: report, isLoading, isError, refetch } = useWorkerReport(reportId);

  if (isLoading) {
    return (
      <AppLayout activeNav="reports" showBack backTo="/reports">
        <LoadingSkeleton rows={6} />
      </AppLayout>
    );
  }

  if (isError || !report) {
    return (
      <AppLayout activeNav="reports" showBack backTo="/reports">
        <PageError onRetry={() => refetch()} />
      </AppLayout>
    );
  }

  return <ReportDetailContent report={report} />;
}

function ReportDetailContent({ report }: { report: WorkerReport }) {
  const approveReport = useApproveWorkerReport();
  const rejectReport = useRejectWorkerReport();
  const [returnMode, setReturnMode] = useState(false);
  const [comment, setComment] = useState("");

  const supervisorQuery = useSupervisorReports({
    projectId: report.projectId,
    from: report.weekStart,
    to: report.weekEnd,
    pageSize: 100,
  });

  const { data: documents } = useDocuments({
    entityType: "worker_report",
    entityId: report.id,
  });

  const downtimeHours = useMemo(() => {
    const items = supervisorQuery.data?.items ?? [];
    return items.reduce((sum, r) => sum + parseDecimal(r.downtimeHours), 0);
  }, [supervisorQuery.data?.items]);

  const expenses = report.expenses ?? [];
  const totalHours =
    parseDecimal(report.totalHours) ||
    dayDefs.reduce((a, d) => a + parseDecimal(report[d.field]), 0);
  const expensesTotal =
    report.expensesTotal !== undefined && report.expensesTotal !== ""
      ? parseDecimal(report.expensesTotal)
      : expenses.reduce((a, e) => a + parseDecimal(e.amount), 0);
  const grandTotal = parseDecimal(report.totalAmount);
  const laborCost = Math.max(0, grandTotal - expensesTotal);
  const hourlyRate = parseDecimal(report.hourlyRate);

  const handleApprove = async () => {
    try {
      await approveReport.mutateAsync(report.id);
      showSuccess("Отчёт принят");
    } catch (err) {
      showError(err);
    }
  };

  const handleReject = async () => {
    try {
      await rejectReport.mutateAsync({ id: report.id, comment: comment.trim() });
      showSuccess("Отчёт возвращён работнику");
      setReturnMode(false);
      setComment("");
    } catch (err) {
      showError(err);
    }
  };

  const showReviewActions =
    report.status === "review" ||
    report.status === "overdue" ||
    report.status === "approved" ||
    report.status === "returned";

  return (
    <AppLayout activeNav="reports" showBack backTo="/reports" className="bg-[#F1F5F9">
      <WorkerReportDetailHeader />

      <main className="space-y-4 p-4">
        <WorkerReportGeneralSection report={report} downtimeHours={downtimeHours} />
        <WorkerReportHoursSection report={report} />
        <WorkerReportDescriptionSection description={report.description ?? ""} />
        <WorkerReportExpensesSection expenses={expenses} expensesTotal={expensesTotal} />
        <WorkerReportFilesSection documents={documents ?? []} />
        <WorkerReportCalculationSection
          hourlyRate={hourlyRate}
          totalHours={totalHours}
          laborCost={laborCost}
          expensesTotal={expensesTotal}
          grandTotal={grandTotal}
        />
      </main>

      {showReviewActions ? (
        <WorkerReportReviewActions
          status={report.status}
          managerComment={report.managerComment}
          returnMode={returnMode}
          comment={comment}
          onCommentChange={setComment}
          onReturnMode={() => setReturnMode(true)}
          onCancelReturn={() => {
            setReturnMode(false);
            setComment("");
          }}
          onApprove={handleApprove}
          onReject={handleReject}
          approvePending={approveReport.isPending}
          rejectPending={rejectReport.isPending}
        />
      ) : null}
    </AppLayout>
  );
}
