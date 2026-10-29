import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useTelegram } from "@/hooks/useTelegram";
import { RegisterLanguageStep } from "@/components/auth/RegisterLanguageStep";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getPostLoginPath } from "@/lib/auth-routing";
import { createRegisterSchema, type RegisterFormValues } from "@/lib/register-schema";
import {
  getStoredWorkerLocale,
  normalizeWorkerLocale,
  setStoredWorkerLocale,
  type WorkerLocale,
} from "@/lib/worker-locale";
import { isValidWorkerInvite, isWorkerInviteRequired } from "@/lib/worker-invite";
import { getTelegramWebApp } from "@/lib/telegram";
import { showSuccess } from "@/lib/toast";
import { i18n } from "@/i18n";

type RegisterSearch = {
  invite?: string;
};

type RegisterStep = "language" | "credentials" | "telegram";

export const Route = createFileRoute("/auth/register")({
  validateSearch: (s: Record<string, unknown>): RegisterSearch => ({
    invite: typeof s.invite === "string" ? s.invite : undefined,
  }),
  component: RegisterPage,
});

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-red-600">{message}</p>;
}

function RegisterPage() {
  const { t } = useTranslation();
  const { register: registerUser, loginTelegram, isAuthenticated, user } = useAuth();
  const { isTelegram, initData } = useTelegram();
  const navigate = Route.useNavigate();
  const search = Route.useSearch();

  const inviteRequired = isWorkerInviteRequired();
  const hasInviteParam = !!search.invite?.trim();
  const hasValidInvite = isValidWorkerInvite(search.invite);

  const suggestedLocale = useMemo((): WorkerLocale => {
    const stored = getStoredWorkerLocale();
    if (stored) return stored;
    const tgLang = getTelegramWebApp()?.initDataUnsafe.user?.language_code;
    return normalizeWorkerLocale(tgLang);
  }, []);

  const [step, setStep] = useState<RegisterStep>("language");
  const [locale, setLocale] = useState<WorkerLocale>(suggestedLocale);
  const [telegramStarted, setTelegramStarted] = useState(false);

  useEffect(() => {
    void i18n.changeLanguage(locale);
  }, [locale]);

  const registerSchema = useMemo(() => createRegisterSchema(t), [t]);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      passwordConfirm: "",
      firstName: "",
      lastName: "",
      phone: "",
    },
  });

  useEffect(() => {
    if (isAuthenticated && user) {
      void navigate({ to: getPostLoginPath(user) });
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    if (step !== "telegram" || telegramStarted || !isTelegram || !initData) return;
    if (!hasValidInvite) return;

    setTelegramStarted(true);
    void loginTelegram(initData, {
      inviteCode: search.invite?.trim(),
      language: locale,
    })
      .then((registered) => navigate({ to: getPostLoginPath(registered) }))
      .catch(() => setTelegramStarted(false));
  }, [
    step,
    telegramStarted,
    isTelegram,
    initData,
    hasValidInvite,
    loginTelegram,
    search.invite,
    locale,
    navigate,
  ]);

  const handleLanguageContinue = async () => {
    setStoredWorkerLocale(locale);
    await i18n.changeLanguage(locale);

    if (isTelegram) {
      setStep("telegram");
      return;
    }
    setStep("credentials");
  };

  const handleLocaleChange = (next: WorkerLocale) => {
    setLocale(next);
    setStoredWorkerLocale(next);
  };

  const loginSearch = search.invite ? { invite: search.invite } : undefined;

  const onSubmit = form.handleSubmit(async (values) => {
    await registerUser(
      {
        email: values.email,
        password: values.password,
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone,
        role: "worker",
        inviteCode: search.invite?.trim(),
        language: locale,
      },
      { persistSession: false },
    );
    showSuccess(t("auth.registerSuccess"));
    await navigate({ to: "/auth/login", search: loginSearch });
  });

  const inviteWarning =
    inviteRequired && !hasInviteParam ? t("auth.inviteRequired") : null;
  const inviteInvalid =
    inviteRequired && hasInviteParam && !hasValidInvite ? t("auth.inviteInvalid") : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {step === "language"
              ? t("worker.profile.language")
              : step === "telegram"
                ? t("auth.telegramLogin")
                : t("auth.registerTitle")}
          </CardTitle>
          <CardDescription>Radar CRM</CardDescription>
        </CardHeader>
        <CardContent>
          {inviteWarning ? (
            <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {inviteWarning}
            </p>
          ) : null}
          {inviteInvalid ? (
            <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {inviteInvalid}
            </p>
          ) : null}

          {step === "language" ? (
            <RegisterLanguageStep
              value={locale}
              onChange={handleLocaleChange}
              onContinue={handleLanguageContinue}
              continueDisabled={inviteRequired && !hasValidInvite}
            />
          ) : null}

          {step === "telegram" ? (
            <p className="text-center text-sm text-slate-600">{t("auth.telegramRegistering")}</p>
          ) : null}

          {step === "credentials" ? (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName">{t("auth.firstName")}</Label>
                  <Input id="firstName" {...form.register("firstName")} />
                  <FieldError message={form.formState.errors.firstName?.message} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">{t("auth.lastName")}</Label>
                  <Input id="lastName" {...form.register("lastName")} />
                  <FieldError message={form.formState.errors.lastName?.message} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t("auth.email")}</Label>
                <Input id="email" type="email" {...form.register("email")} />
                <FieldError message={form.formState.errors.email?.message} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{t("auth.phone")}</Label>
                <Input id="phone" {...form.register("phone")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t("auth.password")}</Label>
                <Input id="password" type="password" {...form.register("password")} />
                <FieldError message={form.formState.errors.password?.message} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="passwordConfirm">{t("auth.passwordConfirm")}</Label>
                <Input
                  id="passwordConfirm"
                  type="password"
                  {...form.register("passwordConfirm")}
                />
                <FieldError message={form.formState.errors.passwordConfirm?.message} />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={form.formState.isSubmitting || !hasValidInvite}
              >
                {t("auth.register")}
              </Button>
            </form>
          ) : null}

          {step !== "language" ? (
            <Button
              type="button"
              variant="ghost"
              className="mt-4 w-full"
              onClick={() => setStep("language")}
            >
              {t("worker.profile.language")}
            </Button>
          ) : null}

          <p className="mt-4 text-center text-sm text-slate-500">
            {t("auth.hasAccount")}{" "}
            <Link
              to="/auth/login"
              search={loginSearch}
              className="font-medium text-slate-900 underline"
            >
              {t("auth.login")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
