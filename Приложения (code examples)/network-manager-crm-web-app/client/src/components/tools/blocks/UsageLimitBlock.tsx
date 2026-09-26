import type { UseFormRegister, FieldErrors } from "react-hook-form";
import { Gauge } from "lucide-react";
import type { CreateToolForm } from "../schema/createToolFormSchema";
import { ToolFormField } from "../ToolFormField";
import { NativeSelect } from "@/components/ui/native-select";
import { inputClassName, usageUnits } from "../constants";

type UsageLimitBlockProps = {
  register: UseFormRegister<CreateToolForm>;
  errors: FieldErrors<CreateToolForm>;
};

export function UsageLimitBlock({ register, errors }: UsageLimitBlockProps) {
  return (
    <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2">
        <Gauge className="h-4 w-4 text-slate-500" />
        <p className="text-sm font-semibold text-slate-900">Лимит использований</p>
      </div>

      <ToolFormField label="Лимит" required error={errors.usageLimit}>
        <input
          {...register("usageLimit")}
          inputMode="numeric"
          placeholder="300"
          className={inputClassName}
        />
      </ToolFormField>

      <ToolFormField label="Единица учёта">
        <NativeSelect {...register("usageUnit")}>
          {usageUnits.map((u) => (
            <option key={u.id} value={u.id}>
              {u.label}
            </option>
          ))}
        </NativeSelect>
      </ToolFormField>

      <ToolFormField label="Уже использовано" error={errors.usageCount}>
        <input
          {...register("usageCount")}
          inputMode="numeric"
          placeholder="0"
          className={inputClassName}
        />
      </ToolFormField>
    </section>
  );
}
