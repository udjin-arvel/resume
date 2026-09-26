import { ChevronRight, Paperclip } from "lucide-react";
import { DocumentOpenLink } from "@/components/common/DocumentAccess";

type ReportDocument = {
  id: string;
  filename?: string | null;
  mimeType?: string | null;
};

type WorkerReportFilesSectionProps = {
  documents: ReportDocument[];
};

export function WorkerReportFilesSection({ documents }: WorkerReportFilesSectionProps) {
  if (documents.length === 0) return null;

  return (
    <section>
      <div className="mb-2 flex items-center gap-2">
        <h2 className="text-sm font-semibold text-slate-900">Файлы</h2>
        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-100 px-1.5 text-xs font-medium text-slate-600">
          {documents.length}
        </span>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <ul className="divide-y divide-slate-100">
          {documents.map((doc) => (
            <li key={doc.id}>
              <DocumentOpenLink
                documentId={doc.id}
                filename={doc.filename ?? undefined}
                mimeType={doc.mimeType ?? undefined}
                className="flex items-center gap-3 p-3 text-[14px] text-slate-700 hover:bg-slate-50"
              >
                <Paperclip className="h-4 w-4 shrink-0" />
                <span className="min-w-0 flex-1 truncate">{doc.filename ?? doc.id}</span>
                <ChevronRight className="h-4 w-4 shrink-0 text-[#314158]" />
              </DocumentOpenLink>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
