import { Wrench } from "lucide-react";
import {
  getToolCardBadge,
  needsAttention,
  type ToolDisplayFields,
} from "@/components/tools/list/toolCardDisplay";
import { toolStatusMeta } from "@/lib/constants/status";
import { getToolSubtitle } from "@/components/tools/detail/toolDetailDisplay";

type ToolModalSummaryCardProps = {
  tool: ToolDisplayFields & { name: string; model?: string; serialNumber?: string };
  showDualBadges?: boolean;
};

export function ToolModalSummaryCard({ tool, showDualBadges }: ToolModalSummaryCardProps) {
  const attention = needsAttention(tool);
  const statusMeta = toolStatusMeta[tool.status];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-600">
          <Wrench className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">{tool.name}</p>
          <p className="mt-0.5 truncate text-xs text-slate-500">{getToolSubtitle(tool)}</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {showDualBadges ? (
              <>
                {statusMeta ? (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusMeta.cls}`}
                  >
                    {statusMeta.label}
                  </span>
                ) : null}
                {attention ? (
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                    Требует внимания
                  </span>
                ) : null}
              </>
            ) : (
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${getToolCardBadge(tool).cls}`}
              >
                {getToolCardBadge(tool).label}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
