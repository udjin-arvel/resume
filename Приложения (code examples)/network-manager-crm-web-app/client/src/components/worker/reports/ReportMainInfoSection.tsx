import type { UseFormRegister } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { NativeSelect } from "@/components/ui/native-select";
import { reportInputClass } from "@/lib/worker-reports";
import { ReportFormSection } from "./ReportFormSection";

type ProjectOption = { id: string; name: string };

type ReportMainInfoSectionProps = {
  projects: ProjectOption[];
  register: UseFormRegister<Record<string, unknown>>;
};

export function ReportMainInfoSection({ projects, register }: ReportMainInfoSectionProps) {
  const { t } = useTranslation();

  return (
    <ReportFormSection title={t("worker.reports.section.main")}>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-sm text-gray-600">{t("worker.reports.field.project")}</label>
          <NativeSelect {...register("projectId")}>
            <option value="">{t("worker.reports.field.projectPlaceholder")}</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm text-gray-600">{t("worker.reports.field.description")}</label>
          <textarea
            rows={4}
            placeholder={t("worker.reports.field.descriptionPlaceholder")}
            className={`${reportInputClass} h-24 resize-none`}
            {...register("description")}
          />
        </div>
      </div>
    </ReportFormSection>
  );
}
