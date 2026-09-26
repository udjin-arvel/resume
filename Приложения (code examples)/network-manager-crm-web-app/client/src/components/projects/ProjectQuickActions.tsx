import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export type ProjectQuickAction = {
  id: string;
  icon: LucideIcon;
  label: string | ReactNode;
  onClick?: () => void;
  badge?: number;
  disabled?: boolean;
};

type ProjectQuickActionsProps = {
  actions: ProjectQuickAction[];
};

export function ProjectQuickActions({ actions }: ProjectQuickActionsProps) {
  return (
    <div className="flex gap-3">
      {actions.map(({ id, icon: Icon, label, onClick, badge, disabled }) => (
        <button
          key={id}
          type="button"
          onClick={onClick}
          disabled={disabled}
          className={`card-hover relative flex flex-1 flex-col gap-2 rounded-[12px] border border-[#E2E8F0] bg-white p-3 text-left ${
            disabled ? "cursor-not-allowed opacity-50" : ""
          }`}
        >
          {badge != null ? (
            <span className="absolute right-2 top-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#90A1B9] px-1 text-[10px] font-semibold leading-none text-white">
              {badge}
            </span>
          ) : null}
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[12px] bg-[#111827] text-white">
            <Icon className="h-4 w-4" />
          </span>
          <span className="text-[14px] font-medium leading-tight text-[#111827]">{label}</span>
        </button>
      ))}
    </div>
  );
}
