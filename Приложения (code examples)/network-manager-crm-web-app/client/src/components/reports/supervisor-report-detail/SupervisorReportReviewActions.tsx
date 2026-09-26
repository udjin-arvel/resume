import { AlertTriangle, Check } from "lucide-react";

type SupervisorReportReviewActionsProps = {
  status: string;
  onApprove: () => void;
  onAttention: () => void;
  approvePending: boolean;
  attentionPending: boolean;
};

export function SupervisorReportReviewActions({
  status,
  onApprove,
  onAttention,
  approvePending,
  attentionPending,
}: SupervisorReportReviewActionsProps) {
  if (status === "approved") {
    return (
      <div className="bg-[#F8F9FB] p-4">
        <div className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <Check className="h-4 w-4" />
          Отчёт принят
        </div>
      </div>
    );
  }

  if (status === "attention") {
    return (
      <div className="sticky bottom-0 z-10 border-t border-slate-200 bg-[#F8F9FB] px-4 py-4">
        <div className="flex items-center justify-center gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
          <AlertTriangle className="h-4 w-4" />
          Отмечено как требующее внимания
        </div>
      </div>
    );
  }

  return (
    <div className="sticky bottom-0 z-10 space-y-2 border-t border-slate-200 bg-[#F8F9FB] px-4 py-4">
      <button
        type="button"
        disabled={approvePending}
        onClick={onApprove}
        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-emerald-600 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        <Check className="h-4 w-4" />
        Принять
      </button>
      <button
        type="button"
        disabled={attentionPending}
        onClick={onAttention}
        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full border border-amber-300 bg-white text-sm font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-50"
      >
        <AlertTriangle className="h-4 w-4" />
        Требует внимания
      </button>
    </div>
  );
}
