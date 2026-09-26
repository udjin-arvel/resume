import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/logout")({
  component: LogoutPage,
});

function LogoutPage() {
  const { logout } = useAuth();
  const navigate = Route.useNavigate();

  useEffect(() => {
    void (async () => {
      await logout();
      await navigate({ to: "/auth/login", replace: true });
    })();
  }, [logout, navigate]);

  return null;
}
