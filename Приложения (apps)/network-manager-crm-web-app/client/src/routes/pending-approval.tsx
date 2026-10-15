import { createFileRoute, redirect } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Clock, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { ensureAuth } from "@/hooks/useAuth";
import { needsApplicationCorrections, needsOnboarding } from "@/lib/auth-routing";

export const Route = createFileRoute("/pending-approval")({
  beforeLoad: async ({ context }) => {
    const user = await ensureAuth(context.queryClient);
    if (!user) {
      throw redirect({ to: "/auth/login" });
    }
    if (needsOnboarding(user)) {
      throw redirect({ to: "/onboarding" });
    }
    if (needsApplicationCorrections(user)) {
      throw redirect({ to: "/onboarding" });
    }
    if (user.status === "rejected") {
      throw redirect({ to: "/application-rejected" });
    }
    if (user.status === "active" && user.role !== "manager") {
      throw redirect({ to: "/worker/projects" });
    }
    if (user.status === "active" && user.role === "manager") {
      throw redirect({ to: "/" });
    }
  },
  component: PendingApprovalPage,
});

function PendingApprovalPage() {
  const { t } = useTranslation();
  const { user, logout, refreshUser } = useAuth();
  const navigate = Route.useNavigate();

  const feedback = user?.applicationFeedback;
  const showCorrections =
    user?.applicationCorrectionsNeeded && feedback?.action === "return";

  const handleRefresh = async () => {
    const updated = await refreshUser();
    if (updated?.status === "active") {
      await navigate({ to: updated.role === "manager" ? "/" : "/worker/projects" });
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-6 text-center dark:bg-slate-950">
      <span className="grid h-16 w-16 place-items-center rounded-2xl bg-amber-50 text-amber-600">
        <Clock className="h-8 w-8" />
      </span>
      <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
        {showCorrections ? t("workers.application.correctionsTitle") : t("auth.pendingTitle")}
      </h1>
      <p className="max-w-sm text-sm text-slate-500">
        {showCorrections
          ? t("workers.application.correctionsDescription")
          : t("auth.pendingMessage")}
      </p>

      {showCorrections && feedback?.reasons?.length ? (
        <ul className="w-full max-w-xs space-y-1.5 rounded-xl bg-white p-4 text-left text-sm text-slate-700 shadow-sm">
          {feedback.reasons.map((reason) => (
            <li key={reason} className="flex items-start gap-2">
              <RotateCcw className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span>{t(`workers.application.returnReasons.${reason}`)}</span>
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
        {showCorrections ? (
          <Button variant="default" onClick={() => void navigate({ to: "/onboarding" })}>
            {t("workers.application.fixApplication")}
          </Button>
        ) : null}
        <Button variant="default" onClick={handleRefresh}>
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
