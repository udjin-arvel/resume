import { useMemo, useState, type FormEvent } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { TFunction } from "i18next";
import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FullWidthHeader } from "@/components/layout/FullWidthHeader";
import { OnboardingSection } from "@/components/worker/onboarding/OnboardingSection";
import { OnboardingDocumentRow } from "@/components/worker/onboarding/OnboardingDocumentRow";
import { PassportUploadSheet } from "@/components/worker/onboarding/PassportUploadSheet";
import { CertificateMultiSelect } from "@/components/worker/onboarding/CertificateMultiSelect";
import {
  formLabelClassName,
  onboardingInputClassName,
  onboardingSelectTriggerClassName,
} from "@/lib/form-styles";
import { COUNTRY_OPTIONS } from "@/lib/countries";
import {
  getSpecializationLabel,
  normalizeSpecializationId,
  WORKER_SPECIALIZATION_IDS,
} from "@/lib/constants/worker-specializations";
import {
  parseCertificates,
  serializeCertificates,
} from "@/lib/constants/worker-certificates";
import { useAuth } from "@/hooks/useAuth";
import { useDocuments, useUploadDocument } from "@/lib/api/hooks/useDocuments";
import { showError, showSuccess } from "@/lib/toast";
import { APP_COLUMN_CLASS } from "@/lib/layout";
import {
  WORKER_DOCUMENT_TYPES,
  workerDocumentTypeMeta,
  type WorkerDocumentType,
} from "@/lib/worker-documents";
import { cn } from "@/lib/utils";

const REQUIRED_DOCUMENT_TYPES = ["passport"] as const satisfies readonly WorkerDocumentType[];

function resolveInitialPosition(position?: string, legacySpecialization?: string): string {
  const fromPosition = normalizeSpecializationId(position);
  if (fromPosition) return fromPosition;
  const fromLegacy = normalizeSpecializationId(legacySpecialization);
  return fromLegacy ?? "";
}

function resolveInitialCertificates(specialization?: string): string[] {
  const certs = parseCertificates(specialization);
  if (certs.length > 0) return certs;
  if (normalizeSpecializationId(specialization)) return [];
  return [];
}

function createSchema(t: TFunction) {
  return z.object({
    firstName: z.string().trim().min(1, t("onboarding.validation.required")),
    lastName: z.string().trim().min(1, t("onboarding.validation.required")),
    phone: z
      .string()
      .trim()
      .refine((value) => value.length > 2 && value !== "+7", t("onboarding.validation.phone")),
    email: z
      .string()
      .trim()
      .min(1, t("onboarding.validation.required"))
      .email(t("onboarding.validation.email")),
    country: z.string().min(1, t("onboarding.validation.required")),
    position: z.string().trim().min(1, t("onboarding.validation.required")),
    hourlyRate: z
      .string()
      .trim()
      .min(1, t("onboarding.validation.required"))
      .refine((value) => {
        const rate = Number.parseFloat(value);
        return Number.isFinite(rate) && rate > 0;
      }, t("onboarding.validation.hourlyRate")),
  });
}

type FormValues = z.infer<ReturnType<typeof createSchema>>;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-red-500">{message}</p>;
}

function defaultPhone(phone?: string): string {
  const trimmed = phone?.trim() ?? "";
  if (!trimmed) return "+7";
  if (trimmed.startsWith("+")) return trimmed;
  return `+7${trimmed}`;
}

