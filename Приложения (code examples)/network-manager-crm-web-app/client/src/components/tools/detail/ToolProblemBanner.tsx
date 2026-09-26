import { AlertTriangle } from "lucide-react";
import { getToolProblemLabel } from "@/components/tools/modals/toolProblemTypes";
import type { ToolDetail } from "@/lib/api/tools";
import { formatDate } from "@/lib/format";
import { hasReportedProblem } from "./toolDetailDisplay";

type ToolProblemBannerProps = {
  tool: ToolDetail;
};

export function ToolProblemBanner({ tool }: ToolProblemBannerProps) {
  if (!hasReportedProblem(tool)) return null;

  const problemLabel = tool.problemType ? getToolProblemLabel(tool.problemType) : "Сообщена проблема";
  const reportedAt = tool.problemReportedAt ? formatDate(tool.problemReportedAt) : null;

  return (
    <div className="rounded-[12px] border border-amber-200 bg-amber-50 px-4 py-3">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium text-amber-900">{problemLabel}</p>
          {tool.problemComment ? (
            <p className="text-sm text-amber-800">{tool.problemComment}</p>
          ) : null}
          {reportedAt ? (
            <p className="text-xs text-amber-700">Сообщено: {reportedAt}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
