import { Link } from "@tanstack/react-router";
import { Clock } from "lucide-react";
import type { ToolDetail } from "@/lib/api/tools";
import { formatAssignmentSubtitle } from "./toolDetailDisplay";

type ToolAssignmentHistoryProps = {
  history: NonNullable<ToolDetail["assignmentHistory"]>;
};

export function ToolAssignmentHistory({ history }: ToolAssignmentHistoryProps) {
  if (history.length === 0) return null;

  return (
    <section>
      <h2 className="mb-2 px-1 text-[14px] font-semibold text-slate-500">История выдачи</h2>
      <ul className="space-y-2">
        {history.map((item) => (
          <li key={item.id}>
            <Link
              to="/projects/$projectId"
              params={{ projectId: item.projectId }}
              className="card-hover flex items-start gap-3 rounded-[12px] border border-slate-200 bg-white p-3"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500">
                <Clock className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {item.projectName ?? "Проект"}
                </p>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {formatAssignmentSubtitle(item)}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
