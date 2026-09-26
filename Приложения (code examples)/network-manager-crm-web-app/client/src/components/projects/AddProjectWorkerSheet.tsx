import { useEffect, useMemo, useState } from "react";
import type { z } from "zod";
import {
  FormBottomSheet,
  FormBottomSheetCancel,
  FormBottomSheetPrimary,
} from "@/components/common/FormBottomSheet";
import { ProjectSummaryCard } from "@/components/projects/ProjectSummaryCard";
import { toWorkerPickerOption, WorkerPickerField } from "@/components/projects/WorkerPickerField";
import {
  useAssignProjectWorkersBatch,
  useSetProjectSupervisor,
  useSupervisorCandidates,
} from "@/lib/api/hooks/useProjects";
import { useAvailableWorkers } from "@/lib/api/hooks/useWorkers";
import type { projectSchema } from "@/lib/api/schemas";
import { formatMoney } from "@/lib/format";
import { showError, showSuccess } from "@/lib/toast";

type Project = z.infer<typeof projectSchema>;
export type AddProjectWorkerMode = "worker" | "supervisor";

type AddProjectWorkerSheetProps = {
  projectId: string;
  project: Project;
  mode: AddProjectWorkerMode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function workerSubtitle(w: {
  specialization?: string;
  position?: string;
  hourlyRate?: string;
}) {
  const role = w.specialization || w.position || "Работник";
  const rate = w.hourlyRate ? `${formatMoney(w.hourlyRate)}/ч` : null;
  return rate ? `${role} · ${rate}` : role;
}

export function AddProjectWorkerSheet({
  projectId,
  project,
  mode,
  open,
  onOpenChange,
}: AddProjectWorkerSheetProps) {
  const availableQuery = useAvailableWorkers(projectId, mode === "worker" && open);
  const supervisorCandidatesQuery = useSupervisorCandidates(projectId, mode === "supervisor" && open);
  const assignBatch = useAssignProjectWorkersBatch(projectId);
  const setSupervisor = useSetProjectSupervisor(projectId);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const workerOptions = useMemo(
    () =>
      (availableQuery.data ?? []).map((w) =>
        toWorkerPickerOption(w, workerSubtitle),
      ),
    [availableQuery.data],
  );

  const supervisorGroups = useMemo(() => {
    const data = supervisorCandidatesQuery.data;
    if (!data) return [];
    return [
      {
        title: "На проекте",
        options: data.onProject.map((w) => toWorkerPickerOption(w, workerSubtitle)),
      },
      {
        title: "Добавить на проект",
        options: data.available.map((w) => toWorkerPickerOption(w, workerSubtitle)),
      },
    ].filter((g) => g.options.length > 0);
  }, [supervisorCandidatesQuery.data]);

  useEffect(() => {
    if (!open) {
      setSelectedIds([]);
    }
  }, [open, mode]);

  const canSubmit = selectedIds.length > 0;

  const handleSubmit = async () => {
    try {
      if (mode === "worker") {
        await assignBatch.mutateAsync(selectedIds);
        showSuccess(
          selectedIds.length === 1
            ? "Работник добавлен"
            : "Работники добавлены",
        );
      } else {
        await setSupervisor.mutateAsync(selectedIds[0]);
        showSuccess("Супервайзер назначен");
      }
      onOpenChange(false);
    } catch (err) {
      showError(err);
    }
  };

  const isPending = assignBatch.isPending || setSupervisor.isPending;
  const isLoading =
    mode === "worker" ? availableQuery.isLoading : supervisorCandidatesQuery.isLoading;
  const title = mode === "worker" ? "Добавить работника" : "Назначить супервайзера";
  const description =
    mode === "worker"
      ? "Выберите работника, которого нужно добавить на проект."
      : "Выберите супервайзера для этого проекта.";

  return (
    <FormBottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      footer={
        <>
          <FormBottomSheetCancel
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          />
          <FormBottomSheetPrimary
            onClick={() => void handleSubmit()}
            disabled={!canSubmit || isPending}
          >
            {isPending ? "Сохранение…" : "Добавить"}
          </FormBottomSheetPrimary>
        </>
      }
    >
      <ProjectSummaryCard name={project.name} status={project.status} />

      {mode === "worker" ? (
        <WorkerPickerField
          label="Работник"
          required
          placeholder="Выберите работников"
          options={workerOptions}
          value={selectedIds}
          onChange={setSelectedIds}
          mode="multiple"
          loading={isLoading}
        />
      ) : (
        <WorkerPickerField
          label="Супервайзер"
          required
          placeholder="Выберите супервайзера"
          groups={supervisorGroups}
          value={selectedIds}
          onChange={setSelectedIds}
          mode="single"
          loading={isLoading}
        />
      )}
    </FormBottomSheet>
  );
}
