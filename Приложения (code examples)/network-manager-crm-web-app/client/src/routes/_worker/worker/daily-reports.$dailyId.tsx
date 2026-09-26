import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Calendar, Mic, Paperclip } from "lucide-react";
import { useTranslation } from "react-i18next";
import { WorkerAppLayout } from "@/components/layout/WorkerAppLayout";
import { LoadingSkeleton } from "@/components/common/LoadingSpinner";
import { PageError } from "@/components/common/PageError";
import {
  SupervisorDailyReportForm,
  type SupervisorDailyReportSubmitPayload,
} from "@/components/worker/SupervisorDailyReportForm";
import { deriveSiteStatus } from "@/components/worker/daily-report/types";
import { ReportStatusBadge } from "@/components/worker/reports/ReportStatusBadge";
import { useDocuments } from "@/lib/api/hooks/useDocuments";
import { useMyProjects, useProjectCrew } from "@/lib/api/hooks/useProjects";
import {
  usePatchSupervisorReport,
  useSupervisorReport,
  useTranscribeSupervisorReport,
} from "@/lib/api/hooks/useReports";
import { DocumentOpenLink } from "@/components/common/DocumentAccess";
import { uploadDocument } from "@/lib/api/documents";
import { siteStatusMeta } from "@/lib/constants/status";
import { formatDate, parseDecimal } from "@/lib/format";
import { shouldOpenReportForm } from "@/lib/worker-reports";
import { showError, showSuccess } from "@/lib/toast";

export const Route = createFileRoute("/_worker/worker/daily-reports/$dailyId")({
  head: () => ({ meta: [{ title: "Ежедневный отчёт — Работник" }] }),
  component: WorkerDailyReportDetailPage,
});

async function uploadReportFile(reportId: string, file: File, documentType: string) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("entityType", "supervisor_report");
  fd.append("entityId", reportId);
  fd.append("documentType", documentType);
  await uploadDocument(fd);
}

function WorkerDailyReportDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { dailyId } = Route.useParams();
  const { data: report, isLoading, isError, refetch } = useSupervisorReport(dailyId);
  const patchReport = usePatchSupervisorReport();
  const transcribe = useTranscribeSupervisorReport();
  const [selectedProjectId, setSelectedProjectId] = useState("");

  const { data: projects } = useMyProjects({ status: "active" });
  const supervisorProjects = (projects ?? []).filter((p) => p.role === "supervisor");
  const projectOptions = supervisorProjects.map((p) => ({ id: p.id, name: p.name }));

  const activeProjectId = selectedProjectId || report?.projectId || projectOptions[0]?.id || "";
  const { data: crewData } = useProjectCrew(activeProjectId, !!activeProjectId);

  const crewMembers = useMemo(
    () =>
      (crewData ?? [])
        .filter((m) => m.role !== "supervisor")
        .map((m) => ({
          id: m.userId,
          firstName: m.firstName,
          lastName: m.lastName,
        })),
    [crewData],
  );

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

  const handleSubmit = async (payload: SupervisorDailyReportSubmitPayload) => {
    try {
      await patchReport.mutateAsync({
        id: dailyId,
        payload: {
          siteStatus: deriveSiteStatus(payload),
          description: payload.completedWorks,
          completedWorks: payload.completedWorks,
          issueCategory: payload.hasIssue ? (payload.issueCategory ?? "") : "",
          issueDescription: payload.hasIssue ? (payload.issueDescription ?? "") : "",
          downtimeHours: payload.hasDowntime ? (payload.downtimeHours ?? "") : "",
          downtimeReason: payload.hasDowntime ? (payload.downtimeReason ?? "") : "",
          crewUserIds: payload.crewUserIds ?? [],
          linkedIssueIds: payload.linkedIssueIds ?? [],
        },
      });

      for (const photo of payload.photos) {
        await uploadReportFile(dailyId, photo, "photo");
      }
      for (const doc of payload.mediaDocuments) {
        const docType = doc.type.startsWith("image/") ? "photo" : "downtime_attachment";
        await uploadReportFile(dailyId, doc, docType);
      }
      for (const photo of payload.issuePhotos) {
        await uploadReportFile(dailyId, photo, "issue_attachment");
      }
      for (const file of payload.downtimeFiles) {
        await uploadReportFile(dailyId, file, "downtime_attachment");
      }

      if (payload.voiceBlob) {
        const voiceFile = new File([payload.voiceBlob], "voice-d-1.webm", {
          type: "audio/webm",
        });
        const fd = new FormData();
        fd.append("file", voiceFile);
        fd.append("entityType", "supervisor_report");
        fd.append("entityId", dailyId);
        fd.append("documentType", "voice");
        const voiceDoc = await uploadDocument(fd);
        await patchReport.mutateAsync({
          id: dailyId,
          payload: { voiceDocumentId: voiceDoc.id },
        });
      }

      const transcriptionSource = payload.completedWorks?.trim() || "";
      if (transcriptionSource) {
        await transcribe.mutateAsync({
          id: dailyId,
          transcription: transcriptionSource,
        });
      }

      showSuccess(t("worker.reports.updated"));
      await navigate({ to: "/worker/reports", search: { type: "daily" } });
    } catch (err) {
      showError(err);
    }
  };

  if (editable) {
    return (
      <WorkerAppLayout
        activeNav="reports"
        title={t("worker.dailyReport.editTitle")}
        showBack
        backTo="/worker/reports"
        className="bg-[#F1F5F9"
      >
        <SupervisorDailyReportForm
          projects={projectOptions}
          crewMembers={crewMembers}
          initial={report}
          isEdit
          onProjectChange={setSelectedProjectId}
          onSubmit={handleSubmit}
          onCancel={() => void navigate({ to: "/worker/reports" })}
          submitting={patchReport.isPending}
        />
      </WorkerAppLayout>
    );
  }

  return <WorkerDailyReportReadOnlyView report={report} dailyId={dailyId} />;
}

