import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type FileUploadProps = {
  accept?: string;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  label?: string;
};

export function FileUpload({
  accept,
  multiple,
  onFiles,
  label = "Загрузить файл",
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<File[]>([]);

  const handleChange = (files: FileList | null) => {
    if (!files?.length) return;
    const list = Array.from(files);
    setPreview(list);
    onFiles(list);
  };

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => handleChange(e.target.files)}
      />
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="mr-2 h-4 w-4" />
        {label}
      </Button>
      {preview.length > 0 && (
        <ul className="space-y-2">
          {preview.map((file) => (
            <li
              key={`${file.name}-${file.size}`}
              className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700"
            >
              <span className="truncate">{file.name}</span>
              <button
                type="button"
                onClick={() => {
                  setPreview((prev) => prev.filter((f) => f !== file));
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
