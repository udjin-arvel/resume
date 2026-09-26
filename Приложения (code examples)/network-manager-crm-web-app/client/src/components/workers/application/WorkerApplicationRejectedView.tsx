import { useTranslation } from "react-i18next";
import { XCircle } from "lucide-react";
import type { Worker } from "../worker-payload";
import { WorkerApplicationDocumentsSection } from "./WorkerApplicationDocumentsSection";
import { WorkerApplicationHeader } from "./WorkerApplicationHeader";
import { WorkerApplicationProfileSection } from "./WorkerApplicationProfileSection";
import { WorkerApplicationSummaryCard } from "./WorkerApplicationSummaryCard";

type WorkerApplicationRejectedViewProps = {
  worker: Worker;
  workerId: string;
};

export function WorkerApplicationRejectedView({
  worker,
  workerId,
}: WorkerApplicationRejectedViewProps) {
  const { t } = useTranslation();
  const feedback = worker.applicationFeedback;

  return (
    <>
      <WorkerApplicationHeader />

      <div className="space-y-4 px-2">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-900">
          <div className="flex items-start gap-2">
            <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="space-y-2 text-sm">
              <p className="font-semibold">{t("workers.application.rejectedTitle")}</p>
              {feedback?.reasons?.length ? (
                <ul className="space-y-1">
                  {feedback.reasons.map((reason) => (
                    <li key={reason}>{t(`workers.application.rejectReasons.${reason}`)}</li>
                  ))}
                </ul>
              ) : null}
              {feedback?.comment ? (
                <p className="text-xs text-rose-800/80">{feedback.comment}</p>
              ) : null}
            </div>
          </div>
        </div>

        <WorkerApplicationSummaryCard worker={worker} />
        <WorkerApplicationProfileSection worker={worker} />
        <WorkerApplicationDocumentsSection workerId={workerId} />
      </div>
    </>
  );
}
