import { Wallet } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { WorkerReportDetailSection } from "./WorkerReportDetailSection";

type WorkerReportCalculationSectionProps = {
  hourlyRate: number;
  totalHours: number;
  laborCost: number;
  expensesTotal: number;
  grandTotal: number;
};

function CalcRow({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-center justify-between py-3">
      <span className="text-[14px] md:text-[16px] text-slate-600">{label}</span>
      <span className="text-[14px] md:text-[16px] font-medium text-slate-900 tabular-nums">{value}</span>
    </li>
  );
}

export function WorkerReportCalculationSection({
  hourlyRate,
  totalHours,
  laborCost,
  expensesTotal,
  grandTotal,
}: WorkerReportCalculationSectionProps) {
  return (
    <WorkerReportDetailSection title="Расчёт">
      <ul className="divide-y divide-slate-100 px-3 py-2">
        <CalcRow label="Ставка" value={`${formatMoney(hourlyRate)}/час`} />
        <CalcRow label="Часов" value={String(totalHours)} />
        <CalcRow label="Стоимость работ" value={formatMoney(laborCost)} />
        <CalcRow label="Доп. расходы" value={formatMoney(expensesTotal)} />
      </ul>
      <div className="flex items-center justify-between rounded-b-2xl bg-slate-900 px-4 py-4 text-white">
        <span className="flex items-center gap-2 text-sm font-medium">
          <Wallet className="h-4 w-4 opacity-80" />
          Общий итог
        </span>
        <span className="text-lg font-semibold tabular-nums">{formatMoney(grandTotal)}</span>
      </div>
    </WorkerReportDetailSection>
  );
}
