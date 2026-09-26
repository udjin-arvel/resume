import { useTranslation } from "react-i18next";
import { openDocument } from "@/components/common/DocumentAccess";
import { LoadingSkeleton } from "@/components/common/LoadingSpinner";
import { PageError } from "@/components/common/PageError";
import { ProfileDocumentRow } from "@/components/worker/profile/ProfileDocumentRow";
import { ProfileSectionHeading } from "@/components/worker/profile/ProfileSectionHeading";
import { useDocuments } from "@/lib/api/hooks/useDocuments";
import { parseApiError } from "@/lib/api/client";
import { preferredDisposition } from "@/lib/document-access";
import { showError } from "@/lib/toast";
import {
  WORKER_DOCUMENT_TYPES,
  workerDocumentTypeMeta,
  type WorkerDocumentType,
} from "@/lib/worker-documents";

type WorkerApplicationDocumentsSectionProps = {
  workerId: string;
};

export function WorkerApplicationDocumentsSection({
  workerId,
}: WorkerApplicationDocumentsSectionProps) {
  const { t } = useTranslation();
  const docsQuery = useDocuments({ entityType: "user", entityId: workerId });

  if (docsQuery.isLoading) {
    return <LoadingSkeleton rows={3} />;
  }

  if (docsQuery.isError) {
    return <PageError onRetry={() => docsQuery.refetch()} />;
  }

  const documents = docsQuery.data ?? [];

  const handleOpenDocument = (id: string, mimeType?: string) => {
    void openDocument(id, mimeType ? preferredDisposition(mimeType) : undefined).catch((err) =>
      showError(parseApiError(err)),
    );
  };

  return (
    <section>
      <ProfileSectionHeading>{t("workers.application.documents")}</ProfileSectionHeading>
      <div className="overflow-hidden rounded-[12px] bg-white">
        {WORKER_DOCUMENT_TYPES.map((type: WorkerDocumentType) => {
          const doc = documents.find((d) => d.documentType === type);
          const Icon = workerDocumentTypeMeta[type].icon;
          const title = t(workerDocumentTypeMeta[type].labelKey);
          const subtitle = doc?.filename ?? t("worker.profile.documentMissing");

          return (
            <ProfileDocumentRow
              key={type}
              title={title}
              subtitle={subtitle}
              icon={Icon}
              onClick={doc ? () => handleOpenDocument(doc.id, doc.mimeType) : undefined}
            />
          );
        })}
      </div>
    </section>
  );
}
