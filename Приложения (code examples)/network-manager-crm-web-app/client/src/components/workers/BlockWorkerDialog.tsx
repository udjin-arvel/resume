import { useEffect, useState } from "react";
import {
  FormBottomSheet,
  FormBottomSheetCancel,
  FormBottomSheetPrimary,
} from "@/components/common/FormBottomSheet";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBlockWorker, useWorkerProjects } from "@/lib/api/hooks/useWorkers";
import {
  formInputClassName,
  formLabelClassName,
} from "@/lib/form-styles";
import { showError, showSuccess } from "@/lib/toast";

type BlockWorkerDialogProps = {
  workerId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function BlockWorkerDialog({ workerId, open, onOpenChange }: BlockWorkerDialogProps) {
  const [reason, setReason] = useState("");
  const [projectId, setProjectId] = useState<string>("none");
  const blockWorker = useBlockWorker();
  const projectsQuery = useWorkerProjects(workerId, open);
  const projects = projectsQuery.data ?? [];

  useEffect(() => {
    if (!open) {
      setReason("");
      setProjectId("none");
    }
  }, [open]);

  const handleSubmit = async () => {
    const trimmed = reason.trim();
    if (!trimmed) {
      showError("Укажите причину блокировки");
      return;
    }
    try {
      await blockWorker.mutateAsync({
        id: workerId,
        payload: {
          reason: trimmed,
          projectId: projectId === "none" ? undefined : projectId,
        },
      });
      showSuccess("Работник заблокирован");
      onOpenChange(false);
    } catch (err) {
      showError(err);
    }
  };

  return (
    <FormBottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Заблокировать работника"
      description="Укажите причину блокировки и при необходимости связанный проект."
      footer={
        <>
          <FormBottomSheetCancel
            onClick={() => onOpenChange(false)}
            disabled={blockWorker.isPending}
          />
          <FormBottomSheetPrimary
            onClick={() => void handleSubmit()}
            disabled={blockWorker.isPending}
            variant="destructive"
          >
            {blockWorker.isPending ? "Блокировка…" : "Заблокировать"}
          </FormBottomSheetPrimary>
        </>
      }
    >
      <div className="space-y-1.5">
        <label htmlFor="block-reason" className={formLabelClassName}>
          Причина
        </label>
        <Textarea
          id="block-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Например: нарушение техники безопасности"
          rows={3}
          className={formInputClassName}
        />
      </div>

      <div className="space-y-1.5">
        <label className={formLabelClassName}>Проект</label>
        <Select value={projectId} onValueChange={setProjectId}>
          <SelectTrigger>
            <SelectValue placeholder="Выберите проект" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Не указан</SelectItem>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </FormBottomSheet>
  );
}
