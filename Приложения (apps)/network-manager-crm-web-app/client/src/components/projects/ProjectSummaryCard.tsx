import { Briefcase } from "lucide-react";
import { projectStatusMeta } from "@/lib/constants/status";
import { FORM_RADIUS } from "@/lib/form-styles";

type ProjectSummaryCardProps = {
  name: string;
  status: string;
};

export function ProjectSummaryCard({ name, status }: ProjectSummaryCardProps) {
  const statusMeta = projectStatusMeta[status] ?? projectStatusMeta.active;

  return (
    <div className={`${FORM_RADIUS} border border-slate-200 bg-white p-3`}>
      <div className="flex items-center gap-2.5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500">
          <Briefcase className="h-4 w-4" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-slate-900">{name}</p>
          <span
            className={`mt-1 inline-flex items-center rounded-full px-1.5 py-px text-[10px] font-medium ${statusMeta.cls}`}
          >
            {statusMeta.label}
          </span>
        </div>
      </div>
    </div>
  );
}
