import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  FolderKanban,
  FileBarChart,
  Wallet,
  FileText,
  Bell,
  User,
} from "lucide-react";
import { useUnreadNotificationCount } from "@/lib/api/hooks/useNotifications";
import { APP_COLUMN_NAV_CLASS } from "@/lib/layout";

export type WorkerNavKey =
  | "projects"
  | "reports"
  | "finance"
  | "documents"
  | "notifications"
  | "profile";

const navItems: {
  key: WorkerNavKey;
  to: string;
  icon: typeof FolderKanban;
  labelKey: string;
  showBadge?: boolean;
}[] = [
  { key: "projects", to: "/worker/projects", icon: FolderKanban, labelKey: "worker.nav.projects" },
  { key: "reports", to: "/worker/reports", icon: FileBarChart, labelKey: "worker.nav.reports" },
  { key: "finance", to: "/worker/finance", icon: Wallet, labelKey: "worker.nav.finance" },
  // { key: "documents", to: "/worker/documents", icon: FileText, labelKey: "worker.nav.documents" },
  {
    key: "notifications",
    to: "/worker/notifications",
    icon: Bell,
    labelKey: "worker.nav.notifications",
    showBadge: true,
  },
  { key: "profile", to: "/worker/profile", icon: User, labelKey: "worker.nav.profile" },
];

export function WorkerBottomNav({
  active,
  mode = "default",
}: {
  active: WorkerNavKey;
  mode?: "default" | "blocked";
}) {
  const { t } = useTranslation();
  const { data: unreadCount = 0 } = useUnreadNotificationCount();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
      <ul className={APP_COLUMN_NAV_CLASS}>
        {navItems.map(({ key, to, icon: Icon, labelKey, showBadge }) => {
          const badge = showBadge && unreadCount > 0 ? unreadCount : 0;
          const disabled = mode === "blocked" && key !== "profile";
          return (
            <li key={key} className="min-w-[68px] flex-1">
              {disabled ? (
                <span
                  className="relative flex w-full cursor-not-allowed flex-col items-center gap-1 py-2.5 text-[10px] text-slate-300"
                  aria-disabled="true"
                >
                  <Icon className="h-5 w-5" />
                  <span className="truncate px-0.5">{t(labelKey)}</span>
                </span>
              ) : (
                <Link
                  to={to}
                  className={`relative flex w-full flex-col items-center gap-1 py-2.5 text-[10px] transition ${
                    active === key
                      ? "text-slate-900 dark:text-slate-100"
                      : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  <span className="relative">
                    <Icon className="h-5 w-5" />
                    {badge > 0 ? (
                      <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                        {badge > 9 ? "9+" : badge}
                      </span>
                    ) : null}
                  </span>
                  <span className="truncate px-0.5">{t(labelKey)}</span>
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
