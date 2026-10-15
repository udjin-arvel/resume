import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import type { z } from "zod";
import type { workerReportSchema } from "@/lib/api/schemas";
import { workerReportStatusMeta } from "@/lib/constants/status";
import { formatDate, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { WorkerReportDetailSection } from "./WorkerReportDetailSection";

type WorkerReport = z.infer<typeof workerReportSchema>;

type WorkerReportGeneralSectionProps = {
  report: WorkerReport;
  downtimeHours: number;
};

const detailStatusChip: Record<string, string> = {
  review: "bg-[#EEF4FF] text-[#2E6BDE]",
  approved: "bg-emerald-50 text-emerald-700",
  returned: "bg-orange-50 text-orange-700",
  overdue: "bg-red-50 text-red-600",
  draft: "bg-slate-100 text-slate-600",
};

function TextGroup({
  label,
  value,
  className,
}: {
  label: string;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-0.5", className)}>
      <span className="text-[12px] text-slate-400 md:text-[14px]">{label}</span>
      <div className="text-[14px] font-medium leading-snug text-[#111820] md:text-[16px]">{value}</div>
    </div>
  );
}

function StatusBadge({ children, className }: { children: ReactNode; className: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-[19px] shrink-0 items-center whitespace-nowrap rounded-full px-2 text-[10px] font-medium md:text-[12px]",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function WorkerReportGeneralSection({
  report,
  downtimeHours,
}: WorkerReportGeneralSectionProps) {
  const meta = workerReportStatusMeta[report.status] ?? workerReportStatusMeta.review;
  const statusChip = detailStatusChip[report.status] ?? detailStatusChip.review;

  return (
    <WorkerReportDetailSection title="Общая информация">
      <div className="divide-y divide-slate-100">
        <Link
          to="/workers/$workerId"
          params={{ workerId: report.workerId }}
          className="flex items-center justify-between gap-3 p-3 hover:bg-slate-100"
        >
          <TextGroup label="Работник" value={report.workerName ?? "—"} />
          <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" aria-hidden="true" />
        </Link>

        <div className="flex items-center justify-between gap-3 p-3">
          <TextGroup label="Дата отчёта" value={formatDate(report.weekStart)} />
          <StatusBadge className={statusChip}>{meta.label}</StatusBadge>
        </div>

        <div className="flex items-center justify-between gap-3 p-3">
          <TextGroup
            label="Проект"
            value={<span className="break-words">{report.projectName ?? "—"}</span>}
            className="pr-2"
          />
          {downtimeHours > 0 ? (
            <StatusBadge className="bg-[#FEEBEB] text-[#D92B2B]">
              Простой · {downtimeHours}ч
            </StatusBadge>
          ) : null}
        </div>

        {report.submittedAt ? (
          <div className="p-3">
            <TextGroup label="Отправлен" value={formatDateTime(report.submittedAt)} />
          </div>
        ) : null}
      </div>
    </WorkerReportDetailSection>
  );
}
