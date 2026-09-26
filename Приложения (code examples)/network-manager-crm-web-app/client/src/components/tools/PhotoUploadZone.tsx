import { useRef, useState } from "react";
import { FORM_RADIUS } from "@/lib/form-styles";
import { Camera, X } from "lucide-react";

type PhotoUploadZoneProps = {
  files: File[];
  onChange: (files: File[]) => void;
};

export function PhotoUploadZone({ files, onChange }: PhotoUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleChange = (fileList: FileList | null) => {
    if (!fileList?.length) return;
    const list = Array.from(fileList);
    onChange(list);
    if (list[0]) {
      setPreviewUrl(URL.createObjectURL(list[0]));
    }
  };

  const handleRemove = () => {
    onChange([]);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleChange(e.target.files)}
      />
      {files.length === 0 ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={`flex w-full flex-col items-center justify-center gap-2 ${FORM_RADIUS} border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-xs font-medium text-slate-600 hover:bg-slate-100`}
        >
          <Camera className="h-6 w-6 text-slate-400" />
          Добавить фото
        </button>
      ) : (
        <div className={`relative overflow-hidden ${FORM_RADIUS} border border-slate-200 bg-slate-50`}>
          {previewUrl ? (
            <img src={previewUrl} alt="" className="h-32 w-full object-cover" />
          ) : null}
          <div className="flex items-center justify-between px-3 py-2 text-xs text-slate-600">
            <span className="truncate">{files.map((f) => f.name).join(", ")}</span>
            <button
              type="button"
              onClick={handleRemove}
              className="ml-2 text-slate-400 hover:text-slate-600"
              aria-label="Удалить фото"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
