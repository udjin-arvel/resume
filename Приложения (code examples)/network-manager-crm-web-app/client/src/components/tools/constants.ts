export type ControlType =
  | "accounting_only"
  | "expiry"
  | "calibration"
  | "usage_limit"
  | "combined";

export type UsageUnit = "tests" | "cleaning" | "welding";

export const controlOptions: {
  id: ControlType;
  label: string;
  hint: string;
}[] = [
  {
    id: "accounting_only",
    label: "Только учёт",
    hint: "Без сроков и лимитов. Учёт наличия и выдачи на проекты.",
  },
  {
    id: "expiry",
    label: "Срок годности",
    hint: "Контроль даты истечения",
  },
  {
    id: "calibration",
    label: "Калибровка",
    hint: "Поверка по расписанию",
  },
  {
    id: "usage_limit",
    label: "Лимит использований",
    hint: "Тесты, чистки, сварки",
  },
  {
    id: "combined",
    label: "Комбинированный",
    hint: "Калибровка + лимит",
  },
];

export const categories = [
  "Измерения",
  "Сварка",
  "Расходники",
  "Маркировка",
  "Тестирование",
  "Прочее",
];

export const usageUnits: { id: UsageUnit; label: string }[] = [
  { id: "tests", label: "Тесты" },
  { id: "cleaning", label: "Чистки" },
  { id: "welding", label: "Сварки" },
];

export function getControlTypeLabel(id: ControlType): string {
  return controlOptions.find((o) => o.id === id)?.label ?? id;
}

export function getUsageUnitLabel(id: string): string {
  return usageUnits.find((u) => u.id === id)?.label ?? id;
}

export function needsCalibrationFields(controlType: ControlType): boolean {
  return controlType === "expiry" || controlType === "calibration" || controlType === "combined";
}

export function needsUsageLimit(controlType: ControlType): boolean {
  return controlType === "usage_limit" || controlType === "combined";
}

export const step1Fields = ["name", "model", "serialNumber"] as const;
export const step2Fields = ["controlType"] as const;

export const inputClassName =
  "w-full rounded-[12px] border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-400";
