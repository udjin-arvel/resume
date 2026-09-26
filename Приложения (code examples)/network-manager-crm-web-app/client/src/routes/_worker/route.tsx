import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { ensureAuth } from "@/hooks/useAuth";
import { needsOnboarding } from "@/lib/auth-routing";

export const Route = createFileRoute("/_worker")({
  beforeLoad: async ({ context, location }) => {
    const user = await ensureAuth(context.queryClient);
    if (!user) {
      throw redirect({
        to: "/auth/login",
        search: { redirect: location.href },
      });
    }
    if (user.role === "manager") {
      throw redirect({ to: "/" });
    }
    if (needsOnboarding(user)) {
      throw redirect({ to: "/onboarding" });
    }
    if (user.status === "pending") {
      throw redirect({ to: "/pending-approval" });
    }
    if (user.status === "rejected") {
      throw redirect({ to: "/application-rejected" });
    }
    if (user.status === "blocked") {
      if (!location.pathname.startsWith("/worker/profile")) {
        throw redirect({ to: "/worker/profile" });
      }
      return { user, isBlocked: true };
    }
    if (user.status !== "active") {
      throw redirect({ to: "/auth/login" });
    }
    return { user };
  },
  component: WorkerLayout,
});

function WorkerLayout() {
  return <Outlet />;
}
