import { Undo2 } from "lucide-react";
import { getValidityLabel } from "@/components/tools/list/toolCardDisplay";
import {
  ToolModalCancelButton,
  ToolModalPrimaryButton,
  ToolModalShell,
} from "./ToolModalShell";
import { ToolModalDateGrid } from "./ToolModalDateGrid";
import { ToolModalSummaryCard } from "./ToolModalSummaryCard";
import { useReturnTool, useTool } from "@/lib/api/hooks/useTools";
import { formatDate } from "@/lib/format";
import { showError, showSuccess } from "@/lib/toast";
import { LoadingSkeleton } from "@/components/common/LoadingSpinner";

type ReturnToolSheetProps = {
  toolId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ReturnToolSheet({ toolId, open, onOpenChange }: ReturnToolSheetProps) {
  const toolQuery = useTool(toolId ?? "");
  const returnMutation = useReturnTool(toolId ?? "");

  const handleClose = () => onOpenChange(false);

  const handleReturn = async () => {
    if (!toolId) return;
    try {
      await returnMutation.mutateAsync({ conditionOnReturn: "" });
      showSuccess("Инструмент возвращён");
      handleClose();
    } catch (error) {
      showError(error);
    }
  };

  const tool = toolQuery.data;

  return (
    <ToolModalShell
      open={open}
      onClose={handleClose}
      title="Вернуть инструмент"
      description="Подтвердите возврат инструмента с проекта на склад."
      footer={
        <>
          <ToolModalCancelButton onClick={handleClose} disabled={returnMutation.isPending} />
          <ToolModalPrimaryButton
            onClick={() => void handleReturn()}
            disabled={returnMutation.isPending || (!tool?.activeAssignment && tool?.status !== "assigned")}
          >
            <Undo2 className="h-4 w-4" />
            {returnMutation.isPending ? "Возврат…" : "Вернуть"}
          </ToolModalPrimaryButton>
        </>
      }
    >
      {toolQuery.isLoading ? (
        <LoadingSkeleton rows={3} />
      ) : tool ? (
        <>
          <ToolModalSummaryCard tool={tool} />

          {tool.activeAssignment?.projectName ? (
            <p className="text-sm text-slate-600">{tool.activeAssignment.projectName}</p>
          ) : null}

          <div className="rounded-2xl border border-slate-200 bg-white px-3 pb-3">
            <ToolModalDateGrid
              cells={[
                {
                  label: "Выдан",
                  value: tool.activeAssignment?.assignedAt
                    ? formatDate(tool.activeAssignment.assignedAt)
                    : "—",
                },
                {
                  label: "Возврат",
                  value: tool.plannedReturnAt ? formatDate(tool.plannedReturnAt) : "—",
                },
                {
                  label: getValidityLabel(tool.controlType),
                  value: tool.calibrationDueAt ? formatDate(tool.calibrationDueAt) : "—",
                },
              ]}
            />
          </div>
        </>
      ) : (
        <p className="text-sm text-slate-500">Не удалось загрузить данные инструмента</p>
      )}
    </ToolModalShell>
  );
}
