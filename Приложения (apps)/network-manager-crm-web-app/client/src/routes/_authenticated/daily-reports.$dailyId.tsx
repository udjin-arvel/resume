import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { LoadingSkeleton } from "@/components/common/LoadingSpinner";
import { PageError } from "@/components/common/PageError";
import {
  SupervisorReportCompletedWorksSection,
  SupervisorReportCrewSection,
  SupervisorReportDescriptionSection,
  SupervisorReportDetailHeader,
  SupervisorReportDowntimeSection,
  SupervisorReportGeneralSection,
  SupervisorReportIssueSection,
  SupervisorReportManagerCommentSection,
  SupervisorReportPhotosSection,
  SupervisorReportRelatedIssueSection,
  SupervisorReportReviewActions,
  SupervisorReportVoiceSection,
} from "@/components/reports/supervisor-report-detail";
import { useDocuments } from "@/lib/api/hooks/useDocuments";
import {
  useApproveSupervisorReport,
  useAttentionSupervisorReport,
  useCommentSupervisorReport,
  useSupervisorReport,
} from "@/lib/api/hooks/useReports";
import { groupSupervisorReportDocuments } from "@/lib/supervisor-report-documents";
import { showError, showSuccess } from "@/lib/toast";

export const Route = createFileRoute("/_authenticated/daily-reports/$dailyId")({
  head: () => ({ meta: [{ title: "Отчёт супервайзера — Менеджер" }] }),
  component: DailyReportDetail,
});

function DailyReportDetail() {
  const { dailyId } = Route.useParams();
  const { data: report, isLoading, isError, refetch } = useSupervisorReport(dailyId);

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

  return <DailyReportDetailContent report={report} />;
}

function DailyReportDetailContent({
  report,
}: {
  report: NonNullable<ReturnType<typeof useSupervisorReport>["data"]>;
}) {
  const approveReport = useApproveSupervisorReport();
  const attentionReport = useAttentionSupervisorReport();
  const commentReport = useCommentSupervisorReport();
  const [comment, setComment] = useState("");

  const { data: documents } = useDocuments({
    entityType: "supervisor_report",
    entityId: report.id,
  });

  const grouped = useMemo(
    () => groupSupervisorReportDocuments(documents ?? []),
    [documents],
  );

  const voiceFilename =
    grouped.voice[0]?.filename ??
    documents?.find((d) => d.id === report.voiceDocumentId)?.filename ??
    undefined;

  const handleApprove = async () => {
    try {
      await approveReport.mutateAsync(report.id);
      showSuccess("Отчёт принят");
    } catch (err) {
      showError(err);
    }
  };

  const handleAttention = async () => {
    try {
      await attentionReport.mutateAsync(report.id);
      showSuccess("Отмечено как требующее внимания");
    } catch (err) {
      showError(err);
    }
  };

  const handleSaveComment = async () => {
    if (!comment.trim()) return;
    try {
      await commentReport.mutateAsync({ id: report.id, comment: comment.trim() });
      showSuccess("Комментарий сохранён");
      setComment("");
    } catch (err) {
      showError(err);
    }
  };

  const showReviewActions =
    report.status === "review" || report.status === "approved" || report.status === "attention";

  return (
    <AppLayout activeNav="reports" showBack backTo="/reports" className="bg-[#F1F5F9">
      <SupervisorReportDetailHeader />

      <main className="space-y-4 p-4">
        <SupervisorReportGeneralSection report={report} />
        <SupervisorReportVoiceSection
          voiceDocumentId={report.voiceDocumentId}
          voiceFilename={voiceFilename}
          transcription={report.transcription}
        />
        <SupervisorReportDescriptionSection description={report.description ?? ""} />
        <SupervisorReportPhotosSection photos={grouped.photos} />
        <SupervisorReportCompletedWorksSection completedWorks={report.completedWorks ?? ""} />
        <SupervisorReportCrewSection crew={report.crewPresent ?? []} />
        <SupervisorReportIssueSection
          category={report.issueCategory}
          description={report.issueDescription}
          attachments={grouped.issueAttachments}
        />
        <SupervisorReportDowntimeSection
          downtimeHours={report.downtimeHours}
          downtimeReason={report.downtimeReason}
          attachments={grouped.downtimeAttachments}
        />
        {report.relatedIssue ? (
          <SupervisorReportRelatedIssueSection
            projectId={report.projectId}
            issue={report.relatedIssue}
            readOnly={report.status === "approved"}
          />
        ) : null}
        <SupervisorReportManagerCommentSection
          comment={comment}
          savedComment={report.managerComment}
          onCommentChange={setComment}
          onSave={handleSaveComment}
          saving={commentReport.isPending}
        />
      </main>

      {showReviewActions ? (
        <SupervisorReportReviewActions
          status={report.status}
          onApprove={handleApprove}
          onAttention={handleAttention}
          approvePending={approveReport.isPending}
          attentionPending={attentionReport.isPending}
        />
      ) : null}
    </AppLayout>
  );
}
