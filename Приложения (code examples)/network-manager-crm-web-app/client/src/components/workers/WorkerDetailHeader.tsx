import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { FullWidthHeader } from "@/components/layout/FullWidthHeader";
import { userStatusMeta } from "@/lib/constants/status";
import { formatMoney } from "@/lib/format";
import type { Worker } from "./worker-payload";

type WorkerListTab = "pending" | "active" | "blocked";

function workerListTab(status: string): WorkerListTab {
  if (status === "pending") return "pending";
  if (status === "active") return "active";
  return "blocked";
}

type WorkerDetailHeaderProps = {
  worker: Worker;
};

export function WorkerDetailHeader({ worker }: WorkerDetailHeaderProps) {
  const statusMeta = userStatusMeta[worker.status] ?? userStatusMeta.active;
  const subtitleParts = [
    worker.position || worker.specialization || worker.role,
    `${formatMoney(worker.hourlyRate)}/ч`,
  ].filter(Boolean);

  return (
    <FullWidthHeader bleed className="pt-3">
      <header>
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2 pb-3">
          <Link
            to="/workers"
            search={{ tab: workerListTab(worker.status) }}
            className="grid h-[20px] place-items-center rounded-full text-[#111827] transition hover:bg-gray-50"
            aria-label="Назад"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="flex justify-between items-center truncate text-base font-semibold text-[#111827]">
            <div className="flex flex-col">
              <span>{worker.firstName} {worker.lastName}</span>
              <span className="min-w-0 truncate text-[14px] text-gray-500">
                {subtitleParts.join(" · ")}
              </span>
            </div>
            <span className={`shrink-0 rounded-full px-2 text-[10px] font-semibold tracking-wide ${statusMeta.cls}`}>
              {statusMeta.label}
            </span>
          </h1>
        </div>
      </header>
    </FullWidthHeader>
  );
}
