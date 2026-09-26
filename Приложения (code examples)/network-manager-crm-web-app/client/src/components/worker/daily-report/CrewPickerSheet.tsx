import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FormBottomSheet,
  FormBottomSheetCancel,
  FormBottomSheetPrimary,
} from "@/components/common/FormBottomSheet";
import { workerDisplayName } from "@/lib/project-workers";

type CrewMember = { id: string; firstName: string; lastName: string };

type CrewPickerSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: CrewMember[];
  selectedIds: string[];
  onConfirm: (ids: string[]) => void;
};

export function CrewPickerSheet({
  open,
  onOpenChange,
  members,
  selectedIds,
  onConfirm,
}: CrewPickerSheetProps) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<string[]>(selectedIds);

  useEffect(() => {
    if (open) setDraft(selectedIds);
  }, [open, selectedIds]);

  const toggle = (id: string) => {
    setDraft((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  return (
    <FormBottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t("worker.dailyReport.crewPickerTitle")}
      footer={
        <>
          <FormBottomSheetCancel onClick={() => onOpenChange(false)} />
          <FormBottomSheetPrimary
            onClick={() => {
              onConfirm(draft);
              onOpenChange(false);
            }}
          >
            {t("worker.dailyReport.crewPickerConfirm")}
          </FormBottomSheetPrimary>
        </>
      }
    >
      <div className="space-y-2">
        {members.map((member) => {
          const checked = draft.includes(member.id);
          return (
            <label
              key={member.id}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 text-sm ${
                checked ? "border-slate-900 bg-slate-50" : "border-gray-200"
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(member.id)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span className="font-medium text-gray-900">{workerDisplayName(member)}</span>
            </label>
          );
        })}
        {members.length === 0 ? (
          <p className="py-4 text-center text-[12px] md:text-[14px] text-gray-400">
            {t("worker.dailyReport.crewEmpty")}
          </p>
        ) : null}
      </div>
    </FormBottomSheet>
  );
}
