import { Link } from "@tanstack/react-router";
import { BellRing, Check, ChevronRight, RotateCcw, Undo2 } from "lucide-react";
import type { z } from "zod";
import type { workerReportSchema } from "@/lib/api/schemas";
import { workerReportStatusMeta } from "@/lib/constants/status";
import { formatDate, formatRub, parseDecimal } from "@/lib/format";
import { formatWeekShortLabel } from "@/lib/worker-reports";

type WorkerReport = z.infer<typeof workerReportSchema>;

type WorkerReportMiniCardProps = {
  report: WorkerReport;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onRevertReturn: (id: string) => void;
  onRemind: (id: string) => void;
  approvePending?: boolean;
  rejectPending?: boolean;
  revertPending?: boolean;
  remindPending?: boolean;
  readOnly?: boolean;
};

function reportExpensesTotal(report: WorkerReport) {
  if (report.expensesTotal !== undefined && report.expensesTotal !== "") {
    return parseDecimal(report.expensesTotal);
  }
  return (report.expenses ?? []).reduce((s, e) => s + parseDecimal(e.amount), 0);
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case "review":
      return "bg-blue-50 text-blue-700";
    case "returned":
      return "bg-orange-50 text-orange-700";
    case "approved":
      return "bg-emerald-50 text-emerald-700";
    case "overdue":
      return "bg-red-50 text-red-600";
    default:
      return workerReportStatusMeta[status]?.chip ?? workerReportStatusMeta.review.chip ?? "";
  }
}

function footerMeta(report: WorkerReport): { label: string; date: string } | null {
  switch (report.status) {
    case "review":
      return {
        label: "Отправлен",
        date: formatDate(report.submittedAt),
      };
    case "returned":
      return {
        label: "Возвращён",
        date: formatDate(report.submittedAt),
      };
    case "overdue":
      return {
        label: "Просрочен с",
        date: formatDate(report.weekEnd),
      };
    default:
      return null;
  }
}

export function WorkerReportMiniCard({
  report,
  onApprove,
  onReject,
  onRevertReturn,
  onRemind,
  approvePending,
  rejectPending,
  revertPending,
  remindPending,
  readOnly = false,
}: WorkerReportMiniCardProps) {
  const meta = workerReportStatusMeta[report.status] ?? workerReportStatusMeta.review;
  const hours = parseDecimal(report.totalHours);
  const hoursLabel = `${Number.isInteger(hours) ? hours : hours.toFixed(1)} ч`;
  const expensesLabel = formatRub(reportExpensesTotal(report));
  const footer = footerMeta(report);

  return (
    <li className="overflow-hidden rounded-[12px] border border-[#F0F0F0] bg-white">
      <Link
        to="/reports/$reportId"
        params={{ reportId: report.id }}
        className="block"
      >
        <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 p-3">
          <div className="min-w-0">
            <p className="truncate text-[14px] md:text-[16px] font-medium text-[#0F172B]">
              {formatWeekShortLabel(report.weekStart)}
            </p>
            <p className="truncate text-[12px] md:text-[14px] text-slate-500">
              {hoursLabel} · доп. расходы {expensesLabel}
            </p>
          </div>
          <span
            className={`inline-flex shrink-0 h-[19px] items-center rounded-full px-2 text-[10px] md:text-[12px] font-medium ${statusBadgeClass(report.status)}`}
          >
            {meta.label}
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
        </div>
      </Link>

      {footer ? (
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t border-slate-100 p-3 bg-[#F8FAFC66]">
          <span className="truncate text-[10px] md:text-[12px] text-slate-500">
            {footer.label} {footer.date}
          </span>

          {(report.status === "review" || report.status === "overdue") && !readOnly ? (
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
              {report.status === "overdue" ? (
                <button
                  type="button"
                  disabled={remindPending}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onRemind(report.id);
                  }}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  <BellRing className="h-3 w-3" />
                  Напомнить
                </button>
              ) : null}
              <button
                type="button"
                disabled={rejectPending}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onReject(report.id);
                }}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                <RotateCcw className="h-3 w-3" />
                Вернуть
              </button>
              <button
                type="button"
                disabled={approvePending}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onApprove(report.id);
                }}
                className="inline-flex items-center gap-1 rounded-full bg-[#111827] px-3 py-1 text-[11px] font-medium text-white transition hover:bg-gray-800 disabled:opacity-50"
              >
                <Check className="h-3 w-3" />
                Принять
              </button>
            </div>
          ) : null}

          {report.status === "returned" && !readOnly ? (
            <button
              type="button"
              disabled={revertPending}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onRevertReturn(report.id);
              }}
              className="inline-flex shrink-0 items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              <Undo2 className="h-3 w-3" />
              Отменить
            </button>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}
