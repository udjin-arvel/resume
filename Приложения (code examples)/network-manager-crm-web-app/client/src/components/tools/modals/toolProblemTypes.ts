export type ToolProblemType =
  | "malfunction"
  | "calibration_overdue"
  | "usage_limit"
  | "lost"
  | "other";

export const toolProblemTypes: { id: ToolProblemType; label: string }[] = [
  { id: "malfunction", label: "Неисправность / поломка" },
  { id: "calibration_overdue", label: "Просрочена калибровка" },
  { id: "usage_limit", label: "Превышен лимит использований" },
  { id: "lost", label: "Утеря / не найден" },
  { id: "other", label: "Другое" },
];

export function getToolProblemLabel(id: string): string {
  return toolProblemTypes.find((t) => t.id === id)?.label ?? id;
}
