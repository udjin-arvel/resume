import { Check } from "lucide-react";
import { FORM_RADIUS } from "@/lib/form-styles";
import type { ControlType } from "./constants";

type ControlTypeRadioCardProps = {
  id: ControlType;
  label: string;
  hint: string;
  active: boolean;
  onSelect: (id: ControlType) => void;
};

export function ControlTypeRadioCard({
  id,
  label,
  hint,
  active,
  onSelect,
}: ControlTypeRadioCardProps) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(id)}
        className={`grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 ${FORM_RADIUS} border px-3.5 py-3 text-left transition ${
          active
            ? "border-slate-900 bg-slate-900/[0.03]"
            : "border-slate-200 bg-white hover:bg-slate-50"
        }`}
      >
        <span
          className={`grid h-5 w-5 place-items-center rounded-full border-2 ${
            active ? "border-slate-900" : "border-slate-300"
          }`}
        >
          {active ? <span className="h-2 w-2 rounded-full bg-slate-900" /> : null}
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-medium text-slate-900">{label}</span>
          <span className="block text-xs text-slate-500">{hint}</span>
        </span>
        {active ? <Check className="h-4 w-4 text-slate-900" /> : null}
      </button>
    </li>
  );
}
