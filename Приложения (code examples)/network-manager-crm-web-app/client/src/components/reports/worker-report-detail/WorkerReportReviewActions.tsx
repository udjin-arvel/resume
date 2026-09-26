import {
  AlertTriangle,
  Check,
  RotateCcw,
} from "lucide-react";

type WorkerReportReviewActionsProps = {
  status: string;
  managerComment?: string;
  returnMode: boolean;
  comment: string;
  onCommentChange: (value: string) => void;
  onReturnMode: () => void;
  onCancelReturn: () => void;
  onApprove: () => void;
  onReject: () => void;
  approvePending: boolean;
  rejectPending: boolean;
};

export function WorkerReportReviewActions({
  status,
  managerComment,
  returnMode,
  comment,
  onCommentChange,
  onReturnMode,
  onCancelReturn,
  onApprove,
  onReject,
  approvePending,
  rejectPending,
}: WorkerReportReviewActionsProps) {
  if (status === "approved") {
    return (
      <div className="sticky bottom-0 border-t border-slate-200 bg-[#F8F9FB] px-4 py-4">
        <div className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <Check className="h-4 w-4" />
          Отчёт принят
        </div>
      </div>
    );
  }

  if (status === "returned") {
    return (
      <div className="sticky bottom-0 border-t border-slate-200 bg-[#F8F9FB] px-4 py-4">
        <div className="flex items-start gap-2 rounded-2xl bg-blue-50 px-4 py-3 text-sm text-blue-700">
          <RotateCcw className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Возвращён работнику
            {managerComment ? `: ${managerComment}` : ""}
          </span>
        </div>
      </div>
    );
  }

  if (returnMode) {
    return (
      <div className="sticky bottom-0 space-y-3 border-t border-slate-200 bg-[#F8F9FB] px-4 py-4">
        <label className="block text-xs font-medium text-slate-600">
          Комментарий (обязателен)
        </label>
        <textarea
          value={comment}
          onChange={(e) => onCommentChange(e.target.value)}
          rows={3}
          placeholder="Например: не приложен чек по отелю"
          className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
        />
        {!comment.trim() ? (
          <p className="flex items-center gap-1 text-[11px] text-amber-600">
            <AlertTriangle className="h-3 w-3" />
            Без комментария вернуть нельзя
          </p>
        ) : null}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onCancelReturn}
            className="h-12 rounded-2xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Отмена
          </button>
          <button
            type="button"
            disabled={!comment.trim() || rejectPending}
            onClick={onReject}
            className="h-12 rounded-2xl bg-slate-900 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Вернуть
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="sticky bottom-0 space-y-2 border-t border-slate-200 bg-[#F8F9FB] px-4 py-4">
      <button
        type="button"
        disabled={approvePending}
        onClick={onApprove}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        <Check className="h-4 w-4" />
        Принять
      </button>
      <button
        type="button"
        onClick={onReturnMode}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        <RotateCcw className="h-4 w-4" />
        Вернуть
      </button>
    </div>
  );
}
