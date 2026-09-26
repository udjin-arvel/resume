import { ChevronRight, Paperclip } from "lucide-react";
import type { ToolDetail } from "@/lib/api/tools";
import { DocumentOpenLink } from "@/components/common/DocumentAccess";
import { formatDate } from "@/lib/format";
import { getValidityLabel } from "@/components/tools/list/toolCardDisplay";

type ToolCalibrationSectionProps = {
  tool: ToolDetail;
  calibrationDoc?: { id: string; filename: string; mimeType?: string } | null;
};

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 py-3 last:border-0">
      <span className="text-xs text-slate-500">{label}</span>
      <div className="min-w-0 text-right text-sm font-medium text-slate-900">{children}</div>
    </div>
  );
}

export function ToolCalibrationSection({ tool, calibrationDoc }: ToolCalibrationSectionProps) {
  const latest = tool.calibrations?.[0];
  const validityLabel = getValidityLabel(tool.controlType);

  return (
    <div className="rounded-[12px] border border-slate-200 bg-white px-4">
      {latest ? (
        <InfoRow label="Последняя калибровка">{formatDate(latest.calibratedAt)}</InfoRow>
      ) : null}
      <InfoRow label={validityLabel}>
        {tool.calibrationDueAt ? formatDate(tool.calibrationDueAt) : "—"}
      </InfoRow>
      {tool.calibrationPeriodMonths ? (
        <InfoRow label="Периодичность">{tool.calibrationPeriodMonths} мес</InfoRow>
      ) : null}
      {calibrationDoc ? (
        <InfoRow label="Документ">
          <DocumentOpenLink
            documentId={calibrationDoc.id}
            filename={calibrationDoc.filename}
            mimeType={calibrationDoc.mimeType}
            className="inline-flex items-center gap-1 text-slate-900 hover:text-slate-700"
          >
            <Paperclip className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span className="truncate">{calibrationDoc.filename}</span>
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
          </DocumentOpenLink>
        </InfoRow>
      ) : null}
    </div>
  );
}
