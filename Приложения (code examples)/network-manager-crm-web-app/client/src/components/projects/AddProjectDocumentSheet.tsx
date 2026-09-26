import { useState } from "react";
import {
  FormBottomSheet,
  FormBottomSheetCancel,
  FormBottomSheetPrimary,
} from "@/components/common/FormBottomSheet";
import { DocumentUploadButton } from "@/components/common/DocumentUploadButton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PROJECT_DOCUMENT_CATEGORIES,
  type ProjectDocumentCategory,
} from "@/lib/constants/project-documents";
import { formLabelClassName } from "@/lib/form-styles";
import { useUploadProjectDocument } from "@/lib/api/hooks/useProjects";
import { showError, showSuccess } from "@/lib/toast";

type AddProjectDocumentSheetProps = {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AddProjectDocumentSheet({
  projectId,
  open,
  onOpenChange,
}: AddProjectDocumentSheetProps) {
  const upload = useUploadProjectDocument(projectId);
  const [documentType, setDocumentType] = useState<ProjectDocumentCategory>("general");
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async () => {
    if (!file) {
      showError("Выберите файл");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    formData.append("documentType", documentType);
    try {
      await upload.mutateAsync(formData);
      showSuccess("Документ загружен");
      setFile(null);
      onOpenChange(false);
    } catch (err) {
      showError(err);
    }
  };

  return (
    <FormBottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Добавить документ"
      description="Выберите категорию и загрузите файл для проекта."
      footer={
        <>
          <FormBottomSheetCancel
            onClick={() => onOpenChange(false)}
            disabled={upload.isPending}
          />
          <FormBottomSheetPrimary
            onClick={() => void handleSubmit()}
            disabled={!file || upload.isPending}
          >
            {upload.isPending ? "Загрузка…" : "Загрузить"}
          </FormBottomSheetPrimary>
        </>
      }
    >
      <div className="space-y-1.5">
        <label className={formLabelClassName}>Категория</label>
        <Select
          value={documentType}
          onValueChange={(value) => setDocumentType(value as ProjectDocumentCategory)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Выберите категорию" />
          </SelectTrigger>
          <SelectContent>
            {PROJECT_DOCUMENT_CATEGORIES.map(({ type, label }) => (
              <SelectItem key={type} value={type}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <label className={formLabelClassName}>Файл</label>
        <DocumentUploadButton
          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
          files={file ? [file] : []}
          onChange={(files) => setFile(files[0] ?? null)}
        />
      </div>
    </FormBottomSheet>
  );
}
