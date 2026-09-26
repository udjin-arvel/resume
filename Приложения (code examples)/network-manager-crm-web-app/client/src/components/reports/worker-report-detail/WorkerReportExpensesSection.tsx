import { Link2, Wallet } from "lucide-react";
import type { z } from "zod";
import { DocumentOpenLink } from "@/components/common/DocumentAccess";
import type { reportExpenseSchema } from "@/lib/api/schemas";
import { formatMoney } from "@/lib/format";
import { expenseTypeMeta } from "./constants";
import { WorkerReportDetailSection } from "./WorkerReportDetailSection";

type ReportExpense = z.infer<typeof reportExpenseSchema>;

type WorkerReportExpensesSectionProps = {
  expenses: ReportExpense[];
  expensesTotal: number;
};

export function WorkerReportExpensesSection({
  expenses,
  expensesTotal,
}: WorkerReportExpensesSectionProps) {
  return (
    <WorkerReportDetailSection title="Дополнительные расходы">
      {expenses.length === 0 ? (
        <p className="p-3 text-[14px] text-slate-400">Нет расходов</p>
      ) : (
        <>
          <ul className="divide-y divide-slate-100">
            {expenses.map((e) => {
              const m = expenseTypeMeta(e.expenseType);
              const Icon = m.icon;
              return (
                <li key={e.id} className="px-4 py-3">
                  <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 text-slate-500">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900">{m.label}</p>
                      {e.comment ? (
                        <p className="mt-0.5 text-xs text-slate-500">{e.comment}</p>
                      ) : null}
                      {e.documentId ? (
                        <DocumentOpenLink
                          documentId={e.documentId}
                          filename={e.documentFilename ?? undefined}
                          className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
                        >
                          <Link2 className="h-3 w-3" />
                          {e.documentFilename ?? "Вложение"}
                        </DocumentOpenLink>
                      ) : null}
                    </div>
                    <span className="shrink-0 text-[14px] md:text-[16px] font-semibold text-slate-900 tabular-nums">
                      {formatMoney(e.amount)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
          {expensesTotal > 0 ? (
            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
              <span className="flex items-center gap-2 text-[14px] text-slate-500">
                <Wallet className="h-4 w-4 text-slate-400" />
                Итого
              </span>
              <span className="text-[16px] md:text-[18px] font-semibold text-slate-900 tabular-nums">
                {formatMoney(expensesTotal)}
              </span>
            </div>
          ) : null}
        </>
      )}
    </WorkerReportDetailSection>
  );
}
