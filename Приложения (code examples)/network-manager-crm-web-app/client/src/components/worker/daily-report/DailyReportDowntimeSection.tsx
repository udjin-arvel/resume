import { useTranslation } from "react-i18next";
import type { UseFormRegister } from "react-hook-form";
import { Upload } from "lucide-react";
import {
  dailyReportUploadDocumentButtonClass,
  dailyReportUploadDocumentLabelClass,
} from "./button-styles";
import { DailyReportFormSection } from "./DailyReportFormSection";
import type { DailyReportFormValues } from "./types";

type DailyReportDowntimeSectionProps = {
  visible: boolean;
  register: UseFormRegister<DailyReportFormValues>;
  downtimeFiles: File[];
  onDowntimeFilesChange: (files: File[]) => void;
  onAdd: () => void;
  onRemove: () => void;
};

export function DailyReportDowntimeSection({
  visible,
  register,
  downtimeFiles,
  onDowntimeFilesChange,
  onAdd,
  onRemove,
}: DailyReportDowntimeSectionProps) {
  const { t } = useTranslation();

  if (!visible) {
    return (
      <DailyReportFormSection
        title={t("worker.dailyReport.section.downtime")}
        isEmpty
        emptyText={t("worker.dailyReport.empty.downtime")}
        showAdd
        addVariant="red"
        onAdd={onAdd}
      />
    );
  }

  const pickFiles = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.onchange = () => {
      const files = input.files ? Array.from(input.files) : [];
      if (files.length) onDowntimeFilesChange([...downtimeFiles, ...files]);
    };
    input.click();
  };

  return (
    <DailyReportFormSection
      title={t("worker.dailyReport.section.downtime")}
      headerExtra={
        <button type="button" onClick={onRemove} className="text-xs text-red-500 underline">
          {t("worker.dailyReport.removeSection")}
        </button>
      }
    >
      <div className="space-y-3">
        <div className="space-y-1.5 mb-2">
          <label className="text-[12px] font-medium text-slate-500">
            {t("worker.dailyReport.field.downtimeHours")}
          </label>
          <input
            type="number"
            step="0.5"
            min="0"
            className="w-full rounded-[12px] border border-gray-200 px-3 py-2.5 text-[14px] hover:border-gray-300 focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-100"
            {...register("downtimeHours")}
          />
        </div>

        <div className="space-y-1.5 mb-2">
          <label className="text-[12px] font-medium text-slate-500">
            {t("worker.reports.downtimeReason")}
          </label>
          <textarea
            rows={3}
            placeholder={t("worker.dailyReport.field.downtimeReasonPlaceholder")}
            className="w-full rounded-[12px] border border-gray-200 px-3 py-2.5 text-[14px] hover:border-gray-300 focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-100"
            {...register("downtimeReason")}
          />
        </div>

        {downtimeFiles.length > 0 ? (
          <ul className="space-y-1 text-sm text-gray-600">
            {downtimeFiles.map((f, i) => (
              <li key={`${f.name}-${i}`} className="truncate">
                {f.name}
              </li>
            ))}
          </ul>
        ) : null}

        <button
          type="button"
          onClick={pickFiles}
          className={dailyReportUploadDocumentButtonClass}
        >
          <Upload className="h-5 w-5" />
          <span className={dailyReportUploadDocumentLabelClass}>{t("worker.reports.uploadDocument")}</span>
        </button>
      </div>
    </DailyReportFormSection>
  );
}
