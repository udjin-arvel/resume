import { Link } from "@tanstack/react-router";
import type { z } from "zod";
import { Calendar, ChevronRight, Clock, Wallet } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { workerReportSchema } from "@/lib/api/schemas";
import { formatMoney, parseDecimal } from "@/lib/format";
import { getWeekLabel } from "@/lib/worker-reports";
import { ReportStatusBadge } from "./ReportStatusBadge";

type WorkerReport = z.infer<typeof workerReportSchema>;

type WorkerReportCardProps = {
  report: WorkerReport;
};

export function WorkerReportCard({ report }: WorkerReportCardProps) {
  const { t } = useTranslation();
  const hours = parseDecimal(report.totalHours);
  const expenseAmount = report.totalAmount ?? report.expensesTotal ?? "0";
  const weekLabel = getWeekLabel(report.weekStart, t);

  return (
    <Link
      to="/worker/reports/$reportId"
      params={{ reportId: report.id }}
      className="card-hover block rounded-[12px] border border-[#E0E4EC] bg-white p-3"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 truncate text-[16px] font-bold text-[#1A1C29]">{report.projectName}</p>
        <ChevronRight className="h-4 w-4 shrink-0 text-[#8E97AF]" aria-hidden="true" />
      </div>

      <div className="mt-3 space-y-2 text-[12px] text-[#8E97AF]">
        <div className="flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{weekLabel}</span>
          </span>
          <ReportStatusBadge status={report.status} />
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            {t("worker.reports.hours")}
          </span>
          <span className="font-semibold text-[#1A1C29]">{hours} ч</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5">
            <Wallet className="h-3.5 w-3.5 shrink-0" />
            {t("worker.reports.expenses")}
          </span>
          <span className="font-semibold text-[#1A1C29]">{formatMoney(expenseAmount)}</span>
        </div>
      </div>

      {report.status === "returned" && report.managerComment ? (
        <div className="mt-3 border-t border-[#E0E4EC] pt-3">
          <p className="text-[12px] text-[#8E97AF]">{t("worker.reports.managerComment")}</p>
          <p className="mt-1 text-[12px] font-medium text-[#B91C1C]">{report.managerComment}</p>
        </div>
      ) : null}
    </Link>
  );
}
