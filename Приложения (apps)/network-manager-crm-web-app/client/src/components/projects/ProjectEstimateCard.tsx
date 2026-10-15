import { Link } from "@tanstack/react-router";
import { Building2, Calendar, ChevronRight, MapPin, Wallet } from "lucide-react";

export type ProjectEstimateCardData = {
  id: string;
  name: string;
  statusLabel: string;
  statusBadgeCls: string;
  projectName: string;
  projectTypeLabel?: string;
  projectTypeBadgeCls?: string;
  city?: string;
  dateLabel?: string;
  totalAmount: string;
};

type ProjectEstimateCardProps = {
  estimate: ProjectEstimateCardData;
};

export function ProjectEstimateCard({ estimate }: ProjectEstimateCardProps) {
  return (
    <Link
      to="/estimates/$estimateId"
      params={{ estimateId: estimate.id }}
      className="card-hover block overflow-hidden rounded-[12px] border border-[#F0F0F0] bg-white"
    >
      <div className="flex items-center justify-between gap-2 p-3 pb-2">
        <span className="min-w-0 truncate text-[14px] font-medium text-[#111827]">
          {estimate.name}
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-[#C7C7CC]" />
      </div>

      <div className="border-t border-[#F1F5F9] px-3 py-2">
        <div className="flex flex-col gap-1">
          {estimate.dateLabel ? (
            <div className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-1.5 text-[12px] text-slate-400">
                <Calendar className="h-3 w-3 shrink-0" />
                <span className="truncate">{estimate.dateLabel}</span>
              </span>
              <span
                className={`inline-flex shrink-0 items-center rounded-full px-2 h-[19px] text-[10px] font-semibold ${estimate.statusBadgeCls}`}
              >
                {estimate.statusLabel}
              </span>
            </div>
          ) : (
            <div className="flex justify-end">
              <span
                className={`inline-flex shrink-0 items-center rounded-full px-2 h-[19px] text-[10px] font-semibold ${estimate.statusBadgeCls}`}
              >
                {estimate.statusLabel}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-1.5 text-[12px] text-slate-400">
              <Building2 className="h-3 w-3 shrink-0" />
              <span className="truncate">{estimate.projectName}</span>
            </span>
            {estimate.projectTypeLabel ? (
              <span
                className={`inline-flex shrink-0 items-center rounded-full px-2 h-[19px] text-[10px] font-semibold ${estimate.projectTypeBadgeCls}`}
              >
                {estimate.projectTypeLabel}
              </span>
            ) : null}
          </div>

          {estimate.city ? (
            <span className="flex items-center gap-1.5 text-[12px] text-slate-400">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{estimate.city}</span>
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-[#F1F5F9] px-4 py-3">
        <span className="flex gap-1.5 text-[12px] text-slate-400">
          <Wallet className="h-[16px] w-3.5 shrink-0" />
          Сумма сметы
        </span>
        <span className="text-[14px] font-bold text-[#111827]">{estimate.totalAmount}</span>
      </div>
    </Link>
  );
}
