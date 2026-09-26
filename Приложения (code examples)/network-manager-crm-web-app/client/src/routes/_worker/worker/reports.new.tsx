import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { WorkerAppLayout } from "@/components/layout/WorkerAppLayout";
import { EmptyState } from "@/components/common/EmptyState";
import {
  WorkerReportForm,
  type WorkerReportSubmitPayload,
} from "@/components/worker/reports/WorkerReportForm";
import { useMyProjects } from "@/lib/api/hooks/useProjects";
import { useCreateWorkerReport, useUpdateWorkerReport } from "@/lib/api/hooks/useReports";
import { uploadDocument } from "@/lib/api/documents";
import {
  buildWorkerReportPayload,
  uploadExpenseReceipts,
} from "@/lib/submit-worker-report";
import { showError, showSuccess } from "@/lib/toast";
import { filterProjectsByRole } from "@/lib/worker-projects";

type Search = { projectId?: string };

type ExpensePayload = {
  expenseType: string;
  amount: string;
  comment?: string;
  documentId?: string;
};

export const Route = createFileRoute("/_worker/worker/reports/new")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    projectId: typeof search.projectId === "string" ? search.projectId : undefined,
  }),
  head: () => ({ meta: [{ title: "Новый отчёт — Работник" }] }),
  component: NewWorkerReportPage,
});

function NewWorkerReportPage() {
  const { t } = useTranslation();
  const { projectId } = Route.useSearch();
  const navigate = useNavigate();
  const { data: projects } = useMyProjects({ status: "active", confirmationStatus: "confirmed" });
  const createReport = useCreateWorkerReport();
  const updateReport = useUpdateWorkerReport();
  const draftIdRef = useRef<string | null>(null);

  const workerProjects = useMemo(
    () => filterProjectsByRole(projects ?? [], "worker"),
    [projects],
  );

  const projectOptions = workerProjects.map((p) => ({ id: p.id, name: p.name }));

  const defaultProjectId = useMemo(() => {
    if (projectId && workerProjects.some((p) => p.id === projectId)) {
      return projectId;
    }
    return projectOptions[0]?.id;
  }, [projectId, workerProjects, projectOptions]);

  const handleEnsureDraft = async (values: Record<string, unknown>) => {
    if (draftIdRef.current) return draftIdRef.current;
    const report = await createReport.mutateAsync({ ...values, asDraft: true });
    draftIdRef.current = report.id;
    showSuccess(t("worker.reports.draftSaved"));
    await navigate({
      to: "/worker/reports/$reportId",
      params: { reportId: report.id },
      replace: true,
    });
    return report.id;
  };

  const handleSubmit = async (data: WorkerReportSubmitPayload) => {
    try {
      const body = buildWorkerReportPayload(data);
      const report = await createReport.mutateAsync(body);
      const expenses = await uploadExpenseReceipts(
        report.id,
        (body.expenses as ExpensePayload[]) ?? [],
        data.expenseFiles,
        uploadDocument,
      );
      if (expenses.length > 0) {
        await updateReport.mutateAsync({ id: report.id, payload: { ...body, expenses } });
      }
      showSuccess(t("worker.reports.submitted"));
      await navigate({
        to: "/worker/reports/$reportId",
        params: { reportId: report.id },
      });
    } catch (err) {
      showError(err);
    }
  };

  return (
    <WorkerAppLayout
      activeNav="reports"
      title={t("worker.reports.newWeeklyTitle")}
      showBack
      backTo="/worker/reports"
      showNav={false}
      className="bg-[#F1F5F9]"
    >
      {!projectOptions.length ? (
        <div className="px-4 pt-4">
          <EmptyState title={t("worker.reports.emptyNoWorkerProjects")} />
        </div>
      ) : (
        <WorkerReportForm
          projects={projectOptions}
          defaultProjectId={defaultProjectId}
          onSubmit={handleSubmit}
          onCancel={() => void navigate({ to: "/worker/reports", search: { type: "weekly" } })}
          onEnsureDraft={handleEnsureDraft}
          submitting={createReport.isPending || updateReport.isPending}
        />
      )}
    </WorkerAppLayout>
  );
}
