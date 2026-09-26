import { ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type ProfileDocumentRowProps = {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  onClick?: () => void;
};

export function ProfileDocumentRow({ title, subtitle, icon: Icon, onClick }: ProfileDocumentRowProps) {
  const interactive = Boolean(onClick);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!interactive}
      className="flex w-full items-center justify-between border-b border-slate-100 p-3 text-left transition-colors last:border-b-0 disabled:cursor-default disabled:opacity-100 enabled:hover:bg-[#F1F5F9]"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-[8px] bg-slate-100 text-slate-600">
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex min-w-0 flex-col">
          <span className="text-sm font-medium text-slate-900">{title}</span>
          <span className="truncate text-xs text-slate-500">{subtitle}</span>
        </div>
      </div>
      {interactive ? <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" /> : null}
    </button>
  );
}
