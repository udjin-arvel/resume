import { ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type TaskCardItem = {
  id: string;
  title: string;
  subtitle: string;
};

export type TaskCardProps = {
  title: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  count: number;
  badgeColor: string;
  items: TaskCardItem[];
  onHeaderClick?: () => void;
  onItemClick?: (id: string) => void;
  onShowAll?: () => void;
};

export function TaskCard({
  title,
  icon: Icon,
  iconColor = "#FF3B30",
  iconBgColor,
  count,
  badgeColor,
  items,
  onHeaderClick,
  onItemClick,
  onShowAll,
}: TaskCardProps) {
  return count === 0 ? null : (
    <article
      className="card-hover rounded-[12px] border border-[#F0F0F0] bg-white"
    >
      <button
        type="button"
        onClick={onHeaderClick}
        className="flex w-full p-3 items-center justify-between border-b border-[#F1F5F9] text-left disabled:cursor-default"
      >
        <span className="flex items-center gap-3">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px]"
            style={iconBgColor ? { backgroundColor: iconBgColor } : undefined}
          >
            <Icon
              className="h-5 w-5 transition-colors"
              style={{ color: iconColor }}
            />
          </span>
          <span className={"text-[15px] font-medium"}>
            {title}
          </span>
        </span>
        <span className="flex items-center gap-2">
          <span
            className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
            style={{ backgroundColor: badgeColor }}
          >
            {count}
          </span>
        </span>
      </button>

      <ul className={cn("opacity-90")}>
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onItemClick?.(item.id)}
              className="flex w-full px-3 py-2 items-center justify-between border-b border-[#F1F5F9] text-left disabled:cursor-default"
            >
              <span className="flex min-w-0 flex-col">
                <span className={"truncate text-[14px] font-medium text-black"}>
                  {item.title}
                </span>
                <span className="truncate text-[13px] text-[#8E8E93]">{item.subtitle}</span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-[#C7C7CC]" />
            </button>
          </li>
        ))}
      </ul>

      {onShowAll ? (
        <button
          type="button"
          onClick={onShowAll}
          className={"p-3 text-[#0F172B] flex w-full items-center justify-center gap-1 text-[13px] font-medium disabled:cursor-default"}
        >
          Показать все
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </article>
  );
}
