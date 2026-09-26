import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { getToolCardBadge } from "@/components/tools/list/toolCardDisplay";
import type { ToolDetail } from "@/lib/api/tools";

type ToolDetailHeaderProps = {
  tool: ToolDetail;
};

export function ToolDetailHeader({ tool }: ToolDetailHeaderProps) {
  const badge = getToolCardBadge(tool);

  return (
    <PageHeader>
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-3">
        <Link
          to="/tools"
          aria-label="Назад"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="truncate text-[16px] font-semibold text-slate-900">{tool.name}</h1>
        <span className={`flex items-center shrink-0 rounded-full px-2 h-[19px] text-[10px] font-medium ${badge.cls}`}>
          {badge.label}
        </span>
      </div>
    </PageHeader>
  );
}
