import { Calendar } from "lucide-react";
import { useTranslation } from "react-i18next";
import { userStatusMeta } from "@/lib/constants/status";
import { formatWorkerPositionLabel } from "@/lib/constants/worker-specializations";
import { formatDate, formatMoney } from "@/lib/format";
import { getProfileInitials } from "@/lib/worker-profile";
import type { Worker } from "../worker-payload";

type WorkerApplicationSummaryCardProps = {
  worker: Worker;
};

function workerRole(w: Worker, t: ReturnType<typeof useTranslation>["t"]) {
  return formatWorkerPositionLabel(w.position, t) || w.role;
}

function workerRate(w: Worker) {
  if (w.hourlyRate && w.hourlyRate !== "0") {
    return `${formatMoney(w.hourlyRate)}/ч`;
  }
  return null;
}

export function WorkerApplicationSummaryCard({ worker }: WorkerApplicationSummaryCardProps) {
  const { t } = useTranslation();
  const statusMeta = userStatusMeta[worker.status] ?? userStatusMeta.pending;
  const rate = workerRate(worker);
  const roleLine = rate ? `${workerRole(worker, t)} · ${rate}` : workerRole(worker, t);
  const initials = getProfileInitials(worker.firstName, worker.lastName);

  return (
    <div className="overflow-hidden rounded-[12px] border border-slate-200 bg-white">
      <div className="flex flex-col items-start">
        <div className="flex gap-3 p-3 items-center">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[12px] font-semibold text-slate-600">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <h2 className="truncate text-[16px] font-bold text-[#0F172B]">
                  {worker.firstName} {worker.lastName}
                </h2>
                <p className="truncate text-[12px] font-bold text-[#0F172B]">{roleLine}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="p-3 border-t border-slate-200 flex justify-between w-full min-w-0 items-center gap-1 text-[12px] text-slate-500">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span className="truncate">
                {worker.createdAt
                  ? `${t("worker.profile.applicationDate")} ${formatDate(worker.createdAt)}`
                  : t("worker.profile.applicationDate")}
              </span>
            </div>
            <span
              className={`shrink-0 rounded-full px-2 text-[10px] font-semibold tracking-wide ${statusMeta.cls}`}
            >
              {statusMeta.label}
            </span>
          </div>
      </div>
    </div>
  );
}
