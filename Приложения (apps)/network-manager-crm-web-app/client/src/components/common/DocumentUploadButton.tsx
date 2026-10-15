import { useRef } from "react";
import { Plus, Upload, X } from "lucide-react";
import { FORM_RADIUS } from "@/lib/form-styles";
import { cn } from "@/lib/utils";

type DocumentUploadButtonProps = {
  files: File[];
  onChange: (files: File[]) => void;
  label?: string;
  variant?: "default" | "add";
  accept?: string;
};

export function DocumentUploadButton({
  files,
  onChange,
  label = "Загрузить документ",
  variant = "default",
  accept,
}: DocumentUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (fileList: FileList | null) => {
    if (!fileList?.length) return;
    onChange(Array.from(fileList));
  };

  const handleRemove = (index: number) => {
    onChange(files.filter((_, i) => i !== index));
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handleChange(e.target.files)}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={cn(
          "inline-flex w-full items-center justify-center gap-1.5 border border-dashed border-slate-300 bg-slate-50 px-3 text-xs font-medium text-slate-600 hover:bg-slate-100",
          FORM_RADIUS,
          variant === "add" ? "py-2.5" : "py-3",
        )}
      >
        {variant === "add" ? (
          <>
            <Plus className="h-4 w-4" />
            Добавить документ
          </>
        ) : (
          <>
            <Upload className="h-4 w-4" />
            {label}
          </>
        )}
      </button>
      {files.length > 0 ? (
        <ul className="space-y-1">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${file.size}`}
              className={cn(
                "flex items-center justify-between border border-slate-200 px-3 py-2 text-xs",
                FORM_RADIUS,
              )}
            >
              <span className="truncate">{file.name}</span>
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="ml-2 text-slate-400 hover:text-slate-600"
                aria-label="Удалить документ"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
