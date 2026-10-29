import type { FieldArrayWithId, UseFormRegister, UseFormSetValue } from "react-hook-form";
import { Plus, Trash2, Wallet } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatMoney } from "@/lib/format";
import { ReportFormSection } from "./ReportFormSection";
import { ExpenseRowField } from "./ExpenseRowField";
import { sanitizeAmountInput } from "@/lib/worker-reports";

type ExpenseFormRow = {
  expenseType: string;
  amount: string;
  comment?: string;
  documentId?: string;
};

type ReportExpensesSectionProps = {
  fields: FieldArrayWithId<{ expenses: ExpenseFormRow[] }, "expenses", "id">[];
  register: UseFormRegister<{ expenses: ExpenseFormRow[] }>;
  setValue: UseFormSetValue<{ expenses: ExpenseFormRow[] }>;
  onAppend: () => void;
  onRemove: (index: number) => void;
  onClearAll: () => void;
  totalExpenses: number;
};

export function ReportExpensesSection({
  fields,
  register,
  setValue,
  onAppend,
  onRemove,
  onClearAll,
  totalExpenses,
}: ReportExpensesSectionProps) {
  const { t } = useTranslation();

  const header = (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50">
          <Wallet className="h-4 w-4 text-amber-700" />
        </span>
        <h2 className="text-sm font-semibold text-gray-900">{t("worker.reports.section.expenses")}</h2>
      </div>
      {fields.length > 0 ? (
        <button
          type="button"
          className="text-red-500 hover:text-red-600"
          onClick={onClearAll}
          aria-label={t("worker.reports.clearExpenses")}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );

  return (
    <ReportFormSection header={header}>
      <div className="space-y-4">
        {fields.map((field, idx) => (
          <ExpenseRowField
            key={field.id}
            index={idx}
            register={register}
            onRemove={() => onRemove(idx)}
            onAmountChange={(value) =>
              setValue(`expenses.${idx}.amount`, sanitizeAmountInput(value))
            }
          />
        ))}
        <button
          type="button"
          onClick={onAppend}
          className="flex w-full items-center justify-center gap-1.5 py-1 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          <Plus className="h-4 w-4" />
          {t("worker.reports.addExpenseRow")}
        </button>
        <div className="flex items-center justify-between border-t border-gray-100 pt-3">
          <span className="text-sm text-gray-600">{t("worker.reports.expenseTotal")}</span>
          <span className="text-base font-semibold text-gray-900">{formatMoney(totalExpenses)}</span>
        </div>
      </div>
    </ReportFormSection>
  );
}
