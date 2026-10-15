import type { FieldError } from "react-hook-form";
import { FORM_RADIUS } from "@/lib/form-styles";

type ToolFormFieldProps = {
  label: string;
  required?: boolean;
  error?: FieldError;
  children: React.ReactNode;
};

export function ToolFormField({ label, required, error, children }: ToolFormFieldProps) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1 text-xs font-medium text-slate-600">
        {label}
        {required ? <span className="text-red-500">*</span> : null}
      </span>
      {children}
      {error ? <p className="mt-1 text-xs text-red-500">{error.message}</p> : null}
    </label>
  );
}

export function StepTitle({
  icon: Icon,
  title,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className={`grid h-9 w-9 place-items-center ${FORM_RADIUS} bg-slate-900 text-white`}>
        <Icon className="h-4.5 w-4.5" />
      </span>
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
    </div>
  );
}
