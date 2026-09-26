import type { UseFormRegister, FieldErrors } from "react-hook-form";
import { Calendar } from "lucide-react";
import type { CreateToolForm } from "../schema/createToolFormSchema";
import { ToolFormField } from "../ToolFormField";
import { DocumentUploadButton } from "@/components/common/DocumentUploadButton";
import { inputClassName } from "../constants";

type CalibrationBlockProps = {
  title?: string;
  register: UseFormRegister<CreateToolForm>;
  errors: FieldErrors<CreateToolForm>;
  calibrationDocs: File[];
  onCalibrationDocsChange: (files: File[]) => void;
};

export function CalibrationBlock({
  title = "Калибровка",
  register,
  errors,
  calibrationDocs,
  onCalibrationDocsChange,
}: CalibrationBlockProps) {
  return (
    <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-slate-500" />
        <p className="text-sm font-semibold text-slate-900">{title}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <ToolFormField label="Последняя калибровка" required error={errors.lastCalibratedAt}>
          <input
            type="date"
            {...register("lastCalibratedAt")}
            className={inputClassName}
          />
        </ToolFormField>
        <ToolFormField label="Годен до" required error={errors.validUntil}>
          <input type="date" {...register("validUntil")} className={inputClassName} />
        </ToolFormField>
      </div>

      <ToolFormField label="Периодичность, мес.">
        <input
          type="number"
          inputMode="numeric"
          {...register("calibrationPeriodMonths")}
          className={inputClassName}
        />
      </ToolFormField>

      <ToolFormField label="Документ о калибровке">
        <DocumentUploadButton
          files={calibrationDocs}
          onChange={onCalibrationDocsChange}
          variant="add"
        />
      </ToolFormField>

      <ToolFormField label="Комментарий">
        <textarea
          {...register("calibrationNotes")}
          rows={3}
          placeholder="Оставьте заметку об инструменте"
          className={`${inputClassName} resize-none`}
        />
      </ToolFormField>
    </section>
  );
}
