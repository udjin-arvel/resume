import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useApproveWorker } from "@/lib/api/hooks/useWorkers";
import { showError, showSuccess } from "@/lib/toast";
import type { Worker } from "../worker-payload";
import { RejectWorkerApplicationSheet } from "./RejectWorkerApplicationSheet";
import { ReturnWorkerApplicationSheet } from "./ReturnWorkerApplicationSheet";
import { WorkerApplicationActions } from "./WorkerApplicationActions";
import { WorkerApplicationDocumentsSection } from "./WorkerApplicationDocumentsSection";
import { WorkerApplicationHeader } from "./WorkerApplicationHeader";
import { WorkerApplicationProfileSection } from "./WorkerApplicationProfileSection";
import { WorkerApplicationSummaryCard } from "./WorkerApplicationSummaryCard";

type WorkerApplicationViewProps = {
  worker: Worker;
  workerId: string;
};

export function WorkerApplicationView({ worker, workerId }: WorkerApplicationViewProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const approveWorker = useApproveWorker();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);

  const goToPendingList = () => {
    void navigate({ to: "/workers", search: { tab: "pending" } });
  };

  const goToRejectedList = () => {
    void navigate({ to: "/workers", search: { tab: "rejected" } });
  };

  const handleAccept = async () => {
    try {
      await approveWorker.mutateAsync(workerId);
      showSuccess(t("workers.application.accepted"));
      goToPendingList();
    } catch (err) {
      showError(err);
    }
  };

  return (
    <>
      <WorkerApplicationHeader />

      <div className="space-y-4 px-2">
        <WorkerApplicationSummaryCard worker={worker} />
        <WorkerApplicationProfileSection worker={worker} />
        <WorkerApplicationDocumentsSection workerId={workerId} />
      </div>

      <WorkerApplicationActions
        onAccept={() => void handleAccept()}
        onReject={() => setRejectOpen(true)}
        onReturn={() => setReturnOpen(true)}
        acceptPending={approveWorker.isPending}
      />

      <RejectWorkerApplicationSheet
        workerId={workerId}
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        onRejected={goToRejectedList}
      />
      <ReturnWorkerApplicationSheet
        workerId={workerId}
        open={returnOpen}
        onOpenChange={setReturnOpen}
        onReturned={goToPendingList}
      />
    </>
  );
}
