import type { UseFormRegister } from "react-hook-form";
import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { REPORT_EXPENSE_TYPES, reportInputClass } from "@/lib/worker-reports";
import { NativeSelect } from "@/components/ui/native-select";

type ExpenseRowFieldProps = {
  index: number;
  register: UseFormRegister<{
    expenses: { expenseType: string; amount: string; comment?: string; documentId?: string }[];
  }>;
  onRemove: () => void;
  onAmountChange: (value: string) => void;
};

export function ExpenseRowField({
  index,
  register,
  onRemove,
  onAmountChange,
}: ExpenseRowFieldProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <NativeSelect {...register(`expenses.${index}.expenseType`)}>
        {REPORT_EXPENSE_TYPES.map((type) => (
          <option key={type.value} value={type.value}>
            {t(type.labelKey)}
          </option>
        ))}
      </NativeSelect>
      <input
        type="text"
        placeholder={t("worker.reports.field.expenseDescription")}
        className={reportInputClass}
        {...register(`expenses.${index}.comment`)}
      />
      <div className="space-y-1.5">
        <label className="text-sm text-gray-600">{t("worker.reports.field.amount")}</label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            inputMode="decimal"
            placeholder="0"
            className={`${reportInputClass} flex-1`}
            {...register(`expenses.${index}.amount`)}
            onChange={(e) => onAmountChange(e.target.value)}
          />
          <span className="shrink-0 text-sm font-medium text-gray-500">€</span>
          <button
            type="button"
            onClick={onRemove}
            className="flex h-10 w-10 shrink-0 items-center justify-center text-red-500 hover:text-red-600"
            aria-label={t("worker.reports.removeExpenseRow")}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
