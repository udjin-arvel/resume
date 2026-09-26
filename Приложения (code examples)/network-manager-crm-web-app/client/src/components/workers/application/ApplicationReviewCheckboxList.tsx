import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

type ApplicationReviewCheckboxListProps = {
  options: readonly string[];
  labelPrefix: string;
  selected: string[];
  onChange: (next: string[]) => void;
};

export function ApplicationReviewCheckboxList({
  options,
  labelPrefix,
  selected,
  onChange,
}: ApplicationReviewCheckboxListProps) {
  const { t } = useTranslation();

  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((item) => item !== value));
      return;
    }
    onChange([...selected, value]);
  };

  return (
    <div className="space-y-2">
      {options.map((option) => {
        const checked = selected.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => toggle(option)}
            className="flex w-full items-center gap-3 rounded-xl px-1 mb-3 text-left"
          >
            <span
              className={cn(
                "grid h-5 w-5 shrink-0 place-items-center rounded-[4px] border transition-colors",
                checked
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-transparent",
              )}
            >
              <Check className="h-3.5 w-3.5" strokeWidth={3} />
            </span>
            <span className="text-[13px] text-slate-800">
              {t(`${labelPrefix}.${option}`)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
