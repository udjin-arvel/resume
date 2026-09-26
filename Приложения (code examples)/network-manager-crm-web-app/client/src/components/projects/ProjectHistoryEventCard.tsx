import { formatDate } from "@/lib/format";

type ProjectHistoryEventCardProps = {
  label: string;
  createdAt: string;
};

export function ProjectHistoryEventCard({ label, createdAt }: ProjectHistoryEventCardProps) {
  return (
    <article className="flex items-start gap-3 rounded-[12px] border border-[#E2E8F0] bg-white p-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[#F5F6FA]">
        <img src="/icons/clock.svg" alt="" className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] text-[#0F172B]">{label}</p>
        <p className="text-[12px] text-slate-500">{formatDate(createdAt)}</p>
      </div>
    </article>
  );
}
