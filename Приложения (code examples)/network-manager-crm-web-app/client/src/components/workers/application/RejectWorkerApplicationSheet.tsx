import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  FormBottomSheet,
  FormBottomSheetCancel,
  FormBottomSheetPrimary,
} from "@/components/common/FormBottomSheet";
import { Textarea } from "@/components/ui/textarea";
import { useRejectWorker } from "@/lib/api/hooks/useWorkers";
import { REJECT_APPLICATION_REASONS } from "@/lib/constants/worker-application-review";
import { formInputClassName, formLabelClassName } from "@/lib/form-styles";
import { showError, showSuccess } from "@/lib/toast";
import { ApplicationReviewCheckboxList } from "./ApplicationReviewCheckboxList";

type RejectWorkerApplicationSheetProps = {
  workerId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRejected?: () => void;
};

export function RejectWorkerApplicationSheet({
  workerId,
  open,
  onOpenChange,
  onRejected,
}: RejectWorkerApplicationSheetProps) {
  const { t } = useTranslation();
  const rejectWorker = useRejectWorker();
  const [reasons, setReasons] = useState<string[]>([]);
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (!open) {
      setReasons([]);
      setComment("");
    }
  }, [open]);

  const handleSubmit = async () => {
    if (reasons.length === 0) {
      showError(t("workers.application.selectReason"));
      return;
    }
    try {
      await rejectWorker.mutateAsync({
        id: workerId,
        payload: { reasons, comment: comment.trim() || undefined },
      });
      showSuccess(t("workers.application.rejectTitle"));
      onOpenChange(false);
      onRejected?.();
    } catch (err) {
      showError(err);
    }
  };

  return (
    <FormBottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t("workers.application.rejectTitle")}
      description={t("workers.application.rejectDescription")}
      footer={
        <>
          <FormBottomSheetCancel
            onClick={() => onOpenChange(false)}
            disabled={rejectWorker.isPending}
          />
          <FormBottomSheetPrimary
            onClick={() => void handleSubmit()}
            disabled={rejectWorker.isPending}
            variant="destructive"
          >
            <X className="h-3.5 w-3.5" />
            {rejectWorker.isPending
              ? "…"
              : t("workers.application.rejectSubmit")}
          </FormBottomSheetPrimary>
        </>
      }
    >
      <ApplicationReviewCheckboxList
        options={REJECT_APPLICATION_REASONS}
        labelPrefix="workers.application.rejectReasons"
        selected={reasons}
        onChange={setReasons}
      />

      <div className="space-y-1.5">
        <label htmlFor="reject-comment" className={formLabelClassName}>
          {t("workers.application.commentLabel")}
        </label>
        <Textarea
          id="reject-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t("workers.application.commentPlaceholder")}
          rows={4}
          className={formInputClassName}
        />
      </div>
    </FormBottomSheet>
  );
}
