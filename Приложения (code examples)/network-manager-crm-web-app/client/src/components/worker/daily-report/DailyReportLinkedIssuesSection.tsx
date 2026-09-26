import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { z } from "zod";
import type { projectIssueSchema } from "@/lib/api/schemas";
import { NativeSelect } from "@/components/ui/native-select";
import { DailyReportFormSection } from "./DailyReportFormSection";

type ProjectIssue = z.infer<typeof projectIssueSchema>;

type DailyReportLinkedIssuesSectionProps = {
  visible: boolean;
  issues: ProjectIssue[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  onAdd: () => void;
  onRemove: () => void;
};

export function DailyReportLinkedIssuesSection({
  visible,
  issues,
  selectedIds,
  onChange,
  onAdd,
  onRemove,
}: DailyReportLinkedIssuesSectionProps) {
  const { t } = useTranslation();

  const selectedIssues = issues.filter((i) => selectedIds.includes(i.id));
  const availableIssues = issues.filter((i) => !selectedIds.includes(i.id));

  if (!visible) {
    return (
      <DailyReportFormSection
        title={t("worker.dailyReport.section.linkedIssue")}
        isEmpty
        emptyText={t("worker.dailyReport.empty.linkedIssue")}
        showAdd
        addVariant="dark"
        onAdd={onAdd}
      />
    );
  }

  const addIssue = (issueId: string) => {
    if (!issueId || selectedIds.includes(issueId)) return;
    onChange([...selectedIds, issueId]);
  };

  const removeIssue = (issueId: string) => {
    onChange(selectedIds.filter((id) => id !== issueId));
  };

  return (
    <DailyReportFormSection
      title={t("worker.dailyReport.section.linkedIssue")}
      headerExtra={
        <button type="button" onClick={onRemove} className="text-xs text-red-500 underline">
          {t("worker.dailyReport.removeSection")}
        </button>
      }
    >
      <div className="space-y-4">
        {availableIssues.length > 0 ? (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              {t("worker.dailyReport.field.selectLinkedIssue")}
            </label>
            <NativeSelect value="" onChange={(e) => addIssue(e.target.value)}>
              <option value="">{t("worker.dailyReport.field.selectLinkedIssuePlaceholder")}</option>
              {availableIssues.map((issue) => (
                <option key={issue.id} value={issue.id}>
                  #{issue.number} — {issue.title}
                </option>
              ))}
            </NativeSelect>
          </div>
        ) : selectedIssues.length === 0 ? (
          <p className="text-[14px] text-gray-400">{t("worker.dailyReport.noOpenIssues")}</p>
        ) : null}

        {selectedIssues.length > 0 ? (
          <div className="space-y-2">
            {selectedIssues.map((issue) => (
              <div
                key={issue.id}
                className="flex items-start justify-between gap-2 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    #{issue.number} — {issue.title}
                  </p>
                  {issue.description ? (
                    <p className="mt-0.5 truncate text-xs text-gray-500">{issue.description}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => removeIssue(issue.id)}
                  className="shrink-0 text-red-500 hover:text-red-600"
                  aria-label={t("worker.dailyReport.removeLinkedIssue")}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </DailyReportFormSection>
  );
}
