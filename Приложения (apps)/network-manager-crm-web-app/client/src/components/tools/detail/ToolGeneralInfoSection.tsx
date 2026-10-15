import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import type { ToolDetail } from "@/lib/api/tools";
import { formatDate } from "@/lib/format";

type ToolGeneralInfoSectionProps = {
  tool: ToolDetail;
};

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 py-3 last:border-0">
      <span className="text-xs text-slate-500">{label}</span>
      <div className="min-w-0 text-right text-sm font-medium text-slate-900">{children}</div>
    </div>
  );
}

export function ToolGeneralInfoSection({ tool }: ToolGeneralInfoSectionProps) {
  const assignment = tool.activeAssignment;
  if (!assignment) return null;

  return (
    <div className="rounded-[12px] border border-slate-200 bg-white px-4">
      <InfoRow label="Проект">
        <Link
          to="/projects/$projectId"
          params={{ projectId: assignment.projectId }}
          className="inline-flex items-center gap-1 text-slate-900 hover:text-slate-700"
        >
          <span className="truncate">{assignment.projectName ?? assignment.projectId}</span>
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
        </Link>
      </InfoRow>
      <InfoRow label="Ответственный">
        {assignment.responsibleName?.trim() || "—"}
      </InfoRow>
      <InfoRow label="Выдан">{formatDate(assignment.assignedAt)}</InfoRow>
      <InfoRow label="План возврата">
        {tool.plannedReturnAt ? formatDate(tool.plannedReturnAt) : "—"}
      </InfoRow>
    </div>
  );
}
