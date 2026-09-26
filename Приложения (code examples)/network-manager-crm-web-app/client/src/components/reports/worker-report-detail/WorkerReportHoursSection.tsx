import { Clock } from "lucide-react";
import type { z } from "zod";
import type { workerReportSchema } from "@/lib/api/schemas";
import { parseDecimal } from "@/lib/format";
import { dayDefs } from "./constants";
import { WorkerReportDetailSection } from "./WorkerReportDetailSection";

type WorkerReport = z.infer<typeof workerReportSchema>;

type WorkerReportHoursSectionProps = {
  report: WorkerReport;
};

export function WorkerReportHoursSection({ report }: WorkerReportHoursSectionProps) {
  const days = dayDefs.map((d) => ({
    ...d,
    hours: parseDecimal(report[d.field]),
  }));
  const totalHours =
    parseDecimal(report.totalHours) || days.reduce((a, d) => a + d.hours, 0);

  return (
    <WorkerReportDetailSection title="Отработанные часы">
      <ul className="divide-y divide-slate-100 p-3">
        {days.map((d) => (
          <li
            key={d.key}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-2 border-b border-slate-100 last:border-b-0"
          >
            <span className="text-[14px] text-slate-700">{d.label}</span>
            <span
              className={`text-[14px] font-semibold tabular-nums ${
                d.hours === 0 ? "text-slate-300" : "text-slate-900"
              }`}
            >
              {d.hours}ч
            </span>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
        <span className="flex items-center gap-2 text-[14px] text-slate-500">
          <Clock className="h-4 w-4 text-slate-400" />
          Всего
        </span>
        <span className="text-base font-semibold text-slate-900 tabular-nums">{totalHours}ч</span>
      </div>
    </WorkerReportDetailSection>
  );
}
