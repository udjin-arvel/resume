import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { z } from "zod";
import {
  ChevronRight,
  Pencil,
  Plus,
  UserCog,
} from "lucide-react";
import { useInviteToProject } from "@/lib/api/hooks/useProjects";
import type { projectSchema, projectWorkerSchema } from "@/lib/api/schemas";
import { formatDate, formatMoney } from "@/lib/format";
import { formatWorkerPositionLabel } from "@/lib/constants/worker-specializations";
import { showError, showSuccess } from "@/lib/toast";
import { SectionCountBadge } from "@/components/common/SectionCountBadge";
import {
  AddProjectWorkerSheet,
  type AddProjectWorkerMode,
} from "./AddProjectWorkerSheet";

type Project = z.infer<typeof projectSchema>;
type ProjectWorker = z.infer<typeof projectWorkerSchema>;

type ProjectWorkersTabProps = {
  projectId: string;
  project: Project;
  readOnly?: boolean;
};

function workerName(w: { firstName: string; lastName: string }) {
  return `${w.firstName} ${w.lastName}`.trim();
}

function workerRoleLabel(w: ProjectWorker, t: ReturnType<typeof useTranslation>["t"]) {
  return formatWorkerPositionLabel(w.position, t);
}

function workerRateLabel(w: ProjectWorker, t: ReturnType<typeof useTranslation>["t"]) {
  const role = workerRoleLabel(w, t);
  if (w.hourlyRate) {
    return `${role} · ${formatMoney(w.hourlyRate)}/ч`;
  }
  return role;
}

function ConfirmationBadge({ status }: { status: string }) {
  const confirmed = status === "confirmed";
  if (confirmed) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 h-[19px] text-[10px] md:text-[12px] font-medium text-emerald-700">
        Подтвердил
      </span>
    );
  }
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 h-[19px] text-[10px] md:text-[12px] font-medium text-amber-700">
      Не подтвердил
    </span>
  );
}

function DarkActionButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#111827] px-3 py-1 text-[12px] md:text-[14px] font-medium text-white hover:bg-gray-800"
    >
      {children}
    </button>
  );
}

export function ProjectWorkersTab({ projectId, project, readOnly = false }: ProjectWorkersTabProps) {
  const { t } = useTranslation();
  const inviteToProject = useInviteToProject(projectId);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<AddProjectWorkerMode>("worker");

  const workers = project.projectWorkers ?? [];
  const supervisor = workers.find((w) => w.role === "supervisor");
  const crew = workers.filter((w) => w.role !== "supervisor");

  const openSheet = (mode: AddProjectWorkerMode) => {
    setSheetMode(mode);
    setSheetOpen(true);
  };

  const handleRemind = async (userId: string) => {
    try {
      await inviteToProject.mutateAsync(userId);
      showSuccess("Напоминание отправлено");
    } catch (e) {
      showError(e);
    }
  };

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3 px-1">
          <h2 className="truncate text-[14px] font-medium text-slate-500">
            Супервайзер проекта
          </h2>
          {!readOnly ? (
            supervisor ? (
              <DarkActionButton onClick={() => openSheet("supervisor")}>
                <Pencil className="h-3 w-3" />
                Изменить
              </DarkActionButton>
            ) : (
              <DarkActionButton onClick={() => openSheet("supervisor")}>
                <Plus className="h-3 w-3" />
                Назначить
              </DarkActionButton>
            )
          ) : null}
        </div>

        {supervisor ? (
          <Link
            to="/workers/$workerId"
            params={{ workerId: supervisor.userId }}
            className="card-hover block overflow-hidden rounded-[12px] border border-[#F0F0F0] bg-white"
          >
            <div className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-3 px-4 py-3.5">
              <span className="grid h-[32px] w-[32px] shrink-0 place-items-center rounded-full bg-[#155DFC] text-white">
                <UserCog className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[14px] md:text-[16px] font-medium text-[#0F172B]">
                  {workerName(supervisor)}
                </p>
                {supervisor.hourlyRate ? (
                  <p className="truncate text-[12px] md:text-[14px] text-slate-500">
                    {formatMoney(supervisor.hourlyRate)}/ч
                  </p>
                ) : null}
              </div>
              <ConfirmationBadge status={supervisor.confirmationStatus} />
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
            </div>
          </Link>
        ) : (
          <div className="rounded-[12px] border border-dashed border-[#F0F0F0] bg-white px-4 py-8 text-center text-[12px] md:text-[14px] text-slate-500">
            Не назначен
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3 px-1">
          <div className="flex min-w-0 items-center gap-2">
            <h2 className="truncate text-[14px] font-medium text-slate-500">
              Работники проекта
            </h2>
            <SectionCountBadge count={crew.length} />
          </div>
          {!readOnly ? (
            <button
              type="button"
              onClick={() => openSheet("worker")}
              className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#111827] px-3 py-1 text-[12px] md:text-[14px] font-medium text-white hover:bg-gray-800"
            >
              <Plus className="h-3 w-3" />
              Добавить
            </button>
          ) : null}
        </div>

        {crew.length === 0 ? (
          <div className="rounded-[12px] border border-dashed border-[#F0F0F0] bg-white px-4 py-8 text-center text-[12px] md:text-[14px] text-slate-500">
            Нет назначенных работников
          </div>
        ) : (
          <ul className="space-y-3">
            {crew.map((w) => {
              const confirmed = w.confirmationStatus === "confirmed";
              return (
                <li
                  key={w.id}
                  className="card-hover overflow-hidden rounded-[12px] border border-[#F0F0F0] bg-white"
                >
                  <Link
                    to="/workers/$workerId"
                    params={{ workerId: w.userId }}
                    className="block"
                  >
                    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-3 p-3">
                      <span className="grid h-[32px] w-[32px] shrink-0 place-items-center rounded-full bg-[#F1F5F9] text-[12px] font-semibold text-[#45556C]">
                        {w.firstName[0]}
                        {w.lastName[0]}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[14px] md:text-[16px] font-medium text-[#0F172B]">
                          {workerName(w)}
                        </p>
                        <p className="truncate text-[12px] md:text-[14px] text-slate-500">
                          {workerRateLabel(w, t)}
                        </p>
                      </div>
                      <ConfirmationBadge status={w.confirmationStatus} />
                      <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                    </div>
                  </Link>
                  {!confirmed && !readOnly ? (
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t border-slate-100 bg-slate-50/40 px-3 py-2">
                      <span className="truncate text-[10px] md:text-[12px] text-slate-500">
                        Приглашение отправлено{" "}
                        {formatDate(w.invitedAt ?? w.assignedAt)}
                      </span>
                      <button
                        type="button"
                        title="Напомнить работнику о подтверждении участия"
                        onClick={() => handleRemind(w.userId)}
                        disabled={inviteToProject.isPending}
                        className="flex shrink-0 cursor-pointer items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-700 transition hover:bg-white disabled:opacity-50"
                      >
                        <img src="/icons/bell.svg" alt="" className="h-3 w-3" />
                        Напомнить
                      </button>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <AddProjectWorkerSheet
        projectId={projectId}
        project={project}
        mode={sheetMode}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  );
}
