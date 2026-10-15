import type { ReactNode } from "react";
import { AppHeader } from "./AppHeader";
import { BottomNav, type NavKey } from "./BottomNav";
import { FullWidthHeader } from "./FullWidthHeader";
import { APP_COLUMN_CLASS } from "@/lib/layout";

type AppLayoutProps = {
  children: ReactNode;
  activeNav?: NavKey;
  title?: string;
  subtitle?: string;
  backTo?: string;
  showBack?: boolean;
  showNav?: boolean;
  headerRight?: ReactNode;
  className?: string;
};

export function AppLayout({
  children,
  activeNav,
  title,
  subtitle,
  backTo,
  showBack,
  showNav = true,
  headerRight,
  className = "",
}: AppLayoutProps) {
  return (
    <div className={`min-h-screen overflow-x-clip bg-[#F5F6FA] pb-[60px] ${className}`}>
      {title ? (
        <FullWidthHeader className="border-b border-slate-200 pt-[env(safe-area-inset-top)]">
          <AppHeader
            title={title}
            subtitle={subtitle}
            backTo={backTo}
            showBack={showBack}
            rightSlot={headerRight}
          />
        </FullWidthHeader>
      ) : null}
      <div className={APP_COLUMN_CLASS}>{children}</div>
      {showNav && activeNav ? <BottomNav active={activeNav} /> : null}
    </div>
  );
}
