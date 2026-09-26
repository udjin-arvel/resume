import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Clock, Paperclip, Wallet } from "lucide-react";
import { useTranslation } from "react-i18next";
import { WorkerAppLayout } from "@/components/layout/WorkerAppLayout";
import { LoadingSkeleton } from "@/components/common/LoadingSpinner";
import { PageError } from "@/components/common/PageError";
import {
  WorkerReportForm,
  type WorkerReportSubmitPayload,
} from "@/components/worker/reports/WorkerReportForm";
import { ReportStatusBadge } from "@/components/worker/reports/ReportStatusBadge";
import { useMyProjects } from "@/lib/api/hooks/useProjects";
import { useDocuments } from "@/lib/api/hooks/useDocuments";
import {
  useUpdateWorkerReport,
  useWorkerReport,
} from "@/lib/api/hooks/useReports";
import { DocumentOpenLink } from "@/components/common/DocumentAccess";
import { uploadDocument } from "@/lib/api/documents";
import { formatDate, formatMoney, parseDecimal } from "@/lib/format";
import { getWeekLabel, shouldOpenReportForm } from "@/lib/worker-reports";
import {
  buildWorkerReportPayload,
  uploadExpenseReceipts,
} from "@/lib/submit-worker-report";
import { showError, showSuccess } from "@/lib/toast";

const dayDefs = [
  { key: "mon", labelKey: "worker.reports.days.mon", field: "hoursMon" as const },
  { key: "tue", labelKey: "worker.reports.days.tue", field: "hoursTue" as const },
  { key: "wed", labelKey: "worker.reports.days.wed", field: "hoursWed" as const },
  { key: "thu", labelKey: "worker.reports.days.thu", field: "hoursThu" as const },
  { key: "fri", labelKey: "worker.reports.days.fri", field: "hoursFri" as const },
  { key: "sat", labelKey: "worker.reports.days.sat", field: "hoursSat" as const },
  { key: "sun", labelKey: "worker.reports.days.sun", field: "hoursSun" as const },
];

const expenseTypeKeys: Record<string, string> = {
  flight: "worker.reports.expense.flight",
  hotel: "worker.reports.expense.hotel",
  transport: "worker.reports.expense.transport",
  taxi: "worker.reports.expense.transport",
  car: "worker.reports.expense.transport",
  food: "worker.reports.expense.food",
  materials: "worker.reports.expense.materials",
  other: "worker.reports.expense.other",
};

export const Route = createFileRoute("/_worker/worker/reports/$reportId")({
  head: () => ({ meta: [{ title: "Отчёт — Работник" }] }),
  component: WorkerReportDetailPage,
});

function WorkerReportDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { reportId } = Route.useParams();
  const { data: report, isLoading, isError, refetch } = useWorkerReport(reportId);
  const { data: projects } = useMyProjects({ status: "active", confirmationStatus: "confirmed" });
  const updateReport = useUpdateWorkerReport();

  if (isLoading) {
    return (
      <WorkerAppLayout activeNav="reports" showBack backTo="/worker/reports" showNav={false}>
        <LoadingSkeleton rows={6} />
      </WorkerAppLayout>
    );
  }

  if (isError || !report) {
    return (
      <WorkerAppLayout activeNav="reports" showBack backTo="/worker/reports" showNav={false}>
        <PageError onRetry={() => refetch()} />
      </WorkerAppLayout>
    );
  }

  const editable = shouldOpenReportForm(report.status);

  if (editable) {
    const projectOptions = (projects ?? []).map((p) => ({ id: p.id, name: p.name }));
    const isDraft = report.status === "draft";

    const handleSubmit = async (data: WorkerReportSubmitPayload) => {
      try {
        const body = buildWorkerReportPayload(data);
        const expenses = await uploadExpenseReceipts(
          report.id,
          (body.expenses as {
            expenseType: string;
            amount: string;
            comment?: string;
            documentId?: string;
          }[]) ?? [],
          data.expenseFiles,
          uploadDocument,
        );
        await updateReport.mutateAsync({
          id: report.id,
          payload: { ...body, expenses, submit: isDraft },
        });
        showSuccess(isDraft ? t("worker.reports.submitted") : t("worker.reports.updated"));
        if (isDraft) {
          await navigate({ to: "/worker/reports/$reportId", params: { reportId: report.id } });
        } else {
          await refetch();
        }
      } catch (err) {
        showError(err);
      }
    };

    return (
      <WorkerAppLayout
        activeNav="reports"
        title={isDraft ? t("worker.reports.newWeeklyTitle") : t("worker.reports.editWeeklyTitle")}
        showBack
        backTo="/worker/reports"
        showNav={false}
        className="bg-[#F1F5F9]"
      >
        <WorkerReportForm
          projects={projectOptions}
          initial={report}
          reportId={report.id}
          isDraft={isDraft}
          submitting={updateReport.isPending}
          onSubmit={handleSubmit}
          onCancel={() => void navigate({ to: "/worker/reports" })}
        />
      </WorkerAppLayout>
    );
  }

  return (
    <WorkerReportReadOnlyView report={report} />
  );
}

