import { ChevronRight, Paperclip } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { SectionHeading } from "@/components/common/SectionHeading";
import { LoadingSkeleton } from "@/components/common/LoadingSpinner";
import { useDocuments } from "@/lib/api/hooks/useDocuments";
import { DocumentOpenLink } from "@/components/common/DocumentAccess";
import { normalizeProjectDocumentType } from "@/lib/constants/project-documents";

type ProjectDocumentsSectionProps = {
  projectId: string;
};

export function ProjectDocumentsSection({ projectId }: ProjectDocumentsSectionProps) {
  const { t } = useTranslation();
  const { data: documents, isLoading } = useDocuments({
    entityType: "project",
    entityId: projectId,
  });

  const visibleDocuments = useMemo(
    () =>
      (documents ?? []).filter(
        (doc) => normalizeProjectDocumentType(doc.documentType) !== "estimate",
      ),
    [documents],
  );

  const count = visibleDocuments.length;

  return (
    <section>
      <div className="flex items-center gap-2 pb-1">
        <SectionHeading className="pb-0">{t("worker.projects.documents")}</SectionHeading>
        <span className="flex min-h-[16px] min-w-[20px] items-center justify-center rounded-full bg-[#90A1B9] px-1 text-[10px] font-semibold text-white">
          {count}
        </span>
      </div>

      {isLoading ? (
        <LoadingSkeleton rows={2} />
      ) : count === 0 ? (
        <p className="pt-1 text-[12px] text-[#8E97AF]">{t("worker.projects.documentsEmpty")}</p>
      ) : (
        <ul className="overflow-hidden rounded-2xl border border-[#E0E4EC] bg-white">
          {visibleDocuments.map((doc) => (
            <li key={doc.id} className="border-b border-[#E0E4EC] last:border-b-0">
              <DocumentOpenLink
                documentId={doc.id}
                filename={doc.filename}
                mimeType={doc.mimeType}
                className="flex items-center justify-between px-4 py-3.5 text-sm text-[#1A1C29] hover:bg-gray-50"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Paperclip className="h-4 w-4 shrink-0 text-[#8E97AF]" />
                  <span className="truncate">{doc.filename}</span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-[#8E97AF]" />
              </DocumentOpenLink>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
