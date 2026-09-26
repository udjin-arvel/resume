import type { z } from "zod";
import type { projectIssueSchema } from "@/lib/api/schemas";
import { useUpdateProjectIssueStatus } from "@/lib/api/hooks/useProjects";
import { projectIssueStatusLabels } from "@/lib/supervisor-report-documents";
import { showError, showSuccess } from "@/lib/toast";
import { WorkerReportDetailSection as SupervisorReportDetailSection } from "../worker-report-detail/WorkerReportDetailSection";

type ProjectIssue = z.infer<typeof projectIssueSchema>;

const statusOptions = ["open", "in_progress", "resolved"] as const;

type SupervisorReportRelatedIssueSectionProps = {
  projectId: string;
  issue: ProjectIssue;
  readOnly?: boolean;
};

export function SupervisorReportRelatedIssueSection({
  projectId,
  issue,
  readOnly = false,
}: SupervisorReportRelatedIssueSectionProps) {
  const updateStatus = useUpdateProjectIssueStatus(projectId);

  const handleStatus = async (status: string) => {
    if (readOnly || status === issue.status) return;
    try {
      await updateStatus.mutateAsync({ issueId: issue.id, status });
      showSuccess("Статус проблемы обновлён");
    } catch (err) {
      showError(err);
    }
  };

  const statusChip =
    issue.status === "resolved"
      ? "bg-emerald-50 text-emerald-700"
      : issue.status === "in_progress"
        ? "bg-blue-50 text-blue-700"
        : "bg-red-50 text-red-600";

  return (
    <SupervisorReportDetailSection title="Связанная проблема">
      <div className="px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">Проблема №{issue.number}</p>
            <p className="mt-0.5 truncate text-sm text-slate-600">{issue.title}</p>
          </div>
          <span className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusChip}`}>
            {projectIssueStatusLabels[issue.status] ?? issue.status}
          </span>
        </div>

        {!readOnly ? (
          <div className="mt-4 grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1">
            {statusOptions.map((status) => {
              const active = issue.status === status;
              return (
                <button
                  key={status}
                  type="button"
                  disabled={updateStatus.isPending}
                  onClick={() => handleStatus(status)}
                  className={`rounded-lg py-2 text-xs font-medium transition ${
                    active
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {projectIssueStatusLabels[status]}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </SupervisorReportDetailSection>
  );
}
