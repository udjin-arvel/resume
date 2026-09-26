import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  Building2,
  Calendar,
  Camera,
  Check,
  ChevronRight,
  Paperclip,
} from "lucide-react";
import type { z } from "zod";
import { DocumentOpenLink } from "@/components/common/DocumentAccess";
import type { supervisorReportSchema } from "@/lib/api/schemas";
import {
  useApproveSupervisorReport,
  useAttentionSupervisorReport,
} from "@/lib/api/hooks/useReports";
import { supervisorReportStatusMeta } from "@/lib/constants/status";
import { formatDate, parseDecimal } from "@/lib/format";
import {
  formatSupervisorReportDateLabel,
  supervisorReportReason,
} from "@/lib/supervisor-report-documents";
import { showError, showSuccess } from "@/lib/toast";

type SupervisorReport = z.infer<typeof supervisorReportSchema>;

type ManagerSupervisorReportCardProps = {
  report: SupervisorReport;
};

export function ManagerSupervisorReportCard({ report }: ManagerSupervisorReportCardProps) {
  const meta = supervisorReportStatusMeta[report.status] ?? supervisorReportStatusMeta.review;
  const chip = meta.chip ?? meta.cls;
  const downtimeHours = parseDecimal(report.downtimeHours);
  const reason = supervisorReportReason(report);
  const approve = useApproveSupervisorReport();
  const attention = useAttentionSupervisorReport();

  const handleApprove = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await approve.mutateAsync(report.id);
      showSuccess("Отчёт принят");
    } catch (err) {
      showError(err);
    }
  };

  const handleAttention = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await attention.mutateAsync(report.id);
      showSuccess("Отмечено как требующее внимания");
    } catch (err) {
      showError(err);
    }
  };

  return (
    <Link
      to="/daily-reports/$dailyId"
      params={{ dailyId: report.id }}
      className="card-hover block overflow-hidden rounded-[12px] border border-slate-200 bg-white"
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-3 pb-2">
        <h3 className="truncate text-base font-semibold text-slate-900">
          {report.supervisorName ?? "—"}
        </h3>
        <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
      </div>

      <div className="space-y-3 border-t border-slate-100 p-3 pb-2">
        <div className="flex items-center justify-between gap-3 mb-1">
          <div className="flex min-w-0 gap-1 text-[12px] text-slate-500">
            <Calendar className="h-3 w-3 mt-[2px] shrink-0 text-slate-400" />
            <span className="truncate">{formatSupervisorReportDateLabel(report.reportDate)}</span>
          </div>
          <span className={`inline-flex shrink-0 rounded-full px-2 h-[19px] text-[10px] md:text-[12px] font-medium items-center ${chip}`}>
            {meta.label}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 gap-1 text-[12px] text-slate-500">
            <Building2 className="h-3 w-3 mt-[2px] shrink-0 text-slate-400" />
            <span className="truncate">{report.projectName ?? "—"}</span>
          </div>
          {downtimeHours > 0 ? (
            <span className="inline-flex shrink-0 rounded-full bg-red-50 px-2 h-[19px] text-[10px] md:text-[12px] font-medium text-red-600">
              Простой · {downtimeHours}ч
            </span>
          ) : null}
        </div>

        {reason ? (
          <div>
            <p className="text-[11px] text-slate-400">Причина</p>
            <p className="mt-0.5 line-clamp-2 text-[14px] md:text-[16px] text-slate-800">{reason}</p>
          </div>
        ) : null}

        {report.attachmentsPreview && report.attachmentsPreview.length > 0 ? (
          <div
            className="flex flex-wrap gap-2"
            onClick={(e) => e.stopPropagation()}
            role="presentation"
          >
            {report.attachmentsPreview.map((att) => (
              <DocumentOpenLink
                key={att.id}
                documentId={att.id}
                filename={att.filename}
                className="inline-flex max-w-full items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 h-[20px] text-[10px] md:text-[12px] text-slate-600 hover:bg-slate-100"
              >
                {att.documentType === "photo" ? (
                  <Camera className="h-3 w-3 shrink-0" />
                ) : (
                  <Paperclip className="h-3 w-3 shrink-0" />
                )}
                <span className="truncate">{att.filename}</span>
              </DocumentOpenLink>
            ))}
          </div>
        ) : null}
      </div>

      <div
        className="bg-[#F8FAFC66] flex flex-wrap items-end justify-between gap-3 border-t border-slate-100 p-3 pt-2"
        onClick={(e) => e.preventDefault()}
      >
        <div className="text-[10px] text-slate-500">
          <p>Отправлен</p>
          <p>
            {report.submittedAt ? formatDate(report.submittedAt) : formatDate(report.reportDate)}
          </p>
        </div>

        {report.status === "review" ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={attention.isPending}
              onClick={handleAttention}
              className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-white px-3 py-1 text-[12px] md:text-[14px] font-semibold text-amber-700 hover:bg-amber-50 disabled:opacity-50"
            >
              <AlertTriangle className="h-3 w-3 shrink-0" />
              Требует внимания
            </button>
            <button
              type="button"
              disabled={approve.isPending}
              onClick={handleApprove}
              className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1 text-[12px] md:text-[14px] font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              <Check className="h-3 w-3" />
              Принять
            </button>
          </div>
        ) : null}
      </div>
    </Link>
  );
}
