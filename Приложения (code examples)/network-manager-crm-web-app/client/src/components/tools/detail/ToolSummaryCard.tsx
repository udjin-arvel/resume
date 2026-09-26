import { Wrench } from "lucide-react";
import { getControlTypeLabel, type ControlType } from "@/components/tools/constants";
import type { ToolDetail } from "@/lib/api/tools";
import { formatDate } from "@/lib/format";
import { formatToolCost, getToolSubtitle } from "./toolDetailDisplay";

type ToolSummaryCardProps = {
  tool: ToolDetail;
};

function GridCell({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`px-3 py-3 ${className}`}>
      <p className="text-[12px] md:text-[14px] text-slate-400">{label}</p>
      <p className="mt-0.5 text-[14px] md:text-[16px] font-medium text-slate-900">{value}</p>
    </div>
  );
}

export function ToolSummaryCard({ tool }: ToolSummaryCardProps) {
  return (
    <section className="overflow-hidden rounded-[12px] border border-slate-200 bg-white">
      <div className="flex items-center gap-3 border-b border-slate-200 p-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-700">
          <Wrench className="h-6 w-6" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{tool.name}</p>
          <p className="truncate text-xs text-slate-500">{getToolSubtitle(tool)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2">
        <GridCell
          label="Категория"
          value={tool.toolType || "—"}
          className="border-b border-r border-slate-200"
        />
        <GridCell
          label="Тип контроля"
          value={getControlTypeLabel(tool.controlType as ControlType)}
          className="border-b border-slate-200"
        />
        <GridCell
          label="Стоимость"
          value={formatToolCost(tool.costCents)}
          className="border-r border-slate-200"
        />
        <GridCell
          label="Дата покупки"
          value={tool.purchaseDate ? formatDate(tool.purchaseDate) : "—"}
        />
      </div>
    </section>
  );
}
