import { useState } from "react";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProjectProblem } from "./project-display";

type ProjectProblemsAccordionProps = {
  problems: ProjectProblem[];
  defaultOpen?: boolean;
  onProblemClick?: (problemId: string) => void;
};

export function ProjectProblemsAccordion({
  problems,
  defaultOpen = true,
  onProblemClick,
}: ProjectProblemsAccordionProps) {
  const [open, setOpen] = useState(defaultOpen);

  if (problems.length === 0) return null;

  return (
    <section className="overflow-hidden rounded-[12px] bg-white border border-slate-200">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between p-3 text-left"
      >
        <span className="flex items-center gap-2">
          <div className="bg-[#FEF2F2] rounded-[8px] h-[32px] w-[32px] flex items-center justify-center">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-500" />
          </div>
          <span className="text-[14px] font-medium text-[#111827]">Проблемы</span>
        </span>
        <span className="inline-flex shrink-0 h-[16px] min-w-[20px] items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white">
          {problems.length}
        </span>
      </button>

      {open ? (
        <ul className="flex flex-col border-t border-gray-50">
          {problems.map((problem) => (
            <li key={problem.id} className="border-b border-gray-50 last:border-0">
              <button
                type="button"
                onClick={() => onProblemClick?.(problem.id)}
                className={cn(
                  "flex w-full items-center gap-3 p-4 text-left",
                  onProblemClick && "hover:bg-gray-50",
                )}
              >
                <span className="min-w-0 flex-1">
                  <p className="text-[14px] text-gray-900">{problem.title}</p>
                  <p className="text-[12px] text-gray-500">{problem.description}</p>
                </span>
                {onProblemClick ? (
                  <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-gray-400" />
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
