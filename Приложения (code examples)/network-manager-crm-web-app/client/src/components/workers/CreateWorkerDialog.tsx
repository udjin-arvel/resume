import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
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
import { CertificateMultiSelect } from "@/components/worker/onboarding/CertificateMultiSelect";
import { useCreateWorker } from "@/lib/api/hooks/useWorkers";
import { serializeCertificates } from "@/lib/constants/worker-certificates";
import {
  getSpecializationLabel,
  WORKER_SPECIALIZATION_IDS,
} from "@/lib/constants/worker-specializations";
import {
  formLabelClassName,
  onboardingInputClassName,
  onboardingSelectTriggerClassName,
} from "@/lib/form-styles";
import { createPasswordFieldsSchema, withPasswordConfirm } from "@/lib/register-schema";
import { showError, showSuccess } from "@/lib/toast";

type FormValues = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  password: string;
  passwordConfirm: string;
  position: string;
  hourlyRate: string;
};

type CreateWorkerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
};

const defaultValues: FormValues = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  password: "",
  passwordConfirm: "",
  position: "",
  hourlyRate: "",
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-red-600">{message}</p>;
}

export function CreateWorkerDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateWorkerDialogProps) {
  const { t } = useTranslation();
  const createWorker = useCreateWorker();
  const [certificates, setCertificates] = useState<string[]>([]);

  const schema = useMemo(
    () =>
      withPasswordConfirm(
        z.object({
          firstName: z.string().min(1, t("auth.validation.firstNameRequired")),
          lastName: z.string().min(1, t("auth.validation.lastNameRequired")),
          phone: z.string().optional(),
          email: z.string().min(1, t("auth.validation.emailRequired")).email(t("auth.validation.email")),
          ...createPasswordFieldsSchema(t),
          position: z.string().optional(),
          hourlyRate: z.string().optional(),
        }),
        t,
      ),
    [t],
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  useEffect(() => {
    if (open) return;
    form.reset(defaultValues);
    setCertificates([]);
  }, [open, form]); // reset only when sheet closes

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await createWorker.mutateAsync({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        phone: values.phone?.trim() || undefined,
        email: values.email.trim(),
        password: values.password,
        position: values.position?.trim() || undefined,
        specialization: serializeCertificates(certificates) || undefined,
        hourlyRate: values.hourlyRate?.trim() || undefined,
      });
      showSuccess("Работник добавлен");
      onOpenChange(false);
      onCreated?.();
    } catch (e) {
      showError(e);
    }
  });

  return (
    <FormBottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Добавить работника"
      description="Заполните данные работника для создания учётной записи."
      footer={
        <>
          <FormBottomSheetCancel
            onClick={() => onOpenChange(false)}
            disabled={createWorker.isPending}
          />
          <FormBottomSheetPrimary
            onClick={() => void onSubmit()}
            disabled={createWorker.isPending}
          >
            {createWorker.isPending ? "Создание…" : "Создать"}
          </FormBottomSheetPrimary>
        </>
      }
    >
      <div className="space-y-1.5">
        <label htmlFor="worker-first-name" className={formLabelClassName}>
          {t("auth.firstName")}
          <span className="text-red-500"> *</span>
        </label>
        <Input
          id="worker-first-name"
          placeholder="Иван"
          className={onboardingInputClassName}
          {...form.register("firstName")}
        />
        <FieldError message={form.formState.errors.firstName?.message} />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="worker-last-name" className={formLabelClassName}>
          {t("auth.lastName")}
          <span className="text-red-500"> *</span>
        </label>
        <Input
          id="worker-last-name"
          placeholder="Иванов"
          className={onboardingInputClassName}
          {...form.register("lastName")}
        />
        <FieldError message={form.formState.errors.lastName?.message} />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="worker-phone" className={formLabelClassName}>
          {t("auth.phone")}
        </label>
        <Input
          id="worker-phone"
          type="tel"
          placeholder="+7 900 000-00-00"
          className={onboardingInputClassName}
          {...form.register("phone")}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="worker-email" className={formLabelClassName}>
          {t("auth.email")}
          <span className="text-red-500"> *</span>
        </label>
        <Input
          id="worker-email"
          type="email"
          placeholder="worker@example.com"
          className={onboardingInputClassName}
          {...form.register("email")}
        />
        <FieldError message={form.formState.errors.email?.message} />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="worker-password" className={formLabelClassName}>
          {t("auth.password")}
          <span className="text-red-500"> *</span>
        </label>
        <Input
          id="worker-password"
          type="password"
          placeholder="Минимум 8 символов"
          className={onboardingInputClassName}
          {...form.register("password")}
        />
        <FieldError message={form.formState.errors.password?.message} />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="worker-password-confirm" className={formLabelClassName}>
          {t("auth.passwordConfirm")}
          <span className="text-red-500"> *</span>
        </label>
        <Input
          id="worker-password-confirm"
          type="password"
          placeholder="Повторите пароль"
          className={onboardingInputClassName}
          {...form.register("passwordConfirm")}
        />
        <FieldError message={form.formState.errors.passwordConfirm?.message} />
      </div>

      <div className="space-y-1.5">
        <label className={formLabelClassName}>{t("onboarding.position")}</label>
        <Controller
          control={form.control}
          name="position"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className={onboardingSelectTriggerClassName}>
                <SelectValue placeholder={t("onboarding.positionPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {WORKER_SPECIALIZATION_IDS.map((spec) => (
                  <SelectItem key={spec} value={spec}>
                    {getSpecializationLabel(spec, t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="space-y-1.5">
        <label className={formLabelClassName}>{t("onboarding.selectCertificates")}</label>
        <CertificateMultiSelect value={certificates} onChange={setCertificates} />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="worker-hourly-rate" className={formLabelClassName}>
          Ставка, €/ч
        </label>
        <Input
          id="worker-hourly-rate"
          type="number"
          min="0"
          step="0.01"
          placeholder="0.00"
          className={onboardingInputClassName}
          {...form.register("hourlyRate")}
        />
      </div>
    </FormBottomSheet>
  );
}
