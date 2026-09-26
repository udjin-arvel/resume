import { useTranslation } from "react-i18next";
import type { UseFormRegister } from "react-hook-form";
import { ImagePlus } from "lucide-react";
import { ISSUE_CATEGORIES } from "@/lib/constants/issue-categories";
import { NativeSelect } from "@/components/ui/native-select";
import { dailyReportAddPhotoButtonClass } from "./button-styles";
import { DailyReportFormSection } from "./DailyReportFormSection";
import type { DailyReportFormValues } from "./types";

type DailyReportIssueSectionProps = {
  visible: boolean;
  register: UseFormRegister<DailyReportFormValues>;
  issuePhotos: File[];
  onIssuePhotosChange: (files: File[]) => void;
  onAdd: () => void;
  onRemove: () => void;
};

export function DailyReportIssueSection({
  visible,
  register,
  issuePhotos,
  onIssuePhotosChange,
  onAdd,
  onRemove,
}: DailyReportIssueSectionProps) {
  const { t } = useTranslation();

  if (!visible) {
    return (
      <DailyReportFormSection
        title={t("worker.dailyReport.section.issue")}
        isEmpty
        emptyText={t("worker.dailyReport.empty.issue")}
        showAdd
        addVariant="orange"
        onAdd={onAdd}
      />
    );
  }

  const pickPhotos = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = "image/*";
    input.onchange = () => {
      const files = input.files ? Array.from(input.files) : [];
      if (files.length) onIssuePhotosChange([...issuePhotos, ...files]);
    };
    input.click();
  };

  return (
    <DailyReportFormSection
      title={t("worker.dailyReport.section.issue")}
      headerExtra={
        <button type="button" onClick={onRemove} className="text-xs text-red-500 underline">
          {t("worker.dailyReport.removeSection")}
        </button>
      }
    >
      <div className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-[12px] font-medium text-slate-500">
            {t("worker.dailyReport.field.issueCategory")}
          </label>
          <NativeSelect {...register("issueCategory")}>
            <option value="">{t("worker.dailyReport.field.issueCategoryPlaceholder")}</option>
            {ISSUE_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {t(cat.labelKey)}
              </option>
            ))}
          </NativeSelect>
        </div>

        <div className="space-y-1.5">
          <label className="text-[12px] font-medium text-slate-500">
            {t("worker.dailyReport.field.issueDescription")}
          </label>
          <textarea
            rows={3}
            placeholder={t("worker.dailyReport.field.issueDescriptionPlaceholder")}
            className="w-full rounded-[12px] border border-gray-200 px-3 py-2.5 text-[14px] hover:border-gray-300 focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-100"
            {...register("issueDescription")}
          />
        </div>

        {issuePhotos.length > 0 ? (
          <ul className="space-y-1 text-sm text-gray-600">
            {issuePhotos.map((f, i) => (
              <li key={`${f.name}-${i}`} className="truncate">
                {f.name}
              </li>
            ))}
          </ul>
        ) : null}

        <button
          type="button"
          onClick={pickPhotos}
          className={dailyReportAddPhotoButtonClass}
        >
          <ImagePlus className="h-4 w-4" />
          {t("worker.dailyReport.addPhoto")}
        </button>
      </div>
    </DailyReportFormSection>
  );
}
