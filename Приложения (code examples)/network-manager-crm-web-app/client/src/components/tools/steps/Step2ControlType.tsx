import type { ControlType } from "../constants";
import { controlOptions } from "../constants";
import { StepTitle } from "../ToolFormField";
import { ControlTypeRadioCard } from "../ControlTypeRadioCard";
import { Gauge } from "lucide-react";

type Step2ControlTypeProps = {
  controlType: ControlType;
  onSelect: (id: ControlType) => void;
};

export function Step2ControlType({ controlType, onSelect }: Step2ControlTypeProps) {
  return (
    <>
      <StepTitle icon={Gauge} title="Тип контроля" />
      <p className="-mt-2 text-xs text-slate-500">
        Определяет, какие поля и предупреждения будут отслеживаться для инструмента.
      </p>

      <ul className="space-y-2">
        {controlOptions.map((opt) => (
          <ControlTypeRadioCard
            key={opt.id}
            id={opt.id}
            label={opt.label}
            hint={opt.hint}
            active={controlType === opt.id}
            onSelect={onSelect}
          />
        ))}
      </ul>
    </>
  );
}