function WorkerReportReadOnlyView({
  report,
}: {
  report: NonNullable<ReturnType<typeof useWorkerReport>["data"]>;
}) {
  const { t } = useTranslation();
  const { data: documents } = useDocuments({
    entityType: "worker_report",
    entityId: report.id,
  });

  const days = dayDefs.map((d) => ({
    ...d,
    hours: parseDecimal(report[d.field]),
  }));
  const totalHours =
    parseDecimal(report.totalHours) || days.reduce((a, d) => a + d.hours, 0);
  const expenses = report.expenses ?? [];
  const expenseTotal = expenses.reduce((a, e) => a + parseDecimal(e.amount), 0);
  const weekLabel = getWeekLabel(report.weekStart, t);

  return (
    <WorkerAppLayout
      activeNav="reports"
      title={weekLabel || report.projectName}
      showBack
      backTo="/worker/reports"
      showNav={false}
      className="bg-[#F1F5F9]"
    >
      <main className="space-y-4 px-4 pb-6 pt-2">
        <section className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm text-gray-500">{report.projectName}</p>
              <p className="mt-1 text-sm text-gray-600">
                {formatDate(report.weekStart)} – {formatDate(report.weekEnd)}
              </p>
            </div>
            <ReportStatusBadge status={report.status} />
          </div>
        </section>

        {report.status === "returned" && report.managerComment ? (
          <section className="rounded-xl border border-red-100 bg-red-50 p-4">
            <p className="text-sm text-gray-500">{t("worker.reports.managerComment")}</p>
            <p className="mt-1 text-sm font-medium text-red-600">{report.managerComment}</p>
          </section>
        ) : null}

        <section className="rounded-xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-gray-900">
            {t("worker.reports.section.hours")}
          </h2>
          <ul className="divide-y divide-gray-100">
            {days.map((d) => (
              <li key={d.key} className="flex justify-between py-2 text-sm">
                <span className="text-gray-600">{t(d.labelKey)}</span>
                <span
                  className={`font-semibold tabular-nums ${
                    d.hours === 0 ? "text-gray-300" : "text-gray-900"
                  }`}
                >
                  {d.hours} ч
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="h-4 w-4" /> {t("worker.reports.total")}
            </span>
            <span className="font-semibold">{totalHours} ч</span>
          </div>
        </section>

        {report.description ? (
          <section className="rounded-xl bg-white p-4 shadow-sm">
            <h2 className="mb-2 text-sm font-semibold text-gray-900">
              {t("worker.reports.field.description")}
            </h2>
            <p className="whitespace-pre-line text-sm text-gray-700">{report.description}</p>
          </section>
        ) : null}

        <section className="rounded-xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-gray-900">
            {t("worker.reports.section.expenses")}
          </h2>
          {expenses.length === 0 ? (
            <p className="text-sm text-gray-400">{t("worker.reports.noExpenses")}</p>
          ) : (
            <ul className="space-y-2">
              {expenses.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50/60 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {t(expenseTypeKeys[e.expenseType] ?? expenseTypeKeys.other)}
                    </p>
                    {e.comment ? (
                      <p className="truncate text-xs text-gray-500">{e.comment}</p>
                    ) : null}
                    {e.documentId ? (
                      <DocumentOpenLink
                        documentId={e.documentId}
                        className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-700"
                      >
                        <Paperclip className="h-3 w-3" />
                        {t("worker.reports.receipt")}
                      </DocumentOpenLink>
                    ) : null}
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-gray-900 tabular-nums">
                    {formatMoney(e.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {expenseTotal > 0 ? (
            <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Wallet className="h-4 w-4" /> {t("worker.reports.expenseTotal")}
              </span>
              <span className="font-semibold">{formatMoney(expenseTotal)}</span>
            </div>
          ) : null}
        </section>

        {documents && documents.length > 0 ? (
          <section className="rounded-xl bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-gray-900">
              {t("worker.reports.section.documents")}
            </h2>
            <ul className="space-y-2">
              {documents.map((doc) => (
                <li key={doc.id}>
                  <DocumentOpenLink
                    documentId={doc.id}
                    filename={doc.filename ?? undefined}
                    mimeType={doc.mimeType}
                    className="flex items-center gap-2 rounded-lg border border-gray-100 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Paperclip className="h-4 w-4 text-gray-400" />
                    <span className="truncate">{doc.filename ?? doc.id}</span>
                  </DocumentOpenLink>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>
    </WorkerAppLayout>
  );
}
