import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { DailyReportFormSection } from "./DailyReportFormSection";
import { CrewPickerSheet } from "./CrewPickerSheet";
import { workerDisplayName } from "@/lib/project-workers";

type CrewMember = { id: string; firstName: string; lastName: string };

type DailyReportCrewSectionProps = {
  members: CrewMember[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
};

export function DailyReportCrewSection({
  members,
  selectedIds,
  onChange,
}: DailyReportCrewSectionProps) {
  const { t } = useTranslation();
  const [sheetOpen, setSheetOpen] = useState(false);

  const selectedMembers = members.filter((m) => selectedIds.includes(m.id));
  const isEmpty = selectedMembers.length === 0;

  const removeMember = (id: string) => {
    onChange(selectedIds.filter((x) => x !== id));
  };

  return (
    <>
      <DailyReportFormSection
        title={t("worker.dailyReport.section.crew")}
        isEmpty={isEmpty}
        emptyText={t("worker.dailyReport.empty.crew")}
        showAdd={isEmpty}
        onAdd={() => setSheetOpen(true)}
        headerExtra={
          !isEmpty ? (
            <span className="text-[14px] text-slate-500">
              {t("worker.dailyReport.crewCount", { count: selectedMembers.length })}
            </span>
          ) : null
        }
      >
        {!isEmpty ? (
          <div className="space-y-3">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setSheetOpen(true)}
                className="text-xs font-medium text-[#1A1C29] underline"
              >
                {t("worker.dailyReport.editCrew")}
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {selectedMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5"
                >
                  <span className="text-sm font-medium text-gray-900">
                    {workerDisplayName(member)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeMember(member.id)}
                    className="text-red-500 hover:text-red-600"
                    aria-label={t("worker.dailyReport.removeCrewMember")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </DailyReportFormSection>

      <CrewPickerSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        members={members}
        selectedIds={selectedIds}
        onConfirm={onChange}
      />
    </>
  );
}
