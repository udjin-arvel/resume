import { useRef } from "react";
import { Trash2, Upload, type LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { FORM_RADIUS } from "@/lib/form-styles";

type OnboardingDocumentRowProps = {
  title: string;
  icon: LucideIcon;
  file?: File | null;
  required?: boolean;
  error?: string;
  onFileChange: (file: File | null) => void;
  onUploadClick?: () => void;
};

export function OnboardingDocumentRow({
  title,
  icon: Icon,
  file,
  required = false,
  error,
  onFileChange,
  onUploadClick,
}: OnboardingDocumentRowProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const uploaded = Boolean(file);

  const handleChange = (files: FileList | null) => {
    const next = files?.[0] ?? null;
    onFileChange(next);
  };

  const openFilePicker = () => {
    inputRef.current?.click();
  };

  return (
    <div className="space-y-1">
      <div
        className={`flex items-center gap-3 rounded-[12px] border p-3 dark:border-slate-800 ${
          error ? "border-red-500" : "border-slate-100"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,application/pdf"
          className="hidden"
          onChange={(e) => {
            handleChange(e.target.files);
            e.target.value = "";
          }}
        />

        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
            {title}
            {required ? <span className="text-red-500"> *</span> : null}
          </p>
          {uploaded && file ? (
            <p className="truncate text-xs text-slate-500">{file.name}</p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {uploaded ? (
            <>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                {t("onboarding.uploaded")}
              </span>
              <button
                type="button"
                onClick={() => onFileChange(null)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                aria-label={t("onboarding.upload")}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={`${FORM_RADIUS} h-9 gap-1.5 border-slate-200 bg-slate-50 px-3 text-slate-700 hover:bg-slate-100`}
              onClick={() => (onUploadClick ? onUploadClick() : openFilePicker())}
            >
              <Upload className="h-3.5 w-3.5" />
              {t("onboarding.upload")}
            </Button>
          )}
        </div>
      </div>
      {error ? <p className="text-xs text-red-500">{error}</p> : null}
    </div>
  );
}
