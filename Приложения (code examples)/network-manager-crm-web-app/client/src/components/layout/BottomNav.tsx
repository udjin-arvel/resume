import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  Home,
  FolderKanban,
  HardHat,
  Wallet,
  FileBarChart,
  ClipboardList,
  Wrench,
} from "lucide-react";
import { APP_COLUMN_CLASS } from "@/lib/layout";

export type NavKey =
  | "home"
  | "projects"
  | "workers"
  | "finance"
  | "reports"
  | "estimates"
  | "tools";

const navItems: { key: NavKey; to: string; icon: typeof Home; labelKey: string }[] =
  [
    { key: "home", to: "/", icon: Home, labelKey: "nav.home" },
    { key: "projects", to: "/projects", icon: FolderKanban, labelKey: "nav.projects" },
    { key: "workers", to: "/workers", icon: HardHat, labelKey: "nav.workers" },
    { key: "finance", to: "/finance", icon: Wallet, labelKey: "nav.finance" },
    { key: "reports", to: "/reports", icon: FileBarChart, labelKey: "nav.reports" },
    { key: "estimates", to: "/estimates", icon: ClipboardList, labelKey: "nav.estimates" },
    { key: "tools", to: "/tools", icon: Wrench, labelKey: "nav.tools" },
  ];

export function BottomNav({ active }: { active: NavKey }) {
  const { t } = useTranslation();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-[#E5E5EA] bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm">
      <ul className={`scrollbar-responsive flex justify-between items-center overflow-x-auto px-2 py-2 ${APP_COLUMN_CLASS}`}>
        {navItems.map(({ key, to, icon: Icon, labelKey }) => (
          <li key={key}>
            <Link
              to={to}
              className={`flex w-[70px] md:w-[64px] cursor-pointer flex-col items-center gap-1 transition ${
                active === key ? "text-black" : "text-[#8E8E93]"
              }`}
            >
              <Icon className="h-6 w-6" />
              <span className="mt-0.5 truncate text-[10px] font-medium">{t(labelKey)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
