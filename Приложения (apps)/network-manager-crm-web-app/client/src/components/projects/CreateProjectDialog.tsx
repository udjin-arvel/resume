import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  FormBottomSheet,
  FormBottomSheetCancel,
  FormBottomSheetPrimary,
} from "@/components/common/FormBottomSheet";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateProject } from "@/lib/api/hooks/useProjects";
import { useClients } from "@/lib/api/hooks/useClients";
import { useEstimates } from "@/lib/api/hooks/useEstimates";
import {
  FORM_RADIUS,
  formInputClassName,
  formLabelClassName,
} from "@/lib/form-styles";
import { showError, showSuccess } from "@/lib/toast";

const manualSchema = z.object({
  clientId: z.string().min(1, "Выберите клиента"),
  name: z.string().min(1, "Укажите название"),
  location: z.string().optional(),
  type: z.enum(["estimate", "outstaff"]).default("estimate"),
  budget: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const fromEstimateSchema = z.object({
  estimateId: z.string().min(1, "Выберите смету"),
  name: z.string().optional(),
  location: z.string().optional(),
  startDate: z.string().optional(),
});

type CreateProjectDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateProjectDialog({ open, onOpenChange }: CreateProjectDialogProps) {
  const [mode, setMode] = useState<"manual" | "estimate">("manual");
  const createProject = useCreateProject();
  const { data: clientsData } = useClients({ pageSize: 100 });
  const estimatesQuery = useEstimates({ status: "approved", pageSize: 100 });
  const approvedEstimates = (estimatesQuery.data?.items ?? []).filter(
    (e) => !e.linkedProjectId,
  );

  const manualForm = useForm({
    resolver: zodResolver(manualSchema),
    defaultValues: {
      clientId: "",
      name: "",
      location: "",
      type: "estimate" as const,
      budget: "",
      startDate: "",
      endDate: "",
    },
  });

  const estimateForm = useForm({
    resolver: zodResolver(fromEstimateSchema),
    defaultValues: { estimateId: "", name: "", location: "", startDate: "" },
  });

  useEffect(() => {
    if (open) return;
    setMode("manual");
    manualForm.reset();
    estimateForm.reset();
  }, [open]); // forms reset intentionally only on close

  const onManualSubmit = manualForm.handleSubmit(async (values) => {
    try {
      await createProject.mutateAsync({
        clientId: values.clientId,
        name: values.name,
        location: values.location ?? "",
        type: values.type,
        budget: values.budget ?? "0",
        startDate: values.startDate || undefined,
        endDate: values.endDate || undefined,
      });
      showSuccess("Проект создан");
      onOpenChange(false);
    } catch (e) {
      showError(e);
    }
  });

  const onEstimateSubmit = estimateForm.handleSubmit(async (values) => {
    try {
      await createProject.mutateAsync({
        estimateId: values.estimateId,
        name: values.name || undefined,
        location: values.location || undefined,
        startDate: values.startDate || undefined,
      });
      showSuccess("Проект создан из сметы");
      onOpenChange(false);
    } catch (e) {
      showError(e);
    }
  });

  const handleSubmit = () => {
    if (mode === "manual") void onManualSubmit();
    else void onEstimateSubmit();
  };

  const canSubmitEstimate =
    mode === "estimate" ? approvedEstimates.length > 0 : true;

  return (
    <FormBottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Создать проект"
      description="Заполните данные проекта вручную или создайте его из согласованной сметы."
      footer={
        <>
          <FormBottomSheetCancel
            onClick={() => onOpenChange(false)}
            disabled={createProject.isPending}
          />
          <FormBottomSheetPrimary
            onClick={handleSubmit}
            disabled={createProject.isPending || !canSubmitEstimate}
          >
            {createProject.isPending
              ? "Создание…"
              : mode === "manual"
                ? "Создать"
                : "Создать из сметы"}
          </FormBottomSheetPrimary>
        </>
      }
    >
      <div className={`inline-flex w-full ${FORM_RADIUS} border border-slate-200 bg-slate-100 p-1`}>
        {(["manual", "estimate"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              mode === m
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {m === "manual" ? "Вручную" : "Из сметы"}
          </button>
        ))}
      </div>

      {mode === "manual" ? (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className={formLabelClassName}>Клиент</label>
            <Select
              value={manualForm.watch("clientId")}
              onValueChange={(v) => manualForm.setValue("clientId", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите клиента" />
              </SelectTrigger>
              <SelectContent>
                {(clientsData?.items ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="proj-name" className={formLabelClassName}>
              Название
            </label>
            <Input
              id="proj-name"
              className={formInputClassName}
              {...manualForm.register("name")}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="proj-location" className={formLabelClassName}>
              Локация
            </label>
            <Input
              id="proj-location"
              className={formInputClassName}
              {...manualForm.register("location")}
            />
          </div>
          <div className="space-y-1.5">
            <label className={formLabelClassName}>Тип</label>
            <Select
              value={manualForm.watch("type")}
              onValueChange={(v) =>
                manualForm.setValue("type", v as "estimate" | "outstaff")
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="estimate">По смете</SelectItem>
                <SelectItem value="outstaff">Аутстафф</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="proj-budget" className={formLabelClassName}>
              Бюджет
            </label>
            <Input
              id="proj-budget"
              className={formInputClassName}
              {...manualForm.register("budget")}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className={formLabelClassName}>Согласованная смета</label>
            {estimatesQuery.isLoading ? (
              <Select disabled>
                <SelectTrigger>
                  <SelectValue placeholder="Загрузка..." />
                </SelectTrigger>
              </Select>
            ) : approvedEstimates.length === 0 ? (
              <div
                className={`${FORM_RADIUS} border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500`}
              >
                Нет согласованных смет
              </div>
            ) : (
              <Select
                value={estimateForm.watch("estimateId")}
                onValueChange={(v) => estimateForm.setValue("estimateId", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите смету" />
                </SelectTrigger>
                <SelectContent>
                  {approvedEstimates.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="space-y-1.5">
            <label htmlFor="est-proj-name" className={formLabelClassName}>
              Название (опционально)
            </label>
            <Input
              id="est-proj-name"
              className={formInputClassName}
              {...estimateForm.register("name")}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="est-proj-location" className={formLabelClassName}>
              Локация
            </label>
            <Input
              id="est-proj-location"
              className={formInputClassName}
              {...estimateForm.register("location")}
            />
          </div>
        </div>
      )}
    </FormBottomSheet>
  );
}
