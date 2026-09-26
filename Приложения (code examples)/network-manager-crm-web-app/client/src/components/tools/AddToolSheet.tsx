import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, X } from "lucide-react";
import { RemoveScroll } from "react-remove-scroll";
import { useCreateTool } from "@/lib/api/hooks/useTools";
import { uploadDocument } from "@/lib/api/documents";
import { showError, showSuccess } from "@/lib/toast";
import type { ControlType } from "./constants";
import { step1Fields, step2Fields } from "./constants";
import {
  buildCreateToolPayload,
  createToolFormSchema,
  defaultCreateToolValues,
  type CreateToolForm,
} from "./schema/createToolFormSchema";
import { Step1BasicInfo } from "./steps/Step1BasicInfo";
import { Step2ControlType } from "./steps/Step2ControlType";
import { Step3ControlParams } from "./steps/Step3ControlParams";

type AddToolSheetProps = {
  onClose: () => void;
};

async function uploadToolFiles(
  toolId: string,
  photos: File[],
  documents: File[],
  calibrationDocs: File[],
) {
  const uploads: Promise<unknown>[] = [];

  for (const file of photos) {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("entityType", "tool");
    fd.append("entityId", toolId);
    fd.append("documentType", "photo");
    uploads.push(uploadDocument(fd));
  }

  for (const file of documents) {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("entityType", "tool");
    fd.append("entityId", toolId);
    fd.append("documentType", "document");
    uploads.push(uploadDocument(fd));
  }

  for (const file of calibrationDocs) {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("entityType", "tool");
    fd.append("entityId", toolId);
    fd.append("documentType", "calibration_certificate");
    uploads.push(uploadDocument(fd));
  }

  if (uploads.length === 0) return;
  await Promise.all(uploads);
}

export function AddToolSheet({ onClose }: AddToolSheetProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
  const [calibrationDocs, setCalibrationDocs] = useState<File[]>([]);
  const createTool = useCreateTool();

  const form = useForm<CreateToolForm>({
    resolver: zodResolver(createToolFormSchema),
    defaultValues: defaultCreateToolValues,
    mode: "onChange",
  });

  const controlType = form.watch("controlType") as ControlType;
  const values = form.watch();
  const { errors } = form.formState;

  const canNextStep1 =
    values.name.trim().length > 0 &&
    values.model.trim().length > 0 &&
    values.serialNumber.trim().length > 0;

  const goNext = async () => {
    if (step === 1) {
      const valid = await form.trigger([...step1Fields]);
      if (!valid) return;
      setStep(2);
      return;
    }
    if (step === 2) {
      const valid = await form.trigger([...step2Fields]);
      if (!valid) return;
      setStep(3);
    }
  };

  const onSave = form.handleSubmit(async (data) => {
    try {
      const tool = await createTool.mutateAsync(buildCreateToolPayload(data));
      try {
        await uploadToolFiles(tool.id, photoFiles, documentFiles, calibrationDocs);
      } catch (uploadErr) {
        showSuccess("Инструмент добавлен (не все файлы загружены)");
        console.error(uploadErr);
      }
      showSuccess("Инструмент добавлен");
      onClose();
    } catch (error) {
      showError(error);
    }
  });

  return (
    <RemoveScroll removeScrollBar={false}>
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 sm:items-center">
        <div className="flex h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:h-[88vh] sm:rounded-2xl">
          <div className="flex items-start justify-between border-b border-slate-200 px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">Новый инструмент</p>
              <p className="text-[11px] text-slate-500">Шаг {step} из 3</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Закрыть"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate-600 hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex gap-1 px-4 pt-3">
            {[1, 2, 3].map((s) => (
              <span
                key={s}
                className={`h-1 flex-1 rounded-full ${s <= step ? "bg-slate-900" : "bg-slate-200"}`}
              />
            ))}
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
            {step === 1 ? (
              <Step1BasicInfo
                register={form.register}
                errors={errors}
                photoFiles={photoFiles}
                onPhotoFilesChange={setPhotoFiles}
                documentFiles={documentFiles}
                onDocumentFilesChange={setDocumentFiles}
              />
            ) : null}

            {step === 2 ? (
              <Step2ControlType
                controlType={controlType}
                onSelect={(id) => form.setValue("controlType", id, { shouldValidate: true })}
              />
            ) : null}

            {step === 3 ? (
              <Step3ControlParams
                controlType={controlType}
                values={values}
                register={form.register}
                errors={errors}
                calibrationDocs={calibrationDocs}
                onCalibrationDocsChange={setCalibrationDocs}
              />
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-2 border-t border-slate-200 bg-white px-4 py-3">
            {step === 1 ? (
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Отмена
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setStep((s) => (s === 3 ? 2 : 1))}
                className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Назад
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                disabled={step === 1 && !canNextStep1}
                onClick={() => void goNext()}
                className="rounded-full bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Далее
              </button>
            ) : (
              <button
                type="button"
                disabled={createTool.isPending}
                onClick={() => void onSave()}
                className="inline-flex items-center justify-center gap-1.5 rounded-full bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Check className="h-4 w-4" />
                {createTool.isPending ? "Сохранение…" : "Сохранить"}
              </button>
            )}
          </div>
        </div>
      </div>
    </RemoveScroll>
  );
}
