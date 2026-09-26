import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

type EmptyStateProps = {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
};

export function EmptyState({
  title = "Нет данных",
  description,
  icon: Icon = Inbox,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800">
        <Icon className="h-6 w-6" />
      </span>
      <div>
        <p className="text-[14px] font-medium text-slate-500">{title}</p>
        {description ? (
          <p className="mt-1 text-[12px] md:text-[14px] text-slate-500">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
