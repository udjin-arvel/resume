import { useEffect, useMemo, useState } from "react";
import { ClipboardList } from "lucide-react";
import { inputClassName } from "@/components/tools/constants";
import { NativeSelect } from "@/components/ui/native-select";
import {
  ToolModalCancelButton,
  ToolModalPrimaryButton,
  ToolModalShell,
} from "./ToolModalShell";
import { ToolModalSummaryCard } from "./ToolModalSummaryCard";
import { useAssignTool, useTool } from "@/lib/api/hooks/useTools";
import { useProjects } from "@/lib/api/hooks/useProjects";
import { useAvailableWorkers } from "@/lib/api/hooks/useWorkers";
import { formatDate } from "@/lib/format";
import { showError, showSuccess } from "@/lib/toast";
import { LoadingSkeleton } from "@/components/common/LoadingSpinner";

type AssignToolSheetProps = {
  toolId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function todayFormatted(): string {
  return formatDate(new Date().toISOString());
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="mb-1.5 block text-xs font-medium text-slate-700">
      {children}
      {required ? <span className="text-red-500"> *</span> : null}
    </label>
  );
}

export function AssignToolSheet({ toolId, open, onOpenChange }: AssignToolSheetProps) {
  const [projectId, setProjectId] = useState("");
  const [responsibleUserId, setResponsibleUserId] = useState("");

  const toolQuery = useTool(toolId ?? "");
  const projectsQuery = useProjects({ pageSize: 100, status: "active" });
  const workersQuery = useAvailableWorkers(projectId || undefined);
  const assignMutation = useAssignTool(toolId ?? "");

  const selectedProject = useMemo(
    () => (projectsQuery.data?.items ?? []).find((p) => p.id === projectId),
    [projectsQuery.data?.items, projectId],
  );

  const plannedReturnDisplay = selectedProject?.endDate
    ? formatDate(selectedProject.endDate)
    : "—";

  useEffect(() => {
    if (!open) {
      setProjectId("");
      setResponsibleUserId("");
    }
  }, [open]);

  useEffect(() => {
    setResponsibleUserId("");
  }, [projectId]);

  const handleClose = () => onOpenChange(false);

  const handleAssign = async () => {
    if (!toolId || !projectId || !responsibleUserId) return;
    try {
      await assignMutation.mutateAsync({ projectId, responsibleUserId });
      showSuccess("Инструмент назначен на проект");
      handleClose();
    } catch (error) {
      showError(error);
    }
  };

  const tool = toolQuery.data;
  const canSubmit = !!projectId && !!responsibleUserId && !assignMutation.isPending;

  return (
    <ToolModalShell
      open={open}
      onClose={handleClose}
      title="Назначить на проект"
      description="Выберите проект и ответственного работника для выдачи инструмента."
      footer={
        <>
          <ToolModalCancelButton onClick={handleClose} disabled={assignMutation.isPending} />
          <ToolModalPrimaryButton
            onClick={() => void handleAssign()}
            disabled={!canSubmit}
          >
            <ClipboardList className="h-4 w-4" />
            {assignMutation.isPending ? "Назначение…" : "Назначить"}
          </ToolModalPrimaryButton>
        </>
      }
    >
      {toolQuery.isLoading ? (
        <LoadingSkeleton rows={3} />
      ) : tool ? (
        <>
          <ToolModalSummaryCard tool={tool} />

          <div>
            <FieldLabel required>Проект</FieldLabel>
            <NativeSelect value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              <option value="">Выберите проект</option>
              {(projectsQuery.data?.items ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </NativeSelect>
          </div>

          <div>
            <FieldLabel required>Ответственный</FieldLabel>
            <NativeSelect
              value={responsibleUserId}
              onChange={(e) => setResponsibleUserId(e.target.value)}
              disabled={!projectId || workersQuery.isLoading}
            >
              <option value="">Выберите работника</option>
              {(workersQuery.data ?? []).map((w) => (
                <option key={w.id} value={w.id}>
                  {[w.firstName, w.lastName].filter(Boolean).join(" ").trim() || w.email}
                </option>
              ))}
            </NativeSelect>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel required>Выдан</FieldLabel>
              <input
                type="text"
                readOnly
                value={todayFormatted()}
                className={`${inputClassName} bg-slate-50 text-slate-600`}
              />
            </div>
            <div>
              <FieldLabel required>План возврата</FieldLabel>
              <input
                type="text"
                readOnly
                value={plannedReturnDisplay}
                className={`${inputClassName} bg-slate-50 text-slate-600`}
              />
            </div>
          </div>
        </>
      ) : (
        <p className="text-sm text-slate-500">Не удалось загрузить данные инструмента</p>
      )}
    </ToolModalShell>
  );
}
