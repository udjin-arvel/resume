import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useTelegram } from "@/hooks/useTelegram";

type AppHeaderProps = {
  title: string;
  subtitle?: string;
  backTo?: string;
  showBack?: boolean;
  rightSlot?: React.ReactNode;
};

export function AppHeader({
  title,
  subtitle,
  backTo,
  showBack = false,
  rightSlot,
}: AppHeaderProps) {
  const { t } = useTranslation();
  const { showBackButton } = useTelegram();

  useEffect(() => {
    if (!showBack && !backTo) return;
    return showBackButton(() => {
      if (backTo) window.history.pushState({}, "", backTo);
      else window.history.back();
    });
  }, [showBack, backTo, showBackButton]);

  return (
    <header className="py-4">
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
        <div className="flex w-10 shrink-0 items-center justify-start">
          {(showBack || backTo) && (
            <Link
              to={backTo ?? ".."}
              className="grid h-[20px] w-[20px] place-items-center rounded-full border border-slate-200 text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200"
              aria-label={t("common.back")}
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
          )}
        </div>
        <div className="min-w-0 text-center">
          <h1 className="truncate text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-0.5 truncate text-xs text-slate-500">{subtitle}</p>
          ) : null}
        </div>
        <div className="flex w-10 shrink-0 justify-end">{rightSlot}</div>
      </div>
    </header>
  );
}