export function OnboardingForm() {
  const { t } = useTranslation();
  const { user, updateUserProfile } = useAuth();
  const uploadDoc = useUploadDocument();
  const navigate = useNavigate();

  const initialPosition = useMemo(
    () => resolveInitialPosition(user?.position, user?.specialization),
    [user?.position, user?.specialization],
  );
  const initialCertificates = useMemo(
    () => resolveInitialCertificates(user?.specialization),
    [user?.specialization],
  );

  const [certificates, setCertificates] = useState<string[]>(initialCertificates);
  const [certificatesError, setCertificatesError] = useState<string | null>(null);
  const [files, setFiles] = useState<Partial<Record<WorkerDocumentType, File>>>({});
  const [passportError, setPassportError] = useState<string | null>(null);
  const [passportSheetOpen, setPassportSheetOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const correctionsMode = Boolean(user?.applicationCorrectionsNeeded);
  const resubmitMode = user?.status === "rejected";
  const existingDocsMode = correctionsMode || resubmitMode;
  const docsQuery = useDocuments(
    { entityType: "user", entityId: user?.id ?? "" },
    { enabled: existingDocsMode && Boolean(user?.id) },
  );
  const hasExistingPassport = (docsQuery.data ?? []).some((doc) => doc.documentType === "passport");

  const schema = useMemo(() => createSchema(t), [t]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onSubmit",
    defaultValues: {
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      phone: defaultPhone(user?.phone),
      email: user?.email ?? "",
      country: user?.country ?? "",
      position: initialPosition,
      hourlyRate: user?.hourlyRate ?? "",
    },
  });

  const collectExtraValidationMessages = (): string[] => {
    const messages: string[] = [];

    if (certificates.length === 0) {
      const message = t("onboarding.validation.certificatesRequired");
      setCertificatesError(message);
      messages.push(message);
    } else {
      setCertificatesError(null);
    }

    const passportSatisfied = Boolean(files.passport) || (existingDocsMode && hasExistingPassport);
    if (!passportSatisfied) {
      const message = t("onboarding.validation.passportRequired");
      setPassportError(message);
      messages.push(message);
    } else {
      setPassportError(null);
    }

    return messages;
  };

  const onSubmit = async (values: FormValues) => {
    if (!user) return;

    if (collectExtraValidationMessages().length > 0) {
      showError(t("onboarding.validation.formInvalid"));
      return;
    }

    setSubmitting(true);
    try {
      await updateUserProfile({
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone,
        email: values.email,
        country: values.country,
        position: values.position,
        specialization: serializeCertificates(certificates),
        hourlyRate: values.hourlyRate,
      });
      const uploads = Object.entries(files).flatMap(([documentType, file]) => {
        if (!file) return [];
        return [
          (async () => {
            const fd = new FormData();
            fd.append("file", file);
            fd.append("entityType", "user");
            fd.append("entityId", user.id);
            fd.append("documentType", documentType);
            await uploadDoc.mutateAsync(fd);
          })(),
        ];
      });
      await Promise.all(uploads);
      showSuccess(t("onboarding.submitted"));
      await navigate({ to: "/pending-approval" });
    } catch (err) {
      showError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const onInvalid = () => {
    collectExtraValidationMessages();
    showError(t("onboarding.validation.formInvalid"));
  };

  const onFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    void form.handleSubmit(onSubmit, onInvalid)(event);
  };

  const errors = form.formState.errors;
  const inputErrorClass = (hasError: boolean) =>
    cn(onboardingInputClassName, hasError && "border-red-500 focus-visible:ring-red-500");
  const selectErrorClass = (hasError: boolean) =>
    cn(onboardingSelectTriggerClassName, hasError && "border-red-500 focus:border-red-500");

  return (
    <>
      <FullWidthHeader bleed className="pt-[env(safe-area-inset-top)]">
        <h1 className="py-4 text-[16px] font-bold text-slate-900 dark:text-slate-100">
          {t("onboarding.formTitle")}
        </h1>
      </FullWidthHeader>

      <div className={`${APP_COLUMN_CLASS} space-y-4 px-4 pt-4`}>
        <form onSubmit={onFormSubmit} className="space-y-4">
          <OnboardingSection title={t("onboarding.section.basic")}>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="firstName" className={formLabelClassName}>
                  {t("auth.firstName")}
                  <span className="text-red-500"> *</span>
                </Label>
                <Input
                  id="firstName"
                  className={inputErrorClass(Boolean(errors.firstName))}
                  {...form.register("firstName")}
                />
                <FieldError message={errors.firstName?.message} />
              </div>

              <div className="space-y-1">
                <Label htmlFor="lastName" className={formLabelClassName}>
                  {t("auth.lastName")}
                  <span className="text-red-500"> *</span>
                </Label>
                <Input
                  id="lastName"
                  className={inputErrorClass(Boolean(errors.lastName))}
                  {...form.register("lastName")}
                />
                <FieldError message={errors.lastName?.message} />
              </div>

              <div className="space-y-1">
                <Label htmlFor="phone" className={formLabelClassName}>
                  {t("auth.phone")}
                  <span className="text-red-500"> *</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  className={inputErrorClass(Boolean(errors.phone))}
                  {...form.register("phone")}
                />
                <FieldError message={errors.phone?.message} />
              </div>

              <div className="space-y-1">
                <Label htmlFor="email" className={formLabelClassName}>
                  {t("auth.email")}
                  <span className="text-red-500"> *</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  className={inputErrorClass(Boolean(errors.email))}
                  {...form.register("email")}
                />
                <FieldError message={errors.email?.message} />
              </div>

              <div className="space-y-1">
                <Label className={formLabelClassName}>
                  {t("onboarding.country")}
                  <span className="text-red-500"> *</span>
                </Label>
                <Controller
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className={selectErrorClass(Boolean(errors.country))}>
                        <SelectValue placeholder={t("onboarding.countryPlaceholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRY_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {t(option.labelKey)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError message={errors.country?.message} />
              </div>
            </div>
          </OnboardingSection>

          <OnboardingSection title={t("onboarding.section.professional")}>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className={formLabelClassName}>
                  {t("onboarding.position")}
                  <span className="text-red-500"> *</span>
                </Label>
                <Controller
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className={selectErrorClass(Boolean(errors.position))}>
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
                <FieldError message={errors.position?.message} />
              </div>

              <div className="space-y-1">
                <Label className={formLabelClassName}>
                  {t("onboarding.selectCertificates")}
                  <span className="text-red-500"> *</span>
                </Label>
                <CertificateMultiSelect
                  value={certificates}
                  onChange={(next) => {
                    setCertificates(next);
                    if (next.length > 0) setCertificatesError(null);
                  }}
                  hasError={Boolean(certificatesError)}
                />
                <FieldError message={certificatesError ?? undefined} />
              </div>

              <div className="space-y-1">
                <Label htmlFor="hourlyRate" className={formLabelClassName}>
                  {t("onboarding.hourlyRate")}
                  <span className="text-red-500"> *</span>
                </Label>
                <div className="relative">
                  <Input
                    id="hourlyRate"
                    type="number"
                    step="0.01"
                    min="0"
                    className={cn(inputErrorClass(Boolean(errors.hourlyRate)), "pr-10")}
                    {...form.register("hourlyRate")}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-slate-400">
                    €
                  </span>
                </div>
                <FieldError message={errors.hourlyRate?.message} />
              </div>
            </div>
          </OnboardingSection>

          <OnboardingSection title={t("onboarding.documents")}>
            <div className="flex flex-col gap-2">
              {WORKER_DOCUMENT_TYPES.map((type) => {
                const meta = workerDocumentTypeMeta[type];
                const Icon = meta.icon;
                const isRequired = REQUIRED_DOCUMENT_TYPES.includes(
                  type as (typeof REQUIRED_DOCUMENT_TYPES)[number],
                );
                const rowError = type === "passport" ? passportError ?? undefined : undefined;
                return (
                  <OnboardingDocumentRow
                    key={type}
                    title={t(meta.labelKey)}
                    icon={Icon}
                    required={isRequired}
                    error={rowError}
                    file={files[type] ?? null}
                    onUploadClick={type === "passport" ? () => setPassportSheetOpen(true) : undefined}
                    onFileChange={(file) => {
                      if (type === "passport" && file) {
                        setPassportError(null);
                      }
                      setFiles((prev) => {
                        const next = { ...prev };
                        if (file) {
                          next[type] = file;
                        } else {
                          delete next[type];
                        }
                        return next;
                      });
                    }}
                  />
                );
              })}
            </div>
          </OnboardingSection>

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          >
            <Check className="h-4 w-4" />
            {resubmitMode ? t("workers.application.resubmitApplication") : t("onboarding.submit")}
          </button>
        </form>
      </div>

      <PassportUploadSheet
        open={passportSheetOpen}
        onOpenChange={setPassportSheetOpen}
        onFileSelected={(file) => {
          setPassportError(null);
          setFiles((prev) => ({ ...prev, passport: file }));
        }}
      />
    </>
  );
}
