import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { IdCard } from "lucide-react";
import { WorkerAppLayout } from "@/components/layout/WorkerAppLayout";
import { LoadingSkeleton } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import { FileUpload } from "@/components/common/FileUpload";
import { useAuth } from "@/hooks/useAuth";
import {
  useDocuments,
  useReplaceDocument,
  useUploadDocument,
} from "@/lib/api/hooks/useDocuments";
import { DocumentOpenLink } from "@/components/common/DocumentAccess";
import {
  WORKER_DOCUMENT_TYPES,
  workerDocumentTypeMeta,
  type WorkerDocumentType,
} from "@/lib/worker-documents";
import { showError, showSuccess } from "@/lib/toast";

export const Route = createFileRoute("/_worker/worker/documents")({
  head: () => ({ meta: [{ title: "Документы — Работник" }] }),
  component: WorkerDocumentsPage,
});

function WorkerDocumentsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: docs, isLoading } = useDocuments({
    entityType: "user",
    entityId: user?.id,
  });
  const uploadDoc = useUploadDocument();

  const grouped = WORKER_DOCUMENT_TYPES.map((type) => ({
    type,
    label: t(workerDocumentTypeMeta[type].labelKey),
    icon: workerDocumentTypeMeta[type].icon,
    items: docs?.filter((d) => d.documentType === type) ?? [],
  }));

  const handleUpload = async (type: WorkerDocumentType, files: File[]) => {
    if (!user || !files[0]) return;
    const fd = new FormData();
    fd.append("file", files[0]);
    fd.append("entityType", "user");
    fd.append("entityId", user.id);
    fd.append("documentType", type);
    try {
      await uploadDoc.mutateAsync(fd);
      showSuccess(t("worker.documents.uploaded"));
    } catch (err) {
      showError(err);
    }
  };

  return (
    <WorkerAppLayout activeNav="documents" title={t("worker.nav.documents")}>
      <div className="space-y-4 px-4 pt-5 pb-5">
        {isLoading ? (
          <LoadingSkeleton rows={4} />
        ) : (
          grouped.map(({ type, label, icon: Icon, items }) => (
            <DocumentSection
              key={type}
              type={type}
              label={label}
              icon={Icon}
              items={items}
              onUpload={(files) => handleUpload(type, files)}
            />
          ))
        )}
      </div>
    </WorkerAppLayout>
  );
}

function DocumentSection({
  label,
  icon: Icon,
  items,
  onUpload,
}: {
  type: WorkerDocumentType;
  label: string;
  icon: typeof IdCard;
  items: { id: string; filename: string; mimeType?: string }[];
  onUpload: (files: File[]) => void;
}) {
  const existingId = items[0]?.id ?? "";
  const replaceDoc = useReplaceDocument(existingId);

  const handleFiles = async (files: File[]) => {
    if (!files[0]) return;
    if (!items[0]) {
      onUpload(files);
      return;
    }
    const fd = new FormData();
    fd.append("file", files[0]);
    try {
      await replaceDoc.mutateAsync(fd);
      showSuccess("Документ обновлён");
    } catch (err) {
      showError(err);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
        <Icon className="h-4 w-4" />
        {label}
      </h2>
      {items.length === 0 ? (
        <EmptyState title="Документ не загружен" />
      ) : (
        <ul className="mb-3 space-y-2">
          {items.map((d) => (
            <li key={d.id}>
              <DocumentOpenLink
                documentId={d.id}
                filename={d.filename}
                mimeType={d.mimeType}
                className="text-sm text-blue-600 hover:underline"
              >
                {d.filename}
              </DocumentOpenLink>
            </li>
          ))}
        </ul>
      )}
      <FileUpload
        label={items.length ? "Заменить" : "Загрузить"}
        onFiles={handleFiles}
      />
    </section>
  );
}
