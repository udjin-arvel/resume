import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { ensureAuth } from "@/hooks/useAuth";
import { needsOnboarding } from "@/lib/auth-routing";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ context, location }) => {
    const user = await ensureAuth(context.queryClient);
    if (!user) {
      throw redirect({
        to: "/auth/login",
        search: { redirect: location.href },
      });
    }
    if (user.status === "pending") {
      if (needsOnboarding(user)) {
        throw redirect({ to: "/onboarding" });
      }
      throw redirect({ to: "/pending-approval" });
    }
    if (user.role !== "manager") {
      throw redirect({ to: "/worker/projects" });
    }
    return { user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return <Outlet />;
}
