import { Link } from "@tanstack/react-router";
import { Building2, Calendar, ChevronRight, Clock, Wallet } from "lucide-react";
import type { z } from "zod";
import type { workerReportSchema } from "@/lib/api/schemas";
import { workerReportStatusMeta } from "@/lib/constants/status";
import { formatHours, formatRub, parseDecimal } from "@/lib/format";
import { formatReportWeekLabel } from "@/lib/worker-reports";

type WorkerReport = z.infer<typeof workerReportSchema>;

type ReportCardProps = {
  report: WorkerReport;
};

function reportExpensesTotal(report: WorkerReport) {
  if (report.expensesTotal !== undefined && report.expensesTotal !== "") {
    return parseDecimal(report.expensesTotal);
  }
  return (report.expenses ?? []).reduce((s, e) => s + parseDecimal(e.amount), 0);
}

export function ReportCard({ report }: ReportCardProps) {
  const meta = workerReportStatusMeta[report.status] ?? workerReportStatusMeta.review;
  const chip = meta.chip ?? meta.cls;

  return (
    <Link
      to="/reports/$reportId"
      params={{ reportId: report.id }}
      className="card-hover block overflow-hidden rounded-[12px] border border-slate-200 bg-white"
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-3 pb-2">
        <h3 className="truncate text-[14px] md:text-[16px] font-semibold text-slate-900">
          {report.workerName ?? "—"}
        </h3>
        <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
      </div>

      <div className="space-y-1 border-t border-slate-100 p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-1.5 text-[12px] md:text-[14px] text-slate-500">
            <Calendar className="h-3 w-3 shrink-0 text-slate-400" />
            <span className="truncate">{formatReportWeekLabel(report.weekStart)}</span>
          </div>
          <span
            className={`inline-flex shrink-0 rounded-full px-2 h-[19px] text-[10px] md:text-[12px] font-medium items-center ${chip}`}
          >
            {meta.label}
          </span>
        </div>

        <div className="flex min-w-0 items-center gap-1.5 text-[12px] md:text-[14px] text-slate-500">
          <Building2 className="h-3 w-3 shrink-0 text-slate-400" />
          <span className="truncate">{report.projectName ?? "—"}</span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5 text-[12px] md:text-[14px] text-slate-500">
            <Clock className="h-3 w-3 shrink-0 text-slate-400" />
            Часы
          </span>
          <span className="shrink-0 text-[14px] md:text-[16px] font-semibold text-[#45556C]">
            {formatHours(report.totalHours)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5 text-[12px] md:text-[14px] text-slate-500">
            <Wallet className="h-3 w-3 shrink-0 text-slate-400" />
            Доп. расходы
          </span>
          <span className="shrink-0 text-[14px] md:text-[16px] font-semibold text-[#45556C]">
            {formatRub(reportExpensesTotal(report))}
          </span>
        </div>
      </div>
    </Link>
  );
}
