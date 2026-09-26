import { Paperclip, Trash2, Upload } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDeleteDocument, useDocuments, useUploadDocument } from "@/lib/api/hooks/useDocuments";
import { uploadWorkerReportDocument } from "@/lib/submit-worker-report";
import { showError, showSuccess } from "@/lib/toast";
import { ReportFormSection } from "./ReportFormSection";

type ReportDocumentsSectionProps = {
  reportId?: string;
  onEnsureDraft?: () => Promise<string>;
  onUploadingChange?: (uploading: boolean) => void;
};

export function ReportDocumentsSection({
  reportId,
  onEnsureDraft,
  onUploadingChange,
}: ReportDocumentsSectionProps) {
  const { t } = useTranslation();
  const uploadDoc = useUploadDocument();
  const deleteDoc = useDeleteDocument();
  const { data: documents, refetch } = useDocuments({
    entityType: "worker_report",
    entityId: reportId,
  });

  const handlePick = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = "image/*,application/pdf";
    input.onchange = async () => {
      const files = input.files ? Array.from(input.files) : [];
      if (!files.length) return;

      onUploadingChange?.(true);
      try {
        let targetId = reportId;
        if (!targetId) {
          if (!onEnsureDraft) {
            showError(t("worker.reports.draftRequiredFields"));
            return;
          }
          targetId = await onEnsureDraft();
        }

        for (const file of files) {
          await uploadWorkerReportDocument(targetId, file, "general", uploadDoc.mutateAsync);
        }
        await refetch();
        showSuccess(t("worker.reports.documentUploaded"));
      } catch (err) {
        showError(err);
      } finally {
        onUploadingChange?.(false);
      }
    };
    input.click();
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc.mutateAsync(id);
      await refetch();
    } catch (err) {
      showError(err);
    }
  };

  return (
    <ReportFormSection title={t("worker.reports.section.documents")}>
      <div className="space-y-2">
        {documents?.map((doc) => (
          <div key={doc.id} className="flex items-center justify-between py-2">
            <span className="flex min-w-0 items-center gap-2 text-sm text-gray-700">
              <Paperclip className="h-4 w-4 shrink-0 text-gray-400" />
              <span className="truncate">{doc.filename}</span>
            </span>
            <button
              type="button"
              onClick={() => void handleDelete(doc.id)}
              className="shrink-0 text-red-500 hover:text-red-600"
              aria-label={t("worker.reports.removeDocument")}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => void handlePick()}
          disabled={uploadDoc.isPending}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 py-6 text-gray-500 transition-colors hover:bg-gray-50 disabled:opacity-60"
        >
          <Upload className="h-6 w-6" />
          <span className="text-sm">{t("worker.reports.uploadDocument")}</span>
        </button>
      </div>
    </ReportFormSection>
  );
}
