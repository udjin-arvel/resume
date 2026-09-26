import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useTelegram } from "@/hooks/useTelegram";

type WorkerAppHeaderProps = {
  title: string;
  subtitle?: string;
  backTo?: string;
  showBack?: boolean;
  rightSlot?: React.ReactNode;
  className?: string;
};

export function WorkerAppHeader({
  title,
  subtitle,
  backTo,
  showBack = false,
  rightSlot,
  className = '',
}: WorkerAppHeaderProps) {
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
    <header className={`flex w-full items-center justify-between gap-3 text-[20px] py-3 ${className}`}>
      <div className="flex min-w-0 items-center flex-1 gap-2">
        {(showBack || backTo) && (
          <Link
            to={backTo ?? ".."}
            aria-label={t("common.back")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
        )}
        <div className="min-w-0">
          <h1 className="h-4 truncate font-semibold leading-tight text-[16px] text-slate-900 dark:text-slate-100">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-0.5 truncate text-[12px] text-slate-500">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
    </header>
  );
}
