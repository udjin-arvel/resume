import { getUsageUnitLabel } from "@/components/tools/constants";
import type { ToolDetail } from "@/lib/api/tools";

type ToolUsageLimitSectionProps = {
  tool: ToolDetail;
};

export function ToolUsageLimitSection({ tool }: ToolUsageLimitSectionProps) {
  const left = Math.max(0, tool.usageLimit - tool.usageCount);
  const pct = Math.min(100, Math.round((tool.usageCount / tool.usageLimit) * 100));
  const unitLabel = getUsageUnitLabel(tool.usageUnit ?? "tests").toLowerCase();
  const barColor = pct >= 90 ? "bg-red-500" : pct >= 75 ? "bg-amber-500" : "bg-emerald-500";
  const usedColor = pct >= 90 ? "bg-red-500" : pct >= 75 ? "bg-amber-500" : "bg-emerald-500";

  return (
    <div className="rounded-[12px] border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-500">Остаток</span>
        <span className="font-semibold text-slate-900">
          {left.toLocaleString("ru-RU")} {unitLabel}
        </span>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>

      <div className="mt-3 space-y-1.5 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 shrink-0 rounded-full ${usedColor}`} />
          <span>
            Использовано {tool.usageCount.toLocaleString("ru-RU")} · {pct}%
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 shrink-0 rounded-full bg-slate-300" />
          <span>Всего {tool.usageLimit.toLocaleString("ru-RU")}</span>
        </div>
      </div>
    </div>
  );
}
