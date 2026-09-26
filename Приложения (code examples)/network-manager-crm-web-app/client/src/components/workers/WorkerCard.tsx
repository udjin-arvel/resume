import { Link } from "@tanstack/react-router";
import { Building2, Calendar, ChevronRight, Phone } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { z } from "zod";
import type { workerSchema } from "@/lib/api/schemas";
import { projectStatusMeta, userStatusMeta } from "@/lib/constants/status";
import { formatWorkerPositionLabel } from "@/lib/constants/worker-specializations";
import { formatDate, formatMoney } from "@/lib/format";
import { getProfileInitials } from "@/lib/worker-profile";

type Worker = z.infer<typeof workerSchema>;

type WorkerCardProps = {
  worker: Worker;
};

function workerRole(w: Worker, t: ReturnType<typeof useTranslation>["t"]) {
  return formatWorkerPositionLabel(w.position, t);
}

function workerRate(w: Worker) {
  if (w.hourlyRate && w.hourlyRate !== "0") {
    return `${formatMoney(w.hourlyRate)}/ч`;
  }
  return null;
}

function StatusBadge({ status }: { status: string }) {
  const meta = userStatusMeta[status] ?? userStatusMeta.active;

  return (
    <span className={`shrink-0 rounded-full px-2 py-[2px] text-[10px] font-semibold ${meta.cls}`}>
      {meta.label}
    </span>
  );
}

function ProjectStatusBadge({ status }: { status: string }) {
  const meta = projectStatusMeta[status] ?? projectStatusMeta.active;

  return (
    <span className={`shrink-0 rounded-full px-2 py-[2px] text-[10px] font-semibold ${meta.cls}`}>
      {meta.label}
    </span>
  );
}

export function WorkerCard({ worker: w }: WorkerCardProps) {
  const { t } = useTranslation();
  const rate = workerRate(w);
  const roleLine = rate ? `${workerRole(w, t)} · ${rate}` : workerRole(w, t);
  const isPending = w.status === "pending";
  const isBlocked = w.status === "blocked";

  return (
    <Link
      to="/workers/$workerId"
      params={{ workerId: w.id }}
      className="card-hover block w-full cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white"
      aria-label={`Профиль работника ${w.firstName} ${w.lastName}`}
    >
      <div className="flex justify-between gap-3 p-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[12px] font-bold text-slate-800">
            {getProfileInitials(w.firstName, w.lastName)}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-[16px] font-bold leading-tight text-slate-900">
              {w.firstName} {w.lastName}
            </h3>
            <p className="truncate text-[12px] font-bold text-[#0F172B]">{roleLine}</p>
          </div>
        </div>
        <ChevronRight
          className="h-5 w-5 shrink-0 text-slate-400"
          aria-hidden="true"
        />
      </div>

      <div className="border-t border-slate-200" />

      <div
        className={`flex justify-between gap-4 p-3 ${isPending ? "items-center" : "items-end"}`}
      >
        {isPending ? (
          <>
            <div className="flex min-w-0 items-center gap-1 text-[12px] text-slate-500">
              <Calendar className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span className="truncate">
                {w.createdAt
                  ? `${t("worker.profile.applicationDate")} ${formatDate(w.createdAt)}`
                  : t("worker.profile.applicationDate")}
              </span>
            </div>
            <StatusBadge status={w.status} />
          </>
        ) : (
          <>
            <div className="flex min-w-0 flex-col gap-1">
              {w.phone ? (
                <div className="flex items-center gap-1 text-[12px] text-slate-500">
                  <Phone className="h-3 w-3 shrink-0" aria-hidden="true" />
                  <span className="truncate">{w.phone}</span>
                </div>
              ) : null}

              <div className="flex items-center gap-1 text-[12px] text-slate-500">
                <Calendar className="h-3 w-3 shrink-0" aria-hidden="true" />
                <span className="truncate">
                  {isBlocked
                    ? w.blockedAt
                      ? t("workers.card.notWorkingSince", { date: formatDate(w.blockedAt) })
                      : t("workers.card.notWorkingSinceUnknown")
                    : w.createdAt
                      ? `Работает с ${formatDate(w.createdAt)}`
                      : "Дата начала работы не указана"}
                </span>
              </div>

              {!isBlocked ? (
                <div className="flex min-w-0 items-center gap-1 text-[12px] text-slate-500">
                  <Building2 className="h-3 w-3 shrink-0" aria-hidden="true" />
                  <span className="truncate">{w.projectName || "Не на проекте"}</span>
                </div>
              ) : null}
            </div>

            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <StatusBadge status={w.status} />
              {!isBlocked && w.projectStatus ? (
                <ProjectStatusBadge status={w.projectStatus} />
              ) : null}
            </div>
          </>
        )}
      </div>

      {isBlocked ? (
        <>
          <div className="border-t border-slate-200" />
          <div className="px-5 py-4">
            <p className="text-[12px] text-slate-500">{t("worker.profile.blockReason")}</p>
            <p className="text-[14px] text-slate-900">
              {w.blockReason || "—"}
            </p>
          </div>
        </>
      ) : null}
    </Link>
  );
}
