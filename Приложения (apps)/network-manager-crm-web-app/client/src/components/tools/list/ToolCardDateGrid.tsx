import { getUsageUnitLabel } from "@/components/tools/constants";
import { formatDate } from "@/lib/format";
import { getValidityLabel, showUsageBar } from "./toolCardDisplay";
import type { ToolListItem } from "./toolCardDisplay";

type ToolCardDateGridProps = {
  tool: ToolListItem;
  variant?: "default" | "workerDetail";
};

function DateCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 py-2 text-center">
      <p className="text-[10px] text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}

export function ToolCardDateGrid({ tool, variant = "default" }: ToolCardDateGridProps) {
  const issued = tool.activeAssignment?.assignedAt
    ? formatDate(tool.activeAssignment.assignedAt)
    : "—";
  const plannedReturn = tool.plannedReturnAt ? formatDate(tool.plannedReturnAt) : "—";
  const validUntil = tool.calibrationDueAt ? formatDate(tool.calibrationDueAt) : "—";

  const returnLabel = variant === "workerDetail" ? "Вернуть до" : "План возврата";

  let thirdLabel: string;
  let thirdValue: string;

  if (variant === "workerDetail" && showUsageBar(tool)) {
    const left = tool.usageLimit - tool.usageCount;
    const unitLabel = getUsageUnitLabel(tool.usageUnit ?? "tests").toLowerCase();
    thirdLabel = "Остаток";
    thirdValue = `${left} ${unitLabel}`;
  } else if (variant === "workerDetail") {
    thirdLabel = "Годен до";
    thirdValue = validUntil;
  } else {
    thirdLabel = getValidityLabel(tool.controlType);
    thirdValue = validUntil;
  }

  return (
    <div className="grid grid-cols-3 divide-x border-y border-slate-100">
      <DateCell label="Выдан" value={issued} />
      <DateCell label={returnLabel} value={plannedReturn} />
      <DateCell label={thirdLabel} value={thirdValue} />
    </div>
  );
}
