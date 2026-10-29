import { useRef } from "react";
import { FileText, Trash2, Upload } from "lucide-react";
import { LoadingSkeleton } from "@/components/common/LoadingSpinner";
import { PageError } from "@/components/common/PageError";
import { DocumentOpenLink } from "@/components/common/DocumentAccess";
import { useDeleteDocument, useDocuments, useUploadDocument } from "@/lib/api/hooks/useDocuments";
import { showError, showSuccess } from "@/lib/toast";

type WorkerDocumentsTabProps = {
  workerId: string;
};

export function WorkerDocumentsTab({ workerId }: WorkerDocumentsTabProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const docsQuery = useDocuments({ entityType: "user", entityId: workerId });
  const uploadDocument = useUploadDocument();
  const deleteDocument = useDeleteDocument();

  if (docsQuery.isLoading) {
    return <LoadingSkeleton rows={3} />;
  }

  if (docsQuery.isError) {
    return <PageError onRetry={() => docsQuery.refetch()} />;
  }

  const documents = docsQuery.data ?? [];

  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("entityType", "user");
    formData.append("entityId", workerId);
    try {
      await uploadDocument.mutateAsync(formData);
      showSuccess("Документ загружен");
    } catch (err) {
      showError(err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDocument.mutateAsync(id);
      showSuccess("Документ удалён");
    } catch (err) {
      showError(err);
    }
  };

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-[12px] bg-white border border-slate-200">
        {documents.length === 0 ? (
          <p className="px-4 py-8 text-center text-[12px] md:text-[14px] text-slate-500">Нет документов</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {documents.map((doc) => (
              <li key={doc.id} className="flex items-center gap-3 px-4 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                  <FileText className="h-4 w-4" />
                </span>
                <DocumentOpenLink
                  documentId={doc.id}
                  filename={doc.filename}
                  mimeType={doc.mimeType}
                  className="min-w-0 flex-1"
                >
                  <p className="truncate text-sm font-medium text-slate-900">{doc.filename}</p>
                  <p className="truncate text-xs text-slate-500">
                    {doc.documentType || "Документ"}
                  </p>
                </DocumentOpenLink>
                <button
                  type="button"
                  onClick={() => handleDelete(doc.id)}
                  disabled={deleteDocument.isPending}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleUpload(file);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        disabled={uploadDocument.isPending}
        onClick={() => fileRef.current?.click()}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white px-3 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
      >
        <Upload className="h-4 w-4" /> Загрузить документ
      </button>
    </div>
  );
}
