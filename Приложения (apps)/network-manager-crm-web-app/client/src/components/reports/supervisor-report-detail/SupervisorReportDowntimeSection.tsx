import { ChevronRight, Clock, Paperclip } from "lucide-react";
import { DocumentOpenLink } from "@/components/common/DocumentAccess";
import { parseDecimal } from "@/lib/format";
import { WorkerReportDetailSection as SupervisorReportDetailSection } from "../worker-report-detail/WorkerReportDetailSection";

type Attachment = { id: string; filename?: string | null; mimeType?: string | null };

type SupervisorReportDowntimeSectionProps = {
  downtimeHours?: string;
  downtimeReason?: string;
  attachments: Attachment[];
};

export function SupervisorReportDowntimeSection({
  downtimeHours,
  downtimeReason,
  attachments,
}: SupervisorReportDowntimeSectionProps) {
  const hours = parseDecimal(downtimeHours);
  if (hours <= 0 && !downtimeReason?.trim() && attachments.length === 0) return null;

  return (
    <SupervisorReportDetailSection title="Простой">
      {hours > 0 ? (
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <span className="inline-flex items-center gap-1.5 text-[14px] text-[#314158]">
            <Clock className="h-4 w-4 text-red-500" />
            Часы простоя
          </span>
          <span className="text-sm font-semibold text-slate-900">{hours} ч</span>
        </div>
      ) : null}

      {downtimeReason?.trim() ? (
        <div className="m-3 rounded-[12px] bg-red-50 p-3 text-sm leading-relaxed text-red-900">
          {downtimeReason}
        </div>
      ) : null}

      {attachments.length > 0 ? (
        <ul>
          {attachments.map((doc) => (
            <li key={doc.id}>
              <DocumentOpenLink
                documentId={doc.id}
                filename={doc.filename ?? undefined}
                mimeType={doc.mimeType ?? undefined}
                className="flex items-center gap-3 p-3 text-[14px] text-[#314158] border-t border-slate-100 hover:bg-slate-50"
              >
                <Paperclip className="h-3 w-3 shrink-0 text-slate-400" />
                <span className="min-w-0 flex-1 truncate">{doc.filename ?? doc.id}</span>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
              </DocumentOpenLink>
            </li>
          ))}
        </ul>
      ) : null}
    </SupervisorReportDetailSection>
  );
}
