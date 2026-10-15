import { AlertTriangle, ImageIcon } from "lucide-react";
import { DocumentOpenLink } from "@/components/common/DocumentAccess";
import { WorkerReportDetailSection as SupervisorReportDetailSection } from "../worker-report-detail/WorkerReportDetailSection";

type Attachment = { id: string; filename?: string | null; mimeType?: string | null };

type SupervisorReportIssueSectionProps = {
  category?: string;
  description?: string;
  attachments: Attachment[];
};

export function SupervisorReportIssueSection({
  category,
  description,
  attachments,
}: SupervisorReportIssueSectionProps) {
  if (!category?.trim() && !description?.trim() && attachments.length === 0) return null;

  return (
    <SupervisorReportDetailSection title="Проблема на объекте">
      {category?.trim() ? (
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-3">
          <span className="inline-flex items-center gap-1.5 text-[14px] text-[#314158]">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Категория
          </span>
          <span className="text-sm font-medium text-slate-900">{category}</span>
        </div>
      ) : null}

      {description?.trim() ? (
        <div className="mx-4 my-3 rounded-xl bg-amber-50 px-3 py-2.5 text-sm leading-relaxed text-amber-900">
          {description}
        </div>
      ) : null}

      {attachments.length > 0 ? (
        <div className="flex gap-2 px-4 pb-4">
          {attachments.map((doc) => (
            <DocumentOpenLink
              key={doc.id}
              documentId={doc.id}
              filename={doc.filename ?? undefined}
              mimeType={doc.mimeType ?? undefined}
              className="flex h-16 w-16 items-center justify-center rounded-lg bg-slate-100"
            >
              <ImageIcon className="h-5 w-5 text-slate-400" />
            </DocumentOpenLink>
          ))}
        </div>
      ) : null}
    </SupervisorReportDetailSection>
  );
}
