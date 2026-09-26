import type { CreateToolForm } from "./schema/createToolFormSchema";
import {
  getControlTypeLabel,
  getUsageUnitLabel,
  needsCalibrationFields,
  needsUsageLimit,
  type ControlType,
} from "./constants";

type ToolFormSummaryProps = {
  values: CreateToolForm;
  controlType: ControlType;
};

function SumRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 text-xs">
      <dt className="text-slate-500">{k}</dt>
      <dd className="truncate text-right font-medium text-slate-900">{v}</dd>
    </div>
  );
}

export function ToolFormSummary({ values, controlType }: ToolFormSummaryProps) {
  const isAccountingOnly = controlType === "accounting_only";

  const modelArt =
    values.model || values.serialNumber
      ? `${values.model || "—"} · ${values.serialNumber || "—"}`
      : "—";

  const calibrationDue =
    needsCalibrationFields(controlType) && values.validUntil?.trim()
      ? formatDisplayDate(values.validUntil)
      : "—";

  const limitDisplay =
    needsUsageLimit(controlType) && values.usageLimit
      ? `${values.usageLimit} ${getUsageUnitLabel(values.usageUnit ?? "tests")}`
      : "—";

  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-[11px] uppercase tracking-wide text-slate-500">Сводка</p>
      <dl className="mt-2 space-y-1.5 text-sm">
        <SumRow k="Название" v={values.name || "—"} />
        <SumRow k="Модель / Арт." v={modelArt} />
        <SumRow k="Тип контроля" v={getControlTypeLabel(controlType)} />
        {!isAccountingOnly ? (
          <>
            <SumRow k="Калибровка до" v={calibrationDue} />
            <SumRow k="Лимит" v={limitDisplay} />
          </>
        ) : null}
      </dl>
    </section>
  );
}

function formatDisplayDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  if (y && m && d) return `${d}.${m}.${y}`;
  return iso;
}
