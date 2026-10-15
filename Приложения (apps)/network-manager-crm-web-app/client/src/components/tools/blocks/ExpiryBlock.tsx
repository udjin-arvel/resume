import type { UseFormRegister, FieldErrors } from "react-hook-form";
import type { CreateToolForm } from "../schema/createToolFormSchema";
import { CalibrationBlock } from "./CalibrationBlock";

type ExpiryBlockProps = {
  register: UseFormRegister<CreateToolForm>;
  errors: FieldErrors<CreateToolForm>;
  calibrationDocs: File[];
  onCalibrationDocsChange: (files: File[]) => void;
};

export function ExpiryBlock(props: ExpiryBlockProps) {
  return <CalibrationBlock title="Срок годности" {...props} />;
}
