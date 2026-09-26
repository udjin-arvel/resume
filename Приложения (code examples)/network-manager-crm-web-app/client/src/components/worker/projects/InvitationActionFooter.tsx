import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Check, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { useConfirmProject, useDeclineProject } from "@/lib/api/hooks/useProjects";
import { showError, showSuccess } from "@/lib/toast";

type InvitationActionFooterProps = {
  projectId: string;
};

export function InvitationActionFooter({ projectId }: InvitationActionFooterProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const confirmProject = useConfirmProject();
  const declineProject = useDeclineProject();
  const [declineOpen, setDeclineOpen] = useState(false);

  const handleConfirm = async () => {
    try {
      await confirmProject.mutateAsync(projectId);
      showSuccess(t("worker.projects.confirmed"));
      await navigate({ to: "/worker/projects" });
    } catch (err) {
      showError(err);
    }
  };

  const handleDecline = async () => {
    try {
      await declineProject.mutateAsync(projectId);
      showSuccess(t("worker.projects.declined"));
      setDeclineOpen(false);
      await navigate({ to: "/worker/projects" });
    } catch (err) {
      showError(err);
    }
  };

  const busy = confirmProject.isPending || declineProject.isPending;

  return (
    <>
      <div className="pt-4 space-y-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void handleConfirm()}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-500 py-2 text-[14px] font-semibold text-white hover:bg-emerald-600 disabled:opacity-60"
        >
          <Check className="h-4 w-4" />
          {t("worker.projects.confirmParticipation")}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => setDeclineOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-red-300 bg-white py-2 text-[14px] font-semibold text-red-500 hover:bg-red-50 disabled:opacity-60"
        >
          <X className="h-4 w-4" />
          {t("worker.projects.declineParticipation")}
        </button>
      </div>

      <ConfirmDialog
        open={declineOpen}
        onOpenChange={setDeclineOpen}
        title={t("worker.projects.declineTitle")}
        description={t("worker.projects.declineDescription")}
        confirmLabel={t("worker.projects.declineParticipation")}
        onConfirm={() => void handleDecline()}
        destructive
      />
    </>
  );
}
