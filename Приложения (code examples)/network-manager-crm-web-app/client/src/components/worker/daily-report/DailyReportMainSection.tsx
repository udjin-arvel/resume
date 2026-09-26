import { useTranslation } from "react-i18next";
import type { UseFormRegister, FieldErrors } from "react-hook-form";
import { NativeSelect } from "@/components/ui/native-select";
import { DailyReportFormSection } from "./DailyReportFormSection";
import type { DailyReportFormValues } from "./types";

type ProjectOption = { id: string; name: string };

type DailyReportMainSectionProps = {
  projects: ProjectOption[];
  register: UseFormRegister<DailyReportFormValues>;
  errors: FieldErrors<DailyReportFormValues>;
  isEdit?: boolean;
};

export function DailyReportMainSection({
  projects,
  register,
  errors,
  isEdit,
}: DailyReportMainSectionProps) {
  const { t } = useTranslation();

  return (
    <DailyReportFormSection title={t("worker.dailyReport.section.main")}>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-[12px] font-medium text-slate-500">
            {t("worker.reports.field.project")}
          </label>
          <NativeSelect
            error={!!errors.projectId}
            disabled={isEdit}
            {...register("projectId")}
          >
            <option value="">{t("worker.reports.field.projectPlaceholder")}</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </NativeSelect>
          {errors.projectId ? (
            <p className="text-xs text-red-500">{errors.projectId.message}</p>
          ) : null}
        </div>

        <div className="mb-0">
          <label className="text-[12px] font-medium text-slate-500">
            {t("worker.dailyReport.field.completedWorks")}
          </label>
          <textarea
            rows={4}
            placeholder={t("worker.dailyReport.field.completedWorksPlaceholder")}
            className={`w-full rounded-[12px] border px-3 py-2.5 text-[14px] hover:border-gray-300 focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-100 ${
              errors.completedWorks ? "border-red-500" : "border-gray-200"
            }`}
            {...register("completedWorks")}
          />
          {errors.completedWorks ? (
            <p className="text-xs text-red-500">{errors.completedWorks.message}</p>
          ) : null}
        </div>

        {isEdit ? (
          <input type="hidden" {...register("reportDate")} />
        ) : (
          <input type="hidden" {...register("reportDate")} />
        )}
      </div>
    </DailyReportFormSection>
  );
}
