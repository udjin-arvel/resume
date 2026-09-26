import { Clock } from "lucide-react";
import type { ActivityListItemData } from "@/lib/activity-display";

type ActivityListProps = {
  items: ActivityListItemData[];
  className?: string;
};

export function ActivityList({ items, className }: ActivityListProps) {
  return (
    <ul className={className}>
      {items.map((item) => {
        const Icon = item.icon ?? Clock;
        return (
          <li
            key={item.id}
            className="flex items-center gap-3 border-b border-[#F1F5F9] p-3 last:border-0"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[#F1F5F9] text-[#8E8E93]">
              <Icon className="h-4 w-4" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-[14px] font-medium">{item.project}</span>
              <div className="flex w-full items-center justify-between gap-2">
                <span className="truncate text-[13px] text-slate-500">{item.action}</span>
                <span className="shrink-0 text-[12px] text-slate-400">{item.time}</span>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
