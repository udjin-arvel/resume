import { LogOut } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";

export function ProfileLogoutButton() {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    await navigate({ to: "/auth/login", replace: true });
  };

  return (
    <section className="pt-2 pb-2">
      <button
        type="button"
        onClick={() => void handleLogout()}
        className="flex w-full items-center justify-center gap-2 rounded-[12px] border border-slate-200 bg-white py-3 text-[14px] font-medium text-red-500 transition-colors hover:bg-red-50"
      >
        <LogOut className="h-4 w-4" />
        {t("worker.profile.logout")}
      </button>
    </section>
  );
}
