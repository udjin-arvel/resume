import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useTelegram } from "@/hooks/useTelegram";
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

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type LoginForm = z.infer<typeof loginSchema>;

type LoginSearch = {
  redirect?: string;
  invite?: string;
};

export const Route = createFileRoute("/auth/login")({
  validateSearch: (s: Record<string, unknown>): LoginSearch => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
    invite: typeof s.invite === "string" ? s.invite : undefined,
  }),
  component: LoginPage,
});

function LoginPage() {
  const { t } = useTranslation();
  const { login, loginTelegram, isAuthenticated, user } = useAuth();
  const { isTelegram, initData } = useTelegram();
  const [telegramTried, setTelegramTried] = useState(false);
  const navigate = Route.useNavigate();
  const search = Route.useSearch();

  const registerSearch = search.invite ? { invite: search.invite } : undefined;

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (isAuthenticated && user) {
      void navigate({ to: getPostLoginPath(user, search.redirect) });
    }
  }, [isAuthenticated, user, navigate, search.redirect]);

  useEffect(() => {
    if (!isTelegram || !initData || telegramTried) return;
    setTelegramTried(true);
    void loginTelegram(initData, { inviteCode: search.invite })
      .then((u) => navigate({ to: getPostLoginPath(u, search.redirect) }))
      .catch(() => {});
  }, [isTelegram, initData, telegramTried, loginTelegram, navigate, search.redirect, search.invite]);

  const onSubmit = form.handleSubmit(async (values) => {
    const loggedIn = await login(values);
    await navigate({ to: getPostLoginPath(loggedIn, search.redirect) });
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t("auth.loginTitle")}</CardTitle>
          <CardDescription>Radar CRM</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input id="email" type="email" {...form.register("email")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input id="password" type="password" {...form.register("password")} />
            </div>
            {import.meta.env.DEV ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                <p className="font-medium">Тестовые учётные записи</p>
                <p className="mt-1">Администратор: admin@example.com / admin12345</p>
                <p>Тестовый рабочий: worker@gmail.com / 11111111</p>
              </div>
            ) : null}
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {t("auth.login")}
            </Button>
          </form>
          {isTelegram ? (
            <Button
              type="button"
              variant="outline"
              className="mt-3 w-full"
              onClick={() => void loginTelegram(initData, { inviteCode: search.invite })}
            >
              {t("auth.telegramLogin")}
            </Button>
          ) : null}
          <p className="mt-4 text-center text-sm text-slate-500">
            {t("auth.noAccount")}{" "}
            <Link
              to="/auth/register"
              search={registerSearch}
              className="font-medium text-slate-900 underline"
            >
              {t("auth.register")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
