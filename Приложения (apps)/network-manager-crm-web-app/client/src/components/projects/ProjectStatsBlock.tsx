import { FileText, UserCheck2, Users, Wallet } from "lucide-react";

type ProjectStatsBlockProps = {
  workers: number;
  confirmed: number;
  reportsOnReview: number;
  budget: string;
  spent: string;
};

function StatItem({
  icon: Icon,
  label,
  value,
  className = "",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1 p-3 ${className}`}>
      <span className="flex items-center gap-1 text-[12px] text-slate-400">
        <Icon className="h-3 w-3 shrink-0 text-slate-400" />
        {label}
      </span>
      <span className="text-[16px] font-bold text-[#111827]">{value}</span>
    </div>
  );
}

export function ProjectStatsBlock({
  workers,
  confirmed,
  reportsOnReview,
  budget,
  spent,
}: ProjectStatsBlockProps) {
  return (
    <div className="overflow-hidden rounded-[12px] border border-slate-200 bg-white">
      <div className="grid grid-cols-6">
        <StatItem
          icon={Users}
          label="Работники"
          value={workers}
          className="col-span-2 border-b border-r border-slate-200"
        />
        <StatItem
          icon={UserCheck2}
          label="Подтвердили"
          value={confirmed}
          className="col-span-2 border-b border-r border-slate-200"
        />
        <StatItem
          icon={FileText}
          label="Отчёты"
          value={reportsOnReview}
          className="col-span-2 border-b border-slate-200"
        />
        <StatItem
          icon={Wallet}
          label="Бюджет"
          value={budget}
          className="col-span-3 border-r border-slate-200"
        />
        <StatItem
          icon={Wallet}
          label="Подтверждено"
          value={spent}
          className="col-span-3"
        />
      </div>
    </div>
  );
}