function WorkerDailyReportReadOnlyView({
  report,
  dailyId,
}: {
  report: NonNullable<ReturnType<typeof useSupervisorReport>["data"]>;
  dailyId: string;
}) {
  const { t } = useTranslation();
  const { data: documents } = useDocuments({
    entityType: "supervisor_report",
    entityId: dailyId,
  });

  const site = siteStatusMeta[report.siteStatus ?? "ok"] ?? siteStatusMeta.ok;
  const downtimeHours = parseDecimal(report.downtimeHours);
  const isDowntime = report.siteStatus === "downtime" || downtimeHours > 0;

  return (
    <WorkerAppLayout
      activeNav="reports"
      title={t("worker.reports.dailyTitle")}
      showBack
      backTo="/worker/reports"
      showNav={false}
      className="bg-[#F1F5F9"
    >
      <main className="space-y-4 px-4 pb-6 pt-2">
        <section className="rounded-[12px] border border-slate-100 bg-white p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900">{report.projectName}</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-600">
                <Calendar className="h-3 w-3 text-slate-400" />
                <span className="text-[14px] text-slate-500">{formatDate(report.reportDate)}</span>
              </p>
            </div>
            {isDowntime ? (
              <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-600">
                {t("worker.reports.downtimeBadge", { hours: downtimeHours })}
              </span>
            ) : (
              <ReportStatusBadge status={report.status} variant="supervisor" />
            )}
          </div>
          <p className="mt-3 text-sm text-gray-600">
            {t("worker.reports.siteStatus")}: <span className="font-medium">{site.label}</span>
          </p>
        </section>

        {isDowntime ? (
          <section className="rounded-[12px] border border-red-100 bg-red-50 p-3">
            <p className="text-sm font-medium text-red-800">
              {t("worker.reports.downtime", { hours: downtimeHours })}
            </p>
            {report.downtimeReason ? (
              <p className="mt-1 text-sm text-red-700">{report.downtimeReason}</p>
            ) : null}
          </section>
        ) : null}

        {report.managerComment ? (
          <section className="rounded-[12px] border border-red-100 bg-red-50 p-3">
            <p className="text-sm text-gray-500">{t("worker.reports.managerComment")}</p>
            <p className="mt-1 text-sm font-medium text-red-600">{report.managerComment}</p>
          </section>
        ) : null}

        {report.description ? (
          <section className="rounded-[12px] border border-slate-100 bg-white p-3">
            <h2 className="mb-2 text-sm font-semibold text-gray-900">
              {t("worker.reports.field.description")}
            </h2>
            <p className="whitespace-pre-line text-sm text-gray-700">{report.description}</p>
          </section>
        ) : null}

        {report.transcription ? (
          <section className="rounded-[12px] border border-slate-100 bg-white p-3">
            <h2 className="mb-2 flex items-center gap-1 text-sm font-semibold text-gray-900">
              <Mic className="h-4 w-4 text-gray-400" />
              {t("worker.reports.transcription")}
            </h2>
            <p className="whitespace-pre-line text-sm text-gray-700">{report.transcription}</p>
          </section>
        ) : null}

        {documents && documents.length > 0 ? (
          <section className="rounded-[12px] border border-slate-100 bg-white p-3">
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
