import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { WorkerAppLayout } from "@/components/layout/WorkerAppLayout";
import {
  SupervisorDailyReportForm,
  type SupervisorDailyReportSubmitPayload,
} from "@/components/worker/SupervisorDailyReportForm";
import { deriveSiteStatus } from "@/components/worker/daily-report/types";
import { uploadDocument } from "@/lib/api/documents";
import { useMyProjects, useProjectCrew } from "@/lib/api/hooks/useProjects";
import {
  useCreateSupervisorReport,
  usePatchSupervisorReport,
  useTranscribeSupervisorReport,
} from "@/lib/api/hooks/useReports";
import { showError, showSuccess } from "@/lib/toast";
import { useMemo, useState } from "react";

type Search = { projectId?: string };

export const Route = createFileRoute("/_worker/worker/daily-reports/new")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    projectId: typeof search.projectId === "string" ? search.projectId : undefined,
  }),
  head: () => ({ meta: [{ title: "Новый ежедневный отчёт — Супервайзер" }] }),
  component: NewDailyReportPage,
});

async function uploadReportFile(reportId: string, file: File, documentType: string) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("entityType", "supervisor_report");
  fd.append("entityId", reportId);
  fd.append("documentType", documentType);
  await uploadDocument(fd);
}

function NewDailyReportPage() {
  const { t } = useTranslation();
  const { projectId: defaultProjectId } = Route.useSearch();
  const navigate = useNavigate();
  const { data: projects } = useMyProjects({ status: "active" });
  const createReport = useCreateSupervisorReport();
  const patchReport = usePatchSupervisorReport();
  const transcribe = useTranscribeSupervisorReport();
  const [selectedProjectId, setSelectedProjectId] = useState(defaultProjectId ?? "");

  const supervisorProjects = (projects ?? []).filter((p) => p.role === "supervisor");
  const projectOptions = supervisorProjects.map((p) => ({ id: p.id, name: p.name }));

  const activeProjectId = selectedProjectId || defaultProjectId || projectOptions[0]?.id || "";
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

  const buildReportPayload = (payload: SupervisorDailyReportSubmitPayload) => ({
    projectId: payload.projectId,
    reportDate: payload.reportDate,
    siteStatus: deriveSiteStatus(payload),
    description: payload.completedWorks,
    completedWorks: payload.completedWorks,
    issueCategory: payload.hasIssue ? (payload.issueCategory ?? "") : "",
    issueDescription: payload.hasIssue ? (payload.issueDescription ?? "") : "",
    downtimeHours: payload.hasDowntime ? (payload.downtimeHours ?? "") : "",
    downtimeReason: payload.hasDowntime ? (payload.downtimeReason ?? "") : "",
    crewUserIds: payload.crewUserIds ?? [],
    linkedIssueIds: payload.linkedIssueIds ?? [],
  });

  const handleSubmit = async (payload: SupervisorDailyReportSubmitPayload) => {
    setSelectedProjectId(payload.projectId);
    try {
      const report = await createReport.mutateAsync(buildReportPayload(payload));

      for (const photo of payload.photos) {
        await uploadReportFile(report.id, photo, "photo");
      }
      for (const doc of payload.mediaDocuments) {
        const docType = doc.type.startsWith("image/") ? "photo" : "downtime_attachment";
        await uploadReportFile(report.id, doc, docType);
      }
      for (const photo of payload.issuePhotos) {
        await uploadReportFile(report.id, photo, "issue_attachment");
      }
      for (const file of payload.downtimeFiles) {
        await uploadReportFile(report.id, file, "downtime_attachment");
      }

      if (payload.voiceBlob) {
        const voiceFile = new File([payload.voiceBlob], "voice-d-1.webm", {
          type: "audio/webm",
        });
        const fd = new FormData();
        fd.append("file", voiceFile);
        fd.append("entityType", "supervisor_report");
        fd.append("entityId", report.id);
        fd.append("documentType", "voice");
        const voiceDoc = await uploadDocument(fd);
        await patchReport.mutateAsync({
          id: report.id,
          payload: { voiceDocumentId: voiceDoc.id },
        });
      }

      const transcriptionSource = payload.completedWorks?.trim() || "";
      if (transcriptionSource) {
        await transcribe.mutateAsync({
          id: report.id,
          transcription: transcriptionSource,
        });
      }

      showSuccess(t("worker.reports.submitted"));
      await navigate({
        to: "/worker/daily-reports/$dailyId",
        params: { dailyId: report.id },
      });
    } catch (err) {
      showError(err);
    }
  };

  return (
    <WorkerAppLayout
      activeNav="reports"
      title={t("worker.dailyReport.newTitle")}
      showBack
      backTo="/worker/reports"
      showNav={false}
      className="bg-[#F1F5F9"
    >
      <SupervisorDailyReportForm
        projects={projectOptions}
        crewMembers={crewMembers}
        defaultProjectId={defaultProjectId}
        onProjectChange={setSelectedProjectId}
        onSubmit={handleSubmit}
        onCancel={() => void navigate({ to: "/worker/reports" })}
        submitting={createReport.isPending || patchReport.isPending}
      />
    </WorkerAppLayout>
  );
}
