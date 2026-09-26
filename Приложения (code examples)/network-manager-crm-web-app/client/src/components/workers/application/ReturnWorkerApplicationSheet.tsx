import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  FormBottomSheet,
  FormBottomSheetCancel,
  FormBottomSheetPrimary,
} from "@/components/common/FormBottomSheet";
import { Textarea } from "@/components/ui/textarea";
import { useReturnWorkerApplication } from "@/lib/api/hooks/useWorkers";
import { RETURN_APPLICATION_REASONS } from "@/lib/constants/worker-application-review";
import { formInputClassName, formLabelClassName } from "@/lib/form-styles";
import { showError, showSuccess } from "@/lib/toast";
import { ApplicationReviewCheckboxList } from "./ApplicationReviewCheckboxList";

type ReturnWorkerApplicationSheetProps = {
  workerId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReturned?: () => void;
};

export function ReturnWorkerApplicationSheet({
  workerId,
  open,
  onOpenChange,
  onReturned,
}: ReturnWorkerApplicationSheetProps) {
  const { t } = useTranslation();
  const returnApplication = useReturnWorkerApplication();
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
      await returnApplication.mutateAsync({
        id: workerId,
        payload: { reasons, comment: comment.trim() || undefined },
      });
      showSuccess(t("workers.application.returnTitle"));
      onOpenChange(false);
      onReturned?.();
    } catch (err) {
      showError(err);
    }
  };

  return (
    <FormBottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t("workers.application.returnTitle")}
      description={t("workers.application.returnDescription")}
      footer={
        <>
          <FormBottomSheetCancel
            onClick={() => onOpenChange(false)}
            disabled={returnApplication.isPending}
          />
          <FormBottomSheetPrimary
            onClick={() => void handleSubmit()}
            disabled={returnApplication.isPending}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {returnApplication.isPending ? "…" : t("workers.application.returnSubmit")}
          </FormBottomSheetPrimary>
        </>
      }
    >
      <ApplicationReviewCheckboxList
        options={RETURN_APPLICATION_REASONS}
        labelPrefix="workers.application.returnReasons"
        selected={reasons}
        onChange={setReasons}
      />

      <div className="space-y-1.5">
        <label htmlFor="return-comment" className={formLabelClassName}>
          {t("workers.application.commentLabel")}
        </label>
        <Textarea
          id="return-comment"
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
