import type { WorkerReportSubmitPayload } from "@/components/worker/reports/WorkerReportForm";
import type { uploadDocument } from "@/lib/api/documents";

type UploadFn = typeof uploadDocument;

export async function uploadWorkerReportDocument(
  reportId: string,
  file: File,
  documentType: "general" | "receipt",
  uploadDoc: UploadFn,
) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("entityType", "worker_report");
  fd.append("entityId", reportId);
  fd.append("documentType", documentType);
  return uploadDoc(fd);
}

export function buildWorkerReportPayload(data: WorkerReportSubmitPayload): Record<string, unknown> {
  const { payload } = data;
  const values = payload as {
    expenses: {
      expenseType: string;
      amount: string;
      comment?: string;
      documentId?: string;
    }[];
  };

  const expenses = values.expenses.map((exp) => ({
    expenseType: exp.expenseType,
    amount: exp.amount,
    comment: exp.comment,
    documentId: exp.documentId ?? undefined,
  }));

  return { ...payload, expenses };
}

export async function uploadExpenseReceipts(
  reportId: string,
  expenses: {
    expenseType: string;
    amount: string;
    comment?: string;
    documentId?: string;
  }[],
  expenseFiles: Record<number, File[]>,
  uploadDoc: UploadFn,
) {
  return Promise.all(
    expenses.map(async (exp, idx) => {
      let documentId = exp.documentId;
      const file = expenseFiles[idx]?.[0];
      if (file) {
        const doc = await uploadWorkerReportDocument(reportId, file, "receipt", uploadDoc);
        documentId = doc.id;
      }
      return {
        expenseType: exp.expenseType,
        amount: exp.amount,
        comment: exp.comment,
        documentId: documentId ?? undefined,
      };
    }),
  );
}

export async function uploadWorkerReportDocuments(
  reportId: string,
  files: File[],
  uploadDoc: UploadFn,
): Promise<void> {
  for (const file of files) {
    await uploadWorkerReportDocument(reportId, file, "general", uploadDoc);
  }
}

/** @deprecated use buildWorkerReportPayload */
export async function prepareWorkerReportPayload(
  data: WorkerReportSubmitPayload,
  _uploadDoc: UploadFn,
): Promise<Record<string, unknown>> {
  return buildWorkerReportPayload(data);
}
