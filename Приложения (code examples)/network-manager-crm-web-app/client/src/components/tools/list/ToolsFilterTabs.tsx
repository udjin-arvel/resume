import type { ToolTabKey } from "./useToolTabCounts";

const tabs: { id: ToolTabKey; label: string }[] = [
  { id: "all", label: "Все" },
  { id: "available", label: "Доступные" },
  { id: "on_project", label: "На проекте" },
  { id: "attention", label: "Требуют внимания" },
  { id: "expired", label: "Просроченные" },
  { id: "decommissioned", label: "Списанные" },
];

type ToolsFilterTabsProps = {
  tab: ToolTabKey;
  counts: Record<ToolTabKey, number>;
  onTabChange: (tab: ToolTabKey) => void;
};

export function ToolsFilterTabs({ tab, counts, onTabChange }: ToolsFilterTabsProps) {
  return (
    <div className="tools-filter-tabs">
      <div className="scrollbar-responsive flex gap-2 overflow-x-auto pt-2 pb-4">
        {tabs.map((t) => {
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onTabChange(t.id)}
              className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-1 text-[12px] md:text-[14px] font-medium transition ${
                active
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span>{t.label}</span>
              <span
                className={`flex min-h-[16px] min-w-[20px] items-center justify-center rounded-full px-1 text-[10px] font-semibold ${
                  active ? "bg-white/15 text-white" : "bg-slate-100 text-slate-500"
                }`}
              >
                {counts[t.id]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
