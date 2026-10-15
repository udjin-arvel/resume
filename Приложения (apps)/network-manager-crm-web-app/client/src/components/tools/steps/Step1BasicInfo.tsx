import type { UseFormRegister, FieldErrors } from "react-hook-form";
import { ClipboardList } from "lucide-react";
import type { CreateToolForm } from "../schema/createToolFormSchema";
import { StepTitle, ToolFormField } from "../ToolFormField";
import { PhotoUploadZone } from "../PhotoUploadZone";
import { DocumentUploadButton } from "@/components/common/DocumentUploadButton";
import { NativeSelect } from "@/components/ui/native-select";
import { categories, inputClassName } from "../constants";

type Step1BasicInfoProps = {
  register: UseFormRegister<CreateToolForm>;
  errors: FieldErrors<CreateToolForm>;
  photoFiles: File[];
  onPhotoFilesChange: (files: File[]) => void;
  documentFiles: File[];
  onDocumentFilesChange: (files: File[]) => void;
};

export function Step1BasicInfo({
  register,
  errors,
  photoFiles,
  onPhotoFilesChange,
  documentFiles,
  onDocumentFilesChange,
}: Step1BasicInfoProps) {
  return (
    <>
      <StepTitle icon={ClipboardList} title="Основная информация" />

      <ToolFormField label="Название" required error={errors.name}>
        <input
          {...register("name")}
          placeholder="OTDR EXFO MaxTester"
          className={inputClassName}
        />
      </ToolFormField>

      <div className="grid grid-cols-2 gap-3">
        <ToolFormField label="Категория">
          <NativeSelect {...register("toolType")}>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </NativeSelect>
        </ToolFormField>
        <ToolFormField label="Модель" required error={errors.model}>
          <input {...register("model")} placeholder="MAX-730C" className={inputClassName} />
        </ToolFormField>
      </div>

      <ToolFormField label="Серийный номер" required error={errors.serialNumber}>
        <input
          {...register("serialNumber")}
          placeholder="92831-AX"
          className={inputClassName}
        />
      </ToolFormField>

      <ToolFormField label="Описание">
        <textarea
          {...register("comment")}
          rows={3}
          placeholder="Назначение, особенности эксплуатации"
          className={`${inputClassName} resize-none`}
        />
      </ToolFormField>

      <div className="grid grid-cols-2 gap-3">
        <ToolFormField label="Стоимость, €">
          <input
            {...register("cost")}
            inputMode="decimal"
            placeholder="12400"
            className={inputClassName}
          />
        </ToolFormField>
        <ToolFormField label="Дата покупки">
          <input type="date" {...register("purchaseDate")} className={inputClassName} />
        </ToolFormField>
      </div>

      <ToolFormField label="Фото и документы">
        <div className="space-y-2">
          <PhotoUploadZone files={photoFiles} onChange={onPhotoFilesChange} />
          <DocumentUploadButton files={documentFiles} onChange={onDocumentFilesChange} />
        </div>
      </ToolFormField>
    </>
  );
}
