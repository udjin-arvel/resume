import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ToolCardDateGrid } from "./ToolCardDateGrid";
import { ToolCardFooter } from "./ToolCardFooter";
import { ToolCardUsageBar } from "./ToolCardUsageBar";
import {
  getArticleLine,
  getFooterVariant,
  getMetaLine,
  getToolCardBadge,
  showUsageBar,
  type ToolListItem,
} from "./toolCardDisplay";

type ToolListCardProps = {
  tool: ToolListItem;
  variant?: "default" | "workerDetail";
  onReturn?: (toolId: string) => void;
  onProblem?: (toolId: string) => void;
  onAssign?: (toolId: string) => void;
  hideProjectName?: boolean;
  className?: string;
};

export function ToolListCard({
  tool,
  variant = "default",
  onAssign,
  onReturn,
  onProblem,
  hideProjectName = false,
  className,
}: ToolListCardProps) {
  const isWorkerDetail = variant === "workerDetail";
  const badge = getToolCardBadge(tool);
  const footerVariant = getFooterVariant(tool);
  const hasFooter = !isWorkerDetail && footerVariant !== "none";
  const hideProject = hideProjectName || isWorkerDetail;

  return (
    <article
      className={cn(
        "card-hover overflow-hidden bg-white",
        isWorkerDetail
          ? "rounded-[12px] border border-[#F0F0F0]"
          : "rounded-2xl border border-slate-200",
        className,
      )}
    >
      <Link
        to="/tools/$toolId"
        params={{ toolId: tool.id }}
        className={cn("block px-3 pt-3", isWorkerDetail ? "pb-0" : "pb-3")}
      >
        {isWorkerDetail ? (
          <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-start gap-2">
            <div className="min-w-0">
              <p className="truncate text-[14px] md:text-[16px] font-semibold text-[#0F172B ]">{tool.name}</p>
              <p className="mt-0.5 truncate text-[12px] md:text-[14px] text-slate-500">{getArticleLine(tool)}</p>
            </div>
            <span
              className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] md:text-[12px] font-medium ${badge.cls}`}
            >
              {badge.label}
            </span>
            <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
          </div>
        ) : (
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap justify-between items-center gap-2">
                <span className="truncate text-sm font-semibold text-slate-900">{tool.name}</span>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] md:text-[12px] font-medium ${badge.cls}`}
                >
                  {badge.label}
                </span>
              </div>
              <p className="mt-0.5 truncate text-[12px] md:text-[14px] text-slate-500">{getMetaLine(tool)}</p>
              {!hideProject && tool.activeAssignment?.projectName ? (
                <p className="mt-1 truncate text-[14px] md:text-[16px] text-[#0F172B]">
                  {tool.activeAssignment.projectName}
                </p>
              ) : null}
            </div>
            <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
          </div>
        )}

        <div className={cn("mt-3 -mx-4", isWorkerDetail && "mb-0")}>
          <ToolCardDateGrid tool={tool} variant={variant} />
        </div>

        {!isWorkerDetail && showUsageBar(tool) ? (
          <div className="mt-1">
            <ToolCardUsageBar tool={tool} />
          </div>
        ) : null}
      </Link>

      {hasFooter && onReturn && onProblem ? (
        <ToolCardFooter
          tool={tool}
          variant={footerVariant}
          onReturn={() => onReturn(tool.id)}
          onAssign={onAssign ? () => onAssign(tool.id) : undefined}
          onProblem={() => onProblem(tool.id)}
        />
      ) : null}
    </article>
  );
}
