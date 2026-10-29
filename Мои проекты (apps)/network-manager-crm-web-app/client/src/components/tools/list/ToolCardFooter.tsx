import { AlertTriangle, ClipboardList, Undo2 } from "lucide-react";
import {
  getFooterText,
  type ToolCardFooterVariant,
  type ToolListItem,
} from "./toolCardDisplay";

type ToolCardFooterProps = {
  tool: ToolListItem;
  variant: ToolCardFooterVariant;
  onReturn?: () => void;
  onAssign?: () => void;
  onProblem?: () => void;
};

export function ToolCardFooter({
  tool,
  variant,
  onReturn,
  onAssign,
  onProblem,
}: ToolCardFooterProps) {
  const footerText = getFooterText(tool, variant);

  if (variant === "available") {
    return (
      <div className="border-t border-slate-100 px-3 py-2">
        <button
          type="button"
          onClick={onAssign}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800"
        >
          <ClipboardList className="h-3.5 w-3.5" />
          Назначить
        </button>
      </div>
    );
  }

  if (variant === "none" && !footerText) return null;

  return (
    <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-4 py-2.5">
      <p
        className={`min-w-0 flex-1 truncate text-xs ${
          variant === "overdue" ? "text-red-600" : "text-slate-500"
        }`}
      >
        {footerText ?? ""}
      </p>

      <div className="flex shrink-0 items-center gap-2">
        {variant === "assigned" ? (
          <>
            <button
              type="button"
              onClick={onReturn}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
            >
              <Undo2 className="h-3 w-3" />
              Вернуть
            </button>
            <button
              type="button"
              onClick={onProblem}
              className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-white px-2.5 py-1 text-[11px] font-medium text-amber-700 hover:bg-amber-50"
            >
              <AlertTriangle className="h-3 w-3" />
              Проблема
            </button>
          </>
        ) : null}

        {variant === "attention" || variant === "overdue" ? (
          <button
            type="button"
            onClick={onProblem}
            className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-white px-2.5 py-1 text-[11px] font-medium text-amber-700 hover:bg-amber-50"
          >
            <AlertTriangle className="h-3 w-3" />
            Проблема
          </button>
        ) : null}
      </div>
    </div>
  );
}
