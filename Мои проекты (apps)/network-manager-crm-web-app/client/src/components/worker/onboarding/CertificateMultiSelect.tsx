import { Check, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  WORKER_CERTIFICATE_IDS,
  getCertificateLabel,
} from "@/lib/constants/worker-certificates";
import { onboardingSelectTriggerClassName } from "@/lib/form-styles";
import { cn } from "@/lib/utils";

type CertificateMultiSelectProps = {
  value: string[];
  onChange: (next: string[]) => void;
  hasError?: boolean;
};

export function CertificateMultiSelect({ value, onChange, hasError }: CertificateMultiSelectProps) {
  const { t } = useTranslation();

  const toggle = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((item) => item !== id));
      return;
    }
    onChange([...value, id]);
  };

  const summary =
    value.length === 0
      ? t("onboarding.certificatesPlaceholder")
      : value.length === 1
        ? getCertificateLabel(value[0], t)
        : t("onboarding.certificatesSelected", { count: value.length });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            onboardingSelectTriggerClassName,
            "flex w-full items-center justify-between text-left",
            hasError && "border-red-500 focus:border-red-500",
            value.length === 0 && "text-slate-400",
          )}
        >
          <span className="truncate">{summary}</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-3">
        <div className="space-y-1">
          {WORKER_CERTIFICATE_IDS.map((id) => {
            const checked = value.includes(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => toggle(id)}
                className="flex w-full items-center gap-3 rounded-lg px-1 py-2 text-left hover:bg-slate-50"
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
                <span className="text-[13px] text-slate-800">{getCertificateLabel(id, t)}</span>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
