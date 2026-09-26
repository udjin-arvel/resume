import { useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  FormBottomSheet,
  FormBottomSheetCancel,
  FormBottomSheetPrimary,
} from "@/components/common/FormBottomSheet";

const PASSPORT_EXAMPLE_SRC = "/onboarding/passport-example.svg";

type PassportUploadSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFileSelected: (file: File) => void;
};

export function PassportUploadSheet({
  open,
  onOpenChange,
  onFileSelected,
}: PassportUploadSheetProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    onFileSelected(file);
    onOpenChange(false);
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,application/pdf"
        className="hidden"
        onChange={(e) => {
          handleFileChange(e.target.files);
          e.target.value = "";
        }}
      />

      <FormBottomSheet
        open={open}
        onOpenChange={onOpenChange}
        title={t("onboarding.passportExampleTitle")}
        description={t("onboarding.passportExampleDescription")}
        footer={
          <>
            <FormBottomSheetCancel onClick={() => onOpenChange(false)} />
            <FormBottomSheetPrimary onClick={() => inputRef.current?.click()}>
              {t("onboarding.upload")}
            </FormBottomSheetPrimary>
          </>
        }
      >
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          <img
            src={PASSPORT_EXAMPLE_SRC}
            alt={t("onboarding.passportExampleAlt")}
            className="aspect-[4/3] w-full object-cover"
          />
        </div>
      </FormBottomSheet>
    </>
  );
}
