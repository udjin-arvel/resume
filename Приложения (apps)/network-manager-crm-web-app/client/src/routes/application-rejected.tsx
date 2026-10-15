import { createFileRoute, redirect } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { ensureAuth } from "@/hooks/useAuth";
import { getPostLoginPath, needsApplicationCorrections, needsOnboarding } from "@/lib/auth-routing";

export const Route = createFileRoute("/application-rejected")({
  beforeLoad: async ({ context }) => {
    const user = await ensureAuth(context.queryClient);
    if (!user) {
      throw redirect({ to: "/auth/login" });
    }
    if (needsOnboarding(user)) {
      throw redirect({ to: "/onboarding" });
    }
    if (user.status === "pending" && needsApplicationCorrections(user)) {
      throw redirect({ to: "/onboarding" });
    }
    if (user.status === "pending") {
      throw redirect({ to: "/pending-approval" });
    }
    if (user.status === "active" && user.role !== "manager") {
      throw redirect({ to: "/worker/projects" });
    }
    if (user.status === "active" && user.role === "manager") {
      throw redirect({ to: "/" });
    }
    if (user.status !== "rejected" || user.applicationFeedback?.action !== "reject") {
      throw redirect({ to: getPostLoginPath(user) });
    }
  },
  component: ApplicationRejectedPage,
});

function ApplicationRejectedPage() {
  const { t } = useTranslation();
  const { user, logout, refreshUser } = useAuth();
  const navigate = Route.useNavigate();

  const feedback = user?.applicationFeedback;

  const handleRefresh = async () => {
    const updated = await refreshUser();
    if (updated?.status === "active") {
      await navigate({ to: updated.role === "manager" ? "/" : "/worker/projects" });
      return;
    }
    if (updated?.status === "pending") {
      await navigate({ to: "/pending-approval" });
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-6 text-center dark:bg-slate-950">
      <span className="grid h-16 w-16 place-items-center rounded-2xl bg-rose-50 text-rose-600">
        <XCircle className="h-8 w-8" />
      </span>
      <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
        {t("workers.application.rejectedTitle")}
      </h1>
      <p className="max-w-sm text-sm text-slate-500">
        {t("workers.application.rejectedDescription")}
      </p>

      {feedback?.reasons?.length ? (
        <ul className="w-full max-w-xs space-y-1.5 rounded-xl bg-white p-4 text-left text-sm text-slate-700 shadow-sm">
          {feedback.reasons.map((reason) => (
            <li key={reason} className="flex items-start gap-2">
              <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400" />
              <span>{t(`workers.application.rejectReasons.${reason}`)}</span>
            </li>
          ))}
          {feedback.comment ? (
            <li className="border-t border-slate-100 pt-2 text-xs text-slate-500">
              {feedback.comment}
            </li>
          ) : null}
        </ul>
      ) : null}

      <div className="flex w-full max-w-xs flex-col gap-2">
        <Button variant="default" onClick={() => void navigate({ to: "/onboarding" })}>
          {t("workers.application.resubmitApplication")}
        </Button>
        <Button variant="default" onClick={() => void handleRefresh()}>
          {t("auth.refreshStatus")}
        </Button>
        <Button
          variant="outline"
          onClick={async () => {
            await logout();
            await navigate({ to: "/auth/login" });
          }}
        >
          {t("auth.logout")}
        </Button>
      </div>
    </div>
  );
}
