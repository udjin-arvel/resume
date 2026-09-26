import type { UseFormRegister } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { REPORT_DAY_FIELDS, reportHoursInputClass, type ReportDayFieldKey } from "@/lib/worker-reports";
import { ReportFormSection } from "./ReportFormSection";

type ReportHoursSectionProps = {
  register: UseFormRegister<Record<string, unknown>>;
  values: Record<ReportDayFieldKey, string>;
  totalHours: number;
};

export function ReportHoursSection({ register, values, totalHours }: ReportHoursSectionProps) {
  const { t } = useTranslation();

  return (
    <ReportFormSection title={t("worker.reports.section.hours")}>
      <div className="grid grid-cols-7 gap-2">
        {REPORT_DAY_FIELDS.map((d) => {
          const val = values[d.key];
          const isZero = !val || val === "0";
          return (
            <div key={d.key} className="space-y-1 text-center">
              <span className="text-[10px] font-medium text-gray-500">{t(d.labelKey)}</span>
              <input
                type="number"
                min={0}
                step={0.5}
                className={`${reportHoursInputClass} ${
                  isZero ? "text-gray-300" : "border-blue-500 text-gray-900"
                }`}
                {...register(d.key)}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm text-gray-600">{t("worker.reports.total")}</span>
        <span className="text-base font-semibold text-gray-900">{totalHours} ч</span>
      </div>
    </ReportFormSection>
  );
}
