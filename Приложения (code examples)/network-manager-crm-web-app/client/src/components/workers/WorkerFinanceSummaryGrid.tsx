import type { LucideIcon } from "lucide-react";
import { Clock, Wallet } from "lucide-react";
import { formatHours, formatRub, parseDecimal } from "@/lib/format";

export type WorkerFinanceSummaryData = {
  confirmedHours: string;
  totalLaborAmount: number;
  totalExtraExpenses: number;
  paidAmount: string;
  remainingAmount: string;
};

type WorkerFinanceSummaryGridProps = {
  data: WorkerFinanceSummaryData;
};

type StatCellProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  valueClassName?: string;
  className?: string;
};

function StatCell({ icon: Icon, label, value, valueClassName, className }: StatCellProps) {
  return (
    <div className={`p-3 ${className ?? ""}`}>
      <div className="flex gap-1.5">
        <Icon className="h-[16px] w-3 shrink-0 text-slate-400" />
        <span className="text-[12px] text-slate-400 text-nowrap">{label}</span>
      </div>
      <p className={`mt-1.5 text-[14px] md:text-[16px] font-semibold tabular-nums text-slate-900 ${valueClassName ?? ""}`}>
        {value}
      </p>
    </div>
  );
}

export function WorkerFinanceSummaryGrid({ data }: WorkerFinanceSummaryGridProps) {
  const remaining = parseDecimal(data.remainingAmount);

  return (
    <div className="overflow-hidden rounded-[12px] border border-slate-200 bg-white">
      <div className="grid grid-cols-3 divide-x divide-slate-100">
        <StatCell
          icon={Clock}
          label="Часы"
          value={formatHours(data.confirmedHours)}
        />
        <StatCell
          icon={Wallet}
          label="Сумма"
          value={formatRub(data.totalLaborAmount)}
        />
        <StatCell
          icon={Wallet}
          label="Доп. расходы"
          value={formatRub(data.totalExtraExpenses)}
        />
      </div>
      <div className="grid grid-cols-2 divide-x divide-slate-100 border-t border-slate-100">
        <StatCell
          icon={Wallet}
          label="Выплачено"
          value={formatRub(data.paidAmount)}
          valueClassName="!text-emerald-600"
        />
        <StatCell
          icon={Wallet}
          label="Остаток"
          value={formatRub(data.remainingAmount)}
          valueClassName={remaining > 0 ? "!text-red-600" : undefined}
        />
      </div>
    </div>
  );
}

export function WorkerFinanceSummaryGridSkeleton() {
  return <div className="h-36 animate-pulse rounded-[12px] border border-[#F0F0F0] bg-slate-100" />;
}
