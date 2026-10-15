import type { ReactNode } from "react";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

type AddButtonVariant = "dark" | "orange" | "red";

const addButtonStyles: Record<AddButtonVariant, string> = {
  dark: "bg-[#1A1C29] text-white hover:bg-[#2a2d3d]",
  orange: "bg-orange-500 text-white hover:bg-orange-600",
  red: "bg-red-500 text-white hover:bg-red-600",
};

type DailyReportFormSectionProps = {
  title: string;
  children?: ReactNode;
  emptyText?: string;
  isEmpty?: boolean;
  showAdd?: boolean;
  onAdd?: () => void;
  addVariant?: AddButtonVariant;
  headerExtra?: ReactNode;
};

export function DailyReportFormSection({
  title,
  children,
  emptyText,
  isEmpty = false,
  showAdd = false,
  onAdd,
  addVariant = "dark",
  headerExtra,
}: DailyReportFormSectionProps) {
  const { t } = useTranslation();

  return (
    <section className="mb-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-[14px] font-medium text-slate-500">{title}</h2>
        {headerExtra}
        {showAdd && onAdd ? (
          <button
            type="button"
            onClick={onAdd}
            className={cn(
              "flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              addButtonStyles[addVariant],
            )}
          >
            <Plus className="h-3.5 w-3.5" />
            {t("worker.dailyReport.add")}
          </button>
        ) : null}
      </div>
      <div className="rounded-[12px] bg-white p-3 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)]">
        {isEmpty && emptyText ? (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-8 text-center">
            <p className="text-[14px] text-gray-400">{emptyText}</p>
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  );
}
