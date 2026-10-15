import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteDocument,
  fetchDocuments,
  replaceDocument,
  uploadDocument,
  type DocumentListQuery,
} from "@/lib/api/documents";
import { queryKeys } from "@/lib/api/query-keys";

export function useDocuments(filters: DocumentListQuery = {}, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.documents.list(filters),
    queryFn: () => fetchDocuments(filters),
    enabled: options?.enabled ?? true,
  });
}

export function useUploadDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: uploadDocument,
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.documents.all }),
  });
}

export function useReplaceDocument(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => replaceDocument(id, formData),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.documents.all }),
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteDocument,
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.documents.all }),
  });
}
