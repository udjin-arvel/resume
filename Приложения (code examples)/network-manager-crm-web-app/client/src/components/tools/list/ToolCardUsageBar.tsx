import { getUsageUnitLabel } from "@/components/tools/constants";
import type { ToolListItem } from "./toolCardDisplay";

type ToolCardUsageBarProps = {
  tool: ToolListItem;
};

export function ToolCardUsageBar({ tool }: ToolCardUsageBarProps) {
  const left = tool.usageLimit - tool.usageCount;
  const pct = Math.min(100, Math.round((tool.usageCount / tool.usageLimit) * 100));
  const unitLabel = getUsageUnitLabel(tool.usageUnit ?? "tests").toLowerCase();

  return (
    <div className="px-1 pt-3">
      <div className="flex items-center justify-between text-[11px] text-slate-500">
        <span>
          {tool.usageCount} / {tool.usageLimit} {unitLabel}
        </span>
        <span>осталось {left}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full ${
            pct >= 90 ? "bg-red-500" : pct >= 75 ? "bg-amber-500" : "bg-emerald-500"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
