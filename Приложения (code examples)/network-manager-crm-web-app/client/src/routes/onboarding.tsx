import { createFileRoute, redirect } from "@tanstack/react-router";
import { ensureAuth } from "@/hooks/useAuth";
import { needsApplicationCorrections, needsOnboarding } from "@/lib/auth-routing";
import { OnboardingForm } from "@/components/worker/OnboardingForm";

export const Route = createFileRoute("/onboarding")({
  beforeLoad: async ({ context }) => {
    const user = await ensureAuth(context.queryClient);
    if (!user) {
      throw redirect({ to: "/auth/login" });
    }
    if (user.role === "manager") {
      throw redirect({ to: "/" });
    }
    if (!needsOnboarding(user) && user.status === "active") {
      throw redirect({ to: "/worker/projects" });
    }
    if (!needsOnboarding(user) && user.status === "pending" && !needsApplicationCorrections(user)) {
      throw redirect({ to: "/pending-approval" });
    }
    if (!needsOnboarding(user) && user.status === "rejected") {
      throw redirect({ to: "/application-rejected" });
    }
    return { user };
  },
  component: OnboardingPage,
});

function OnboardingPage() {
  return (
    <div className="min-h-screen overflow-x-clip bg-[#F8F9FB] pb-8 dark:bg-slate-950">
      <OnboardingForm />
    </div>
  );
}
