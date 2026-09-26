import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import type { z } from "zod";
import type { supervisorReportSchema } from "@/lib/api/schemas";
import { supervisorReportStatusMeta } from "@/lib/constants/status";
import { formatDate, formatDateTime, parseDecimal } from "@/lib/format";
import { cn } from "@/lib/utils";
import { WorkerReportDetailSection as SupervisorReportDetailSection } from "../worker-report-detail/WorkerReportDetailSection";

type SupervisorReport = z.infer<typeof supervisorReportSchema>;

type SupervisorReportGeneralSectionProps = {
  report: SupervisorReport;
};

const detailStatusChip: Record<string, string> = {
  review: "bg-[#EEF4FF] text-[#2E6BDE]",
  approved: "bg-emerald-50 text-emerald-700",
  attention: "bg-[#FEEBEB] text-[#D92B2B]",
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
      <span className="text-[12px] md:text-[14px] text-[#8E959F]">{label}</span>
      <div className="text-[14px] md:text-[16px] font-medium leading-snug text-[#111820]">{value}</div>
    </div>
  );
}

function StatusBadge({ children, className }: { children: ReactNode; className: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 whitespace-nowrap rounded-full px-2 h-[19px] text-[10px] md:text-[12px] font-medium items-center",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function SupervisorReportGeneralSection({ report }: SupervisorReportGeneralSectionProps) {
  const meta = supervisorReportStatusMeta[report.status] ?? supervisorReportStatusMeta.review;
  const statusChip = detailStatusChip[report.status] ?? detailStatusChip.review;
  const downtimeHours = parseDecimal(report.downtimeHours);

  return (
    <SupervisorReportDetailSection title="Общая информация">
      <div className="divide-y divide-[#EDF2F7]">
        <Link
          to="/workers/$workerId"
          params={{ workerId: report.supervisorId }}
          className="flex items-center justify-between gap-3 p-3"
        >
          <TextGroup label="Супервайзер" value={report.supervisorName ?? "—"} />
          <ChevronRight className="h-5 w-5 shrink-0 text-[#CED4DA]" aria-hidden="true" />
        </Link>

        <div className="flex justify-between gap-3 p-3">
          <TextGroup label="Дата отчёта" value={formatDate(report.reportDate)} />
          <StatusBadge className={statusChip}>{meta.label}</StatusBadge>
        </div>

        <div className="flex justify-between gap-3 p-3">
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
    </SupervisorReportDetailSection>
  );
}
