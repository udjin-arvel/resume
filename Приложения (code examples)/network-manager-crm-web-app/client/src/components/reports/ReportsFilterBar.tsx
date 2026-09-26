import { ChevronDown, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

export type ReportsFilterKey = "clients" | "projects" | "workers";

type ReportsFilterBarProps = {
  activeCounts: Record<ReportsFilterKey, number>;
  onOpen: (key: ReportsFilterKey) => void;
};

const filters: { key: ReportsFilterKey; label: string }[] = [
  { key: "clients", label: "Клиенты" },
  { key: "projects", label: "Проекты" },
  { key: "workers", label: "Работники" },
];

export function ReportsFilterBar({ activeCounts, onOpen }: ReportsFilterBarProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        <Filter className="h-4 w-4 text-slate-600" />
        Фильтры
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map(({ key, label }) => {
          const active = activeCounts[key] > 0;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onOpen(key)}
              className={cn(
                "flex min-w-0 items-center justify-between gap-1 rounded-full border bg-white px-3 py-1 text-[12px] md:text-[14px] font-medium text-slate-700 transition hover:bg-slate-50",
                active ? "border-slate-400" : "border-slate-200",
              )}
            >
              <span className="truncate">{label}</span>
              <ChevronDown className="h-3 w-3 shrink-0 text-slate-500" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
