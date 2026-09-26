import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { LoadingSkeleton } from "@/components/common/LoadingSpinner";
import { useWorkers } from "@/lib/api/hooks/useWorkers";
import { useSendNotification } from "@/lib/api/hooks/useNotifications";
import { showError, showSuccess } from "@/lib/toast";

type SendNotificationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type WorkerRow = {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
};

function workerName(w: WorkerRow): string {
  return `${w.firstName} ${w.lastName}`.trim();
}

function RecipientSection({
  title,
  workers,
  selectedIds,
  onToggleOne,
  onToggleAll,
}: {
  title: string;
  workers: WorkerRow[];
  selectedIds: Set<string>;
  onToggleOne: (id: string, checked: boolean) => void;
  onToggleAll: (checked: boolean) => void;
}) {
  const allSelected = workers.length > 0 && workers.every((w) => selectedIds.has(w.id));
  const someSelected = workers.some((w) => selectedIds.has(w.id));

  if (workers.length === 0) {
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-900">{title}</p>
        <p className="text-sm text-slate-500">Нет активных пользователей</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-900">{title}</p>
      <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
        <Checkbox
          checked={allSelected ? true : someSelected ? "indeterminate" : false}
          onCheckedChange={(v) => onToggleAll(v === true)}
        />
        <span className="text-sm font-medium text-slate-700">Выбрать всех</span>
      </label>
      <div className="max-h-40 space-y-1 overflow-y-auto">
        {workers.map((w) => (
          <label
            key={w.id}
            className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 hover:bg-slate-50"
          >
            <Checkbox
              checked={selectedIds.has(w.id)}
              onCheckedChange={(v) => onToggleOne(w.id, v === true)}
            />
            <span className="text-sm text-slate-900">{workerName(w)}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

export function SendNotificationDialog({ open, onOpenChange }: SendNotificationDialogProps) {
  const workersQuery = useWorkers({ status: "active", pageSize: 200 });
  const sendNotification = useSendNotification();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const { supervisors, workers } = useMemo(() => {
    const items = workersQuery.data?.items ?? [];
    return {
      supervisors: items.filter((w) => w.role === "supervisor"),
      workers: items.filter((w) => w.role === "worker"),
    };
  }, [workersQuery.data]);

  useEffect(() => {
    if (!open) {
      setSelectedIds(new Set());
      setTitle("");
      setBody("");
    }
  }, [open]);

  const toggleOne = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const toggleGroup = (group: WorkerRow[], checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const w of group) {
        if (checked) next.add(w.id);
        else next.delete(w.id);
      }
      return next;
    });
  };

  const canSubmit =
    selectedIds.size > 0 && title.trim().length > 0 && body.trim().length > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    try {
      await Promise.all(
        [...selectedIds].map((userId) =>
          sendNotification.mutateAsync({
            userId,
            title: title.trim(),
            body: body.trim(),
          }),
        ),
      );
      showSuccess("Уведомления отправлены");
      onOpenChange(false);
    } catch (e) {
      showError(e);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Отправить уведомление</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="notify-title">Заголовок</Label>
            <Input
              id="notify-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="notify-body">Текст</Label>
            <Textarea
              id="notify-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
            />
          </div>

          {workersQuery.isLoading ? (
            <LoadingSkeleton rows={4} />
          ) : workersQuery.isError ? (
            <p className="text-sm text-red-600">Не удалось загрузить список работников</p>
          ) : (
            <>
              <RecipientSection
                title="Супервайзеры"
                workers={supervisors}
                selectedIds={selectedIds}
                onToggleOne={toggleOne}
                onToggleAll={(checked) => toggleGroup(supervisors, checked)}
              />
              <RecipientSection
                title="Рабочие"
                workers={workers}
                selectedIds={selectedIds}
                onToggleOne={toggleOne}
                onToggleAll={(checked) => toggleGroup(workers, checked)}
              />
            </>
          )}
        </div>

        <div className="mt-2 pt-2">
          <button
            type="button"
            disabled={!canSubmit || sendNotification.isPending}
            onClick={handleSubmit}
            className="flex w-full items-center justify-center rounded-full bg-[#009966] py-3.5 text-base font-semibold text-white hover:bg-[#008855] disabled:opacity-60"
          >
            Отправить уведомление
          </button>
          <button
            type="button"
            disabled={sendNotification.isPending}
            onClick={() => onOpenChange(false)}
            className="mt-2 w-full rounded-full border border-gray-200 bg-white py-3.5 text-base font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            Отмена
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
