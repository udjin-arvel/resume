import { useEffect, useMemo, useState } from "react";
import type { z } from "zod";
import { Circle } from "lucide-react";
import {
  FormBottomSheet,
  FormBottomSheetCancel,
  FormBottomSheetPrimary,
} from "@/components/common/FormBottomSheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { SearchInput } from "@/components/common/SearchInput";
import {
  FORM_RADIUS,
  formInputClassName,
  formLabelClassName,
} from "@/lib/form-styles";
import { useSendProjectNotifications } from "@/lib/api/hooks/useProjects";
import type { projectSchema } from "@/lib/api/schemas";
import {
  filterWorkersBySearch,
  groupProjectWorkers,
  workerDisplayName,
  workerSubtitle,
  type ProjectWorker,
} from "@/lib/project-workers";
import { showError, showSuccess } from "@/lib/toast";

type Project = z.infer<typeof projectSchema>;
export type NotifyProjectWorkersMode = "all" | "one";

type NotifyProjectWorkersSheetProps = {
  projectId: string;
  project: Project;
  workers: ProjectWorker[];
  mode: NotifyProjectWorkersMode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function WorkerSection({
  title,
  workers,
  mode,
  selectedIds,
  onToggle,
  onSelectOne,
}: {
  title: string;
  workers: ProjectWorker[];
  mode: NotifyProjectWorkersMode;
  selectedIds: string[];
  onToggle: (userId: string) => void;
  onSelectOne: (userId: string) => void;
}) {
  if (workers.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </p>
      <ul className="space-y-1">
        {workers.map((w) => {
          const selected = selectedIds.includes(w.userId);
          return (
            <li key={w.userId}>
              {mode === "all" ? (
                <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-50">
                  <Checkbox
                    checked={selected}
                    onCheckedChange={() => onToggle(w.userId)}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-900">
                      {workerDisplayName(w)}
                    </span>
                    <span className="block truncate text-xs text-slate-500">
                      {workerSubtitle(w)}
                    </span>
                  </span>
                </label>
              ) : (
                <button
                  type="button"
                  onClick={() => onSelectOne(w.userId)}
                  className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-slate-50 ${
                    selected ? "bg-slate-50 ring-1 ring-slate-200" : ""
                  }`}
                >
                  <span
                    className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border ${
                      selected
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-300 text-transparent"
                    }`}
                  >
                    <Circle className="h-2 w-2 fill-current" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-900">
                      {workerDisplayName(w)}
                    </span>
                    <span className="block truncate text-xs text-slate-500">
                      {workerSubtitle(w)}
                    </span>
                  </span>
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function NotifyProjectWorkersSheet({
  projectId,
  project,
  workers,
  mode,
  open,
  onOpenChange,
}: NotifyProjectWorkersSheetProps) {
  const sendNotifications = useSendProjectNotifications(projectId);
  const [search, setSearch] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const allUserIds = useMemo(
    () => workers.map((w) => w.userId),
    [workers],
  );

  useEffect(() => {
    if (!open) {
      setSearch("");
      setTitle("");
      setBody("");
      setSelectedIds([]);
      return;
    }
    setSelectedIds(mode === "all" ? allUserIds : []);
  }, [open, mode, allUserIds]);

  const filteredWorkers = useMemo(
    () => filterWorkersBySearch(workers, search),
    [workers, search],
  );
  const { supervisors, crew } = useMemo(
    () => groupProjectWorkers(filteredWorkers),
    [filteredWorkers],
  );

  const hasRecipients = selectedIds.length > 0;
  const canSubmit = hasRecipients && body.trim().length > 0 && !sendNotifications.isPending;

  const toggleWorker = (userId: string) => {
    setSelectedIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  };

  const selectOne = (userId: string) => {
    setSelectedIds([userId]);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    try {
      const result = await sendNotifications.mutateAsync({
        userIds: selectedIds,
        title: title.trim() || undefined,
        body: body.trim(),
      });
      showSuccess(
        result.sent === 1
          ? "Уведомление отправлено"
          : `Уведомления отправлены (${result.sent})`,
      );
      onOpenChange(false);
    } catch (err) {
      showError(err);
    }
  };

  const sheetTitle =
    mode === "all" ? "Уведомить работников" : "Уведомить одного";
  const emptyList = supervisors.length === 0 && crew.length === 0;

  return (
    <FormBottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={sheetTitle}
      description="Выберите получателей и введите текст уведомления."
      contentClassName="max-h-[90vh]"
      footer={
        <>
          <FormBottomSheetCancel
            onClick={() => onOpenChange(false)}
            disabled={sendNotifications.isPending}
          />
          <FormBottomSheetPrimary
            onClick={() => void handleSubmit()}
            disabled={!canSubmit}
          >
            {sendNotifications.isPending ? "Отправка…" : "Отправить"}
          </FormBottomSheetPrimary>
        </>
      }
    >
      <div className={`${FORM_RADIUS} border border-slate-200 bg-white px-4 py-3`}>
        <p className="truncate text-[13px] font-medium text-slate-900">{project.name}</p>
      </div>

      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Поиск работников"
      />

      <div className="space-y-1.5">
        <label htmlFor="notify-title" className={formLabelClassName}>
          Заголовок (необязательно)
        </label>
        <Input
          id="notify-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Заголовок (необязательно)"
          className={formInputClassName}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="notify-body" className={formLabelClassName}>
          Текст сообщения
        </label>
        <Textarea
          id="notify-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Введите текст уведомления"
          rows={3}
          className={formInputClassName}
        />
      </div>

      <div className="space-y-1.5">
        <label className={formLabelClassName}>
          {mode === "all" ? "Выберите получателей" : "Выберите получателя"}
        </label>

        {workers.length === 0 ? (
          <p className={`${FORM_RADIUS} border border-dashed border-slate-200 px-4 py-6 text-center text-xs text-slate-500`}>
            На проекте нет работников
          </p>
        ) : emptyList ? (
          <p className={`${FORM_RADIUS} border border-dashed border-slate-200 px-4 py-6 text-center text-xs text-slate-500`}>
            Никого не найдено
          </p>
        ) : (
          <div className={`max-h-56 space-y-4 overflow-y-auto ${FORM_RADIUS} border border-slate-200 p-2`}>
            <WorkerSection
              title="Супервайзеры"
              workers={supervisors}
              mode={mode}
              selectedIds={selectedIds}
              onToggle={toggleWorker}
              onSelectOne={selectOne}
            />
            <WorkerSection
              title="Работники"
              workers={crew}
              mode={mode}
              selectedIds={selectedIds}
              onToggle={toggleWorker}
              onSelectOne={selectOne}
            />
          </div>
        )}
      </div>
    </FormBottomSheet>
  );
}
