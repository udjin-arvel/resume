import { useEffect, useState } from "react";
import { Send } from "lucide-react";
import { inputClassName } from "@/components/tools/constants";
import { NativeSelect } from "@/components/ui/native-select";
import {
  ToolModalCancelButton,
  ToolModalPrimaryButton,
  ToolModalShell,
} from "./ToolModalShell";
import { ToolModalSummaryCard } from "./ToolModalSummaryCard";
import { toolProblemTypes, type ToolProblemType } from "./toolProblemTypes";
import { useReportToolProblem, useTool } from "@/lib/api/hooks/useTools";
import { showError, showSuccess } from "@/lib/toast";
import { LoadingSkeleton } from "@/components/common/LoadingSpinner";

type ReportToolProblemSheetProps = {
  toolId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="mb-1.5 block text-xs font-medium text-slate-700">
      {children}
      {required ? <span className="text-red-500"> *</span> : null}
    </label>
  );
}

export function ReportToolProblemSheet({
  toolId,
  open,
  onOpenChange,
}: ReportToolProblemSheetProps) {
  const [problemType, setProblemType] = useState<ToolProblemType | "">("");
  const [comment, setComment] = useState("");

  const toolQuery = useTool(toolId ?? "");
  const reportMutation = useReportToolProblem(toolId ?? "");

  useEffect(() => {
    if (!open) {
      setProblemType("");
      setComment("");
    }
  }, [open]);

  const handleClose = () => onOpenChange(false);

  const handleSubmit = async () => {
    if (!toolId || !problemType) return;
    try {
      await reportMutation.mutateAsync({ problemType, comment });
      showSuccess("Сообщение о проблеме отправлено");
      handleClose();
    } catch (error) {
      showError(error);
    }
  };

  const tool = toolQuery.data;
  const canSubmit = !!problemType && !reportMutation.isPending;

  return (
    <ToolModalShell
      open={open}
      onClose={handleClose}
      title="Сообщить о проблеме"
      description="Менеджер получит уведомление о неисправности инструмента и примет меры"
      footer={
        <>
          <ToolModalCancelButton onClick={handleClose} disabled={reportMutation.isPending} />
          <ToolModalPrimaryButton
            onClick={() => void handleSubmit()}
            disabled={!canSubmit}
          >
            <Send className="h-4 w-4" />
            {reportMutation.isPending ? "Отправка…" : "Отправить"}
          </ToolModalPrimaryButton>
        </>
      }
    >
      {toolQuery.isLoading ? (
        <LoadingSkeleton rows={3} />
      ) : tool ? (
        <>
          <ToolModalSummaryCard tool={tool} showDualBadges />

          <div>
            <FieldLabel required>Проблема</FieldLabel>
            <NativeSelect
              value={problemType}
              onChange={(e) => setProblemType(e.target.value as ToolProblemType)}
            >
              <option value="">Выберите проблему</option>
              {toolProblemTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </NativeSelect>
          </div>

          <div>
            <FieldLabel>Комментарий</FieldLabel>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Уточните причину для сотрудника"
              rows={3}
              className={`${inputClassName} resize-none`}
            />
          </div>
        </>
      ) : (
        <p className="text-sm text-slate-500">Не удалось загрузить данные инструмента</p>
      )}
    </ToolModalShell>
  );
}
