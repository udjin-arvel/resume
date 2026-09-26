import type { ReactNode } from "react";
import { FullWidthHeader } from "./FullWidthHeader";
import { WorkerAppHeader } from "./WorkerAppHeader";
import { WorkerBottomNav, type WorkerNavKey } from "./WorkerBottomNav";
import { APP_COLUMN_CLASS } from "@/lib/layout";

type WorkerAppLayoutProps = {
  children: ReactNode;
  activeNav?: WorkerNavKey;
  navMode?: "default" | "blocked";
  title?: string;
  subtitle?: string;
  backTo?: string;
  showBack?: boolean;
  showNav?: boolean;
  headerRight?: ReactNode;
  headerExtra?: ReactNode;
  className?: string;
  headerClassName?: string;
};

export function WorkerAppLayout({
  children,
  activeNav,
  navMode = "default",
  title,
  subtitle,
  backTo,
  showBack,
  showNav = true,
  headerRight,
  headerExtra,
  className = "",
  headerClassName = "",
}: WorkerAppLayoutProps) {
  return (
    <div className={`min-h-screen overflow-x-clip bg-slate-50 pb-24 dark:bg-slate-950 ${className}`}>
      <div className={APP_COLUMN_CLASS}>
        {title ? (
          <FullWidthHeader
            bleed
            className="border-slate-200 pt-[env(safe-area-inset-top)] dark:border-slate-800"
          >
            <WorkerAppHeader
              title={title}
              subtitle={subtitle}
              backTo={backTo}
              showBack={showBack}
              rightSlot={headerRight}
              className={headerClassName}
            />
            {headerExtra}
          </FullWidthHeader>
        ) : null}
        <main>{children}</main>
      </div>
      {showNav && activeNav ? <WorkerBottomNav active={activeNav} mode={navMode} /> : null}
    </div>
  );
}
