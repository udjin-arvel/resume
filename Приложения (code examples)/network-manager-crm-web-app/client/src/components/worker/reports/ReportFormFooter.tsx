import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";

type ReportFormFooterProps = {
  submitting?: boolean;
  onCancel: () => void;
  submitLabel?: string;
};

export function ReportFormFooter({ submitting, onCancel, submitLabel }: ReportFormFooterProps) {
  const { t } = useTranslation();

  return (
    <div className="py-4">
      <button
        type="submit"
        disabled={submitting}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-500 py-2 text-[14px] font-semibold text-white hover:bg-emerald-600 disabled:opacity-60"
      >
        <Check className="h-5 w-5" />
        {submitLabel ?? t("worker.reports.submitReport")}
      </button>
      <button
        type="button"
        disabled={submitting}
        onClick={onCancel}
        className="mt-2 w-full rounded-full border border-gray-200 bg-white py-2 text-[14px] font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
      >
        {t("worker.reports.cancel")}
      </button>
    </div>
  );
}
