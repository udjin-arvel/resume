import { Check, RotateCcw, X } from "lucide-react";
import { useTranslation } from "react-i18next";

type WorkerApplicationActionsProps = {
  onAccept: () => void;
  onReject: () => void;
  onReturn: () => void;
  acceptPending?: boolean;
};

export function WorkerApplicationActions({
  onAccept,
  onReject,
  onReturn,
  acceptPending = false,
}: WorkerApplicationActionsProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-2 px-2 py-2">
      <button
        type="button"
        disabled={acceptPending}
        onClick={onAccept}
        className="inline-flex mb-3 h-[44px] w-full items-center justify-center gap-2 rounded-full bg-emerald-600 text-[14px] font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
      >
        <Check className="h-4 w-4" />
        {t("workers.application.accept")}
      </button>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onReject}
          className="inline-flex h-[44px] items-center justify-center gap-1.5 rounded-full border border-red-200 bg-white text-[14px] font-medium text-red-600 transition hover:bg-red-50"
        >
          <X className="h-4 w-4" />
          {t("workers.application.reject")}
        </button>
        <button
          type="button"
          onClick={onReturn}
          className="inline-flex h-[44px] items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white text-[14px] font-medium text-slate-700 transition hover:bg-slate-50"
        >
          <RotateCcw className="h-4 w-4" />
          {t("workers.application.return")}
        </button>
      </div>
    </div>
  );
}
