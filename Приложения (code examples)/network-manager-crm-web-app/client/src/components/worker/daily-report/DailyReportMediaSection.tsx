import { useMemo } from "react";
import { ImagePlus, Paperclip, Trash2, Upload, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDeleteDocument, useDocuments } from "@/lib/api/hooks/useDocuments";
import { showError } from "@/lib/toast";
import { DailyReportFormSection } from "./DailyReportFormSection";
import {
  dailyReportAddPhotoButtonClass,
  dailyReportUploadDocumentButtonClass,
  dailyReportUploadDocumentLabelClass,
} from "./button-styles";

type DailyReportMediaSectionProps = {
  reportId?: string;
  photos: File[];
  onPhotosChange: (files: File[]) => void;
  documents: File[];
  onDocumentsChange: (files: File[]) => void;
};

function isImageFile(file: File) {
  return file.type.startsWith("image/");
}

export function DailyReportMediaSection({
  reportId,
  photos,
  onPhotosChange,
  documents,
  onDocumentsChange,
}: DailyReportMediaSectionProps) {
  const { t } = useTranslation();
  const deleteDoc = useDeleteDocument();
  const { data: existingDocs, refetch } = useDocuments(
    {
      entityType: "supervisor_report",
      entityId: reportId,
    },
    { enabled: !!reportId },
  );

  const existingPhotos = useMemo(
    () =>
      (existingDocs ?? []).filter(
        (d) => d.documentType === "photo" || (d.mimeType?.startsWith("image/") ?? false),
      ),
    [existingDocs],
  );

  const existingPdfs = useMemo(
    () =>
      (existingDocs ?? []).filter(
        (d) =>
          d.documentType !== "photo" &&
          d.documentType !== "voice" &&
          d.documentType !== "issue_attachment" &&
          d.documentType !== "downtime_attachment" &&
          !(d.mimeType?.startsWith("image/") ?? false),
      ),
    [existingDocs],
  );

  const isEmpty =
    photos.length === 0 &&
    documents.length === 0 &&
    existingPhotos.length === 0 &&
    existingPdfs.length === 0;

  const pickFiles = (accept: string, multiple: boolean, onPick: (files: File[]) => void) => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = multiple;
    input.accept = accept;
    input.onchange = () => {
      const files = input.files ? Array.from(input.files) : [];
      if (files.length) onPick(files);
    };
    input.click();
  };

  const removeLocalPhoto = (index: number) => {
    onPhotosChange(photos.filter((_, i) => i !== index));
  };

  const removeLocalDoc = (index: number) => {
    onDocumentsChange(documents.filter((_, i) => i !== index));
  };

  const handleDeleteExisting = async (id: string) => {
    try {
      await deleteDoc.mutateAsync(id);
      await refetch();
    } catch (err) {
      showError(err);
    }
  };

  return (
    <DailyReportFormSection title={t("worker.reports.section.documents")}>
      {isEmpty ? (
        <p className="mb-3 text-center text-[12px] md:text-[14px] text-gray-400">{t("worker.dailyReport.empty.media")}</p>
      ) : null}
      <div className="space-y-4">
        {(photos.length > 0 || existingPhotos.length > 0) && (
          <div className="grid grid-cols-3 gap-2">
            {existingPhotos.map((doc) => (
              <div key={doc.id} className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
                <div className="p-1 flex h-full items-center justify-center break-all text-[12px] text-slate-500">
                  {doc.filename}
                </div>
                <button
                  type="button"
                  onClick={() => void handleDeleteExisting(doc.id)}
                  className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white"
                  aria-label={t("worker.reports.removeDocument")}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {photos.map((file, index) => (
              <div key={`${file.name}-${index}`} className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
                {isImageFile(file) ? (
                  <img
                    src={URL.createObjectURL(file)}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-gray-500">
                    {file.name}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeLocalPhoto(index)}
                  className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() =>
            pickFiles("image/*", true, (files) => onPhotosChange([...photos, ...files]))
          }
          className={dailyReportAddPhotoButtonClass}
        >
          <ImagePlus className="h-4 w-4" />
          {t("worker.dailyReport.addPhoto")}
        </button>

        {(documents.length > 0 || existingPdfs.length > 0) && (
          <div className="space-y-2">
            {existingPdfs.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between py-1">
                <span className="flex min-w-0 items-center gap-2 text-sm text-gray-700">
                  <Paperclip className="h-4 w-4 shrink-0 text-gray-400" />
                  <span className="truncate">{doc.filename}</span>
                </span>
                <button
                  type="button"
                  onClick={() => void handleDeleteExisting(doc.id)}
                  className="shrink-0 text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {documents.map((file, index) => (
              <div key={`${file.name}-${index}`} className="flex items-center justify-between py-1">
                <span className="flex min-w-0 items-center gap-2 text-sm text-gray-700">
                  <Paperclip className="h-4 w-4 shrink-0 text-gray-400" />
                  <span className="truncate">{file.name}</span>
                </span>
                <button
                  type="button"
                  onClick={() => removeLocalDoc(index)}
                  className="shrink-0 text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() =>
            pickFiles("application/pdf,image/*", true, (files) =>
              onDocumentsChange([...documents, ...files]),
            )
          }
          className={dailyReportUploadDocumentButtonClass}
        >
          <Upload className="h-5 w-5" />
          <span className={dailyReportUploadDocumentLabelClass}>{t("worker.reports.uploadDocument")}</span>
        </button>
      </div>
    </DailyReportFormSection>
  );
}
