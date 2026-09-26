import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import type { z } from "zod";
import {
  FormBottomSheet,
  FormBottomSheetCancel,
  FormBottomSheetPrimary,
} from "@/components/common/FormBottomSheet";
import { toToolPickerOption, ToolPickerField } from "@/components/projects/ToolPickerField";
import { WorkerPickerField } from "@/components/projects/WorkerPickerField";
import { useAssignToolsToProject, useTools } from "@/lib/api/hooks/useTools";
import { fetchProject } from "@/lib/api/projects";
import { queryKeys } from "@/lib/api/query-keys";
import type { projectSchema, projectWorkerSchema } from "@/lib/api/schemas";
import { formatMoney } from "@/lib/format";
import { formatWorkerPositionLabel } from "@/lib/constants/worker-specializations";
import { showError, showSuccess } from "@/lib/toast";

type Project = z.infer<typeof projectSchema>;
type ProjectWorker = z.infer<typeof projectWorkerSchema>;

type AddProjectToolSheetProps = {
  projectId: string;
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function workerSubtitle(
  w: Pick<ProjectWorker, "specialization" | "position" | "hourlyRate" | "role">,
  t: ReturnType<typeof useTranslation>["t"],
) {
  const role =
    formatWorkerPositionLabel(w.position, t) ||
    (w.role === "supervisor" ? t("worker.profile.role.supervisor") : t("workers.defaultRole"));
  const rate = w.hourlyRate ? `${formatMoney(w.hourlyRate)}/ч` : null;
  return rate ? `${role} · ${rate}` : role;
}

export function AddProjectToolSheet({
  projectId,
  project,
  open,
  onOpenChange,
}: AddProjectToolSheetProps) {
  const { t } = useTranslation();
  const availableQuery = useTools(
    { status: "available", pageSize: 100 },
    { enabled: open },
  );
  const projectWorkersQuery = useQuery({
    queryKey: [...queryKeys.projects.detail(projectId), "assign-tool-workers"],
    queryFn: () => fetchProject(projectId),
    enabled: open && !!projectId,
    select: (data) => data.projectWorkers ?? [],
  });
  const assignTools = useAssignToolsToProject(projectId);
  const [selectedToolIds, setSelectedToolIds] = useState<string[]>([]);
  const [responsibleUserId, setResponsibleUserId] = useState<string[]>([]);

  const toolOptions = useMemo(
    () => (availableQuery.data?.items ?? []).map(toToolPickerOption),
    [availableQuery.data],
  );

  const workerOptions = useMemo(() => {
    const crew = projectWorkersQuery.data ?? project.projectWorkers ?? [];
    const seen = new Set<string>();
    return crew
      .filter((w) => {
        if (!w.userId || seen.has(w.userId)) return false;
        seen.add(w.userId);
        return true;
      })
      .map((w) => ({
        id: w.userId,
        firstName: w.firstName,
        lastName: w.lastName,
        subtitle: workerSubtitle(w, t),
      }));
  }, [projectWorkersQuery.data, project.projectWorkers, t]);

  useEffect(() => {
    if (!open) {
      setSelectedToolIds([]);
      setResponsibleUserId([]);
    }
  }, [open]);

  const canSubmit =
    selectedToolIds.length > 0 && responsibleUserId.length > 0 && !assignTools.isPending;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    try {
      await assignTools.mutateAsync({
        toolIds: selectedToolIds,
        responsibleUserId: responsibleUserId[0],
      });
      showSuccess(
        selectedToolIds.length === 1
          ? "Инструмент добавлен"
          : `Инструменты добавлены (${selectedToolIds.length})`,
      );
      onOpenChange(false);
    } catch (err) {
      showError(err);
    }
  };

  return (
    <FormBottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Добавить инструмент"
      description="Выберите инструменты, которые нужно добавить на объект."
      footer={
        <>
          <FormBottomSheetCancel
            onClick={() => onOpenChange(false)}
            disabled={assignTools.isPending}
          />
          <FormBottomSheetPrimary
            onClick={() => void handleSubmit()}
            disabled={!canSubmit}
          >
            {assignTools.isPending ? "Сохранение…" : "Добавить"}
          </FormBottomSheetPrimary>
        </>
      }
    >
      <WorkerPickerField
        label="Ответственный"
        required
        placeholder="Выберите ответственного"
        options={workerOptions}
        value={responsibleUserId}
        onChange={setResponsibleUserId}
        mode="single"
        loading={projectWorkersQuery.isLoading}
        emptyMessage="На проекте нет работников"
      />

      <ToolPickerField
        label="Инструмент"
        required
        placeholder="Выберите инструменты"
        options={toolOptions}
        value={selectedToolIds}
        onChange={setSelectedToolIds}
        mode="multiple"
        loading={availableQuery.isLoading}
      />
    </FormBottomSheet>
  );
}
