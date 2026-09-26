import { useTranslation } from "react-i18next";
import type { z } from "zod";
import { openDocument } from "@/components/common/DocumentAccess";
import { parseApiError } from "@/lib/api/client";
import type { documentSchema } from "@/lib/api/schemas";
import { preferredDisposition } from "@/lib/document-access";
import { showError } from "@/lib/toast";
import {
  WORKER_DOCUMENT_TYPES,
  workerDocumentTypeMeta,
  type WorkerDocumentType,
} from "@/lib/worker-documents";
import { ProfileDocumentRow } from "./ProfileDocumentRow";
import { ProfileSectionHeading } from "./ProfileSectionHeading";

type ProfileDocumentsSectionProps = {
  documents?: z.infer<typeof documentSchema>[];
};

export function ProfileDocumentsSection({ documents }: ProfileDocumentsSectionProps) {
  const { t } = useTranslation();

  const handleOpenDocument = (id: string, mimeType?: string) => {
    void openDocument(id, mimeType ? preferredDisposition(mimeType) : undefined).catch((err) =>
      showError(parseApiError(err)),
    );
  };

  return (
    <section className="mb-4">
      <ProfileSectionHeading>{t("worker.profile.documents")}</ProfileSectionHeading>
      <div className="overflow-hidden rounded-[12px] bg-white border border-slate-200">
        {WORKER_DOCUMENT_TYPES.map((type: WorkerDocumentType) => {
          const doc = documents?.find((d) => d.documentType === type);
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
