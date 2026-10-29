import { LockOpen, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatDate } from "@/lib/format";
import type { Worker } from "./worker-payload";

type WorkerBlockedBannerProps = {
  worker: Worker;
  onUnblock: () => void;
  unblockPending?: boolean;
};

export function WorkerBlockedBanner({
  worker,
  onUnblock,
  unblockPending = false,
}: WorkerBlockedBannerProps) {
  const { t } = useTranslation();
  const blockedSince = worker.blockedAt ? formatDate(worker.blockedAt) : "—";

  return (
    <div className="overflow-hidden rounded-2xl border border-red-100 bg-red-50 px-4 py-4">
      <p className="text-sm font-semibold text-red-600">{t("worker.profile.blockedTitle")}</p>

      <div className="mt-3 space-y-2">
        <div>
          <p className="text-xs text-gray-500">{t("worker.profile.blockReason")}</p>
          <p className="text-sm text-gray-900">{worker.blockReason || "—"}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">{t("worker.profile.blockProject")}</p>
          <p className="text-sm text-gray-900">{worker.blockProjectName || "—"}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-xs text-gray-400">
          {t("worker.profile.blockedSince", { date: blockedSince })}
        </p>
        <button
          type="button"
          disabled={unblockPending}
          onClick={onUnblock}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#111827] px-2 py-1 text-[11px] font-medium text-white transition hover:bg-[#1f2937] disabled:opacity-50"
        >
          {unblockPending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <LockOpen className="h-3 w-3" />
          )}
          Разблокировать
        </button>
      </div>
    </div>
  );
}
