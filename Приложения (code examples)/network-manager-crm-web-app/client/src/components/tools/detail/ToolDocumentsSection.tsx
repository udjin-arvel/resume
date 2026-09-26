import { ChevronRight, Paperclip } from "lucide-react";
import { LoadingSkeleton } from "@/components/common/LoadingSpinner";
import { DocumentOpenLink } from "@/components/common/DocumentAccess";
import { SectionCountBadge } from "@/components/common/SectionCountBadge";

type DocItem = { id: string; filename: string; mimeType?: string };

type ToolDocumentsSectionProps = {
  documents: DocItem[];
  isLoading?: boolean;
};

export function ToolDocumentsSection({ documents, isLoading }: ToolDocumentsSectionProps) {
  return (
    <section>
      <div className="mb-2 flex items-center gap-2 px-1">
        <h2 className="text-[14px] font-semibold text-slate-500">Документы</h2>
        <SectionCountBadge count={documents.length} />
      </div>

      {isLoading ? (
        <LoadingSkeleton rows={2} />
      ) : documents.length === 0 ? (
        <p className="px-1 text-[12px] text-slate-400 md:text-[14px]">Нет документов</p>
      ) : (
        <ul className="overflow-hidden rounded-[12px] border border-slate-200 bg-white">
          {documents.map((doc) => (
            <li key={doc.id} className="border-b border-slate-100 last:border-0">
              <DocumentOpenLink
                documentId={doc.id}
                filename={doc.filename}
                mimeType={doc.mimeType}
                className="flex items-center justify-between gap-3 px-4 py-3.5 text-sm text-slate-900 hover:bg-slate-50"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Paperclip className="h-4 w-4 shrink-0 text-slate-400" />
                  <span className="truncate">{doc.filename}</span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
              </DocumentOpenLink>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
