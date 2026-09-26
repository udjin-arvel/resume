import type { UseFormRegister, FieldErrors } from "react-hook-form";
import { Calendar } from "lucide-react";
import type { CreateToolForm } from "../schema/createToolFormSchema";
import type { ControlType } from "../constants";
import { needsCalibrationFields, needsUsageLimit } from "../constants";
import { StepTitle } from "../ToolFormField";
import { AccountingOnlyInfo } from "../blocks/AccountingOnlyInfo";
import { CalibrationBlock } from "../blocks/CalibrationBlock";
import { ExpiryBlock } from "../blocks/ExpiryBlock";
import { UsageLimitBlock } from "../blocks/UsageLimitBlock";
import { ToolFormSummary } from "../ToolFormSummary";

type Step3ControlParamsProps = {
  controlType: ControlType;
  values: CreateToolForm;
  register: UseFormRegister<CreateToolForm>;
  errors: FieldErrors<CreateToolForm>;
  calibrationDocs: File[];
  onCalibrationDocsChange: (files: File[]) => void;
};

export function Step3ControlParams({
  controlType,
  values,
  register,
  errors,
  calibrationDocs,
  onCalibrationDocsChange,
}: Step3ControlParamsProps) {
  return (
    <>
      <StepTitle icon={Calendar} title="Параметры контроля" />

      {controlType === "accounting_only" ? <AccountingOnlyInfo /> : null}

      {controlType === "expiry" ? (
        <ExpiryBlock
          register={register}
          errors={errors}
          calibrationDocs={calibrationDocs}
          onCalibrationDocsChange={onCalibrationDocsChange}
        />
      ) : null}

      {controlType === "calibration" ? (
        <CalibrationBlock
          register={register}
          errors={errors}
          calibrationDocs={calibrationDocs}
          onCalibrationDocsChange={onCalibrationDocsChange}
        />
      ) : null}

      {controlType === "usage_limit" ? (
        <UsageLimitBlock register={register} errors={errors} />
      ) : null}

      {controlType === "combined" ? (
        <div className="space-y-4">
          <CalibrationBlock
            register={register}
            errors={errors}
            calibrationDocs={calibrationDocs}
            onCalibrationDocsChange={onCalibrationDocsChange}
          />
          <UsageLimitBlock register={register} errors={errors} />
        </div>
      ) : null}

      <ToolFormSummary values={values} controlType={controlType} />
    </>
  );
}
