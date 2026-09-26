import { AlertTriangle, CheckCircle2, ClipboardList, Undo2 } from "lucide-react";
import { getFooterVariant } from "@/components/tools/list/toolCardDisplay";
import type { ToolDetail } from "@/lib/api/tools";
import { hasReportedProblem } from "./toolDetailDisplay";

type ToolDetailFooterProps = {
  tool: ToolDetail;
  onAssign: () => void;
  onReturn: () => void;
  onProblem: () => void;
  onResolve: () => void;
  resolvePending?: boolean;
};

export function ToolDetailFooter({
  tool,
  onAssign,
  onReturn,
  onProblem,
  onResolve,
  resolvePending = false,
}: ToolDetailFooterProps) {
  const variant = getFooterVariant(tool);
  const reportedProblem = hasReportedProblem(tool);

  if (variant === "written_off") {
    return (
      <div className="sticky bottom-0 z-10 border-t border-slate-200 bg-[#F8F9FB] px-5 py-4">
        <p className="text-center text-sm text-slate-500">Инструмент списан</p>
      </div>
    );
  }

  const problemButton = reportedProblem ? (
    <button
      type="button"
      onClick={onResolve}
      disabled={resolvePending}
      className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-emerald-200 bg-white px-4 py-3 text-sm font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
    >
      <CheckCircle2 className="h-4 w-4" />
      Проблема решена
    </button>
  ) : (
    <button
      type="button"
      onClick={onProblem}
      className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-amber-300 bg-white px-4 py-3 text-sm font-medium text-amber-700 hover:bg-amber-50"
    >
      <AlertTriangle className="h-4 w-4" />
      Проблема
    </button>
  );

  if (variant === "assigned") {
    return (
      <div className="sticky bottom-0 z-10 grid grid-cols-2 gap-3 border-t border-slate-200 bg-[#F8F9FB] px-5 py-4">
        <button
          type="button"
          onClick={onReturn}
          className="inline-flex items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 hover:bg-slate-50"
        >
          <Undo2 className="h-4 w-4" />
          Вернуть
        </button>
        {problemButton}
      </div>
    );
  }

  if (variant === "available" || variant === "attention" || variant === "overdue") {
    return (
      <div className="sticky bottom-0 z-10 space-y-2 border-t border-slate-200 bg-[#F8F9FB] px-5 py-4">
        <button
          type="button"
          onClick={onAssign}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800"
        >
          <ClipboardList className="h-4 w-4" />
          Назначить на проект
        </button>
        {problemButton}
      </div>
    );
  }

  return null;
}
