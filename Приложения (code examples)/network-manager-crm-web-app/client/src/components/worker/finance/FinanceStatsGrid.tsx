import type { LucideIcon } from "lucide-react";
import { Clock, Wallet } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatHours, formatMoney, parseDecimal } from "@/lib/format";

export type FinanceStatsData = {
  totalHours: string;
  confirmedHours: string;
  paidAmount: string;
  remainingAmount: string;
};

type FinanceStatsGridProps = {
  data: FinanceStatsData;
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
      <div className="mb-1 flex gap-1 text-slate-400">
        <Icon className="h-3 w-3 mt-[2px] md:mt-[3px] shrink-0" />
        <span className="text-[12px] md:text-[14px]">{label}</span>
      </div>
      <p className={`text-[14px] md:text-[18px] font-bold text-gray-900 ${valueClassName ?? ""}`}>{value}</p>
    </div>
  );
}

export function FinanceStatsGrid({ data }: FinanceStatsGridProps) {
  const { t } = useTranslation();
  const remaining = parseDecimal(data.remainingAmount);

  return (
    <div className="grid grid-cols-2 rounded-[12px] border border-slate-200 bg-white">
      <StatCell
        icon={Clock}
        label={t("worker.finance.stats.totalHours")}
        value={formatHours(data.totalHours)}
        className="border-b border-r border-gray-100"
      />
      <StatCell
        icon={Clock}
        label={t("worker.finance.stats.confirmedHours")}
        value={formatHours(data.confirmedHours)}
        className="border-b border-gray-100"
      />
      <StatCell
        icon={Wallet}
        label={t("worker.finance.stats.paid")}
        value={formatMoney(data.paidAmount)}
        valueClassName="!text-emerald-500"
        className="border-r border-gray-100"
      />
      <StatCell
        icon={Wallet}
        label={t("worker.finance.stats.remaining")}
        value={formatMoney(data.remainingAmount)}
        valueClassName={remaining > 0 ? "!text-red-500" : undefined}
      />
    </div>
  );
}

export function FinanceStatsGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-0 rounded-2xl border border-gray-100 bg-white shadow-sm">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className={`h-24 animate-pulse bg-gray-100 p-4 ${
            i === 0 ? "border-b border-r border-gray-100" : ""
          } ${i === 1 ? "border-b border-gray-100" : ""} ${i === 2 ? "border-r border-gray-100" : ""}`}
        />
      ))}
    </div>
  );
}
