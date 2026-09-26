import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { FullWidthHeader } from "@/components/layout/FullWidthHeader";

export function WorkerApplicationHeader() {
  const { t } = useTranslation();

  return (
    <FullWidthHeader bleed className="pt-3">
      <header>
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 pb-3">
          <Link
            to="/workers"
            search={{ tab: "pending" }}
            className="grid h-[20px] place-items-center rounded-full text-[#111827] transition hover:bg-gray-50"
            aria-label="Назад"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="truncate text-base font-semibold text-[#111827]">
            {t("workers.application.title")}
          </h1>
        </div>
      </header>
    </FullWidthHeader>
  );
}
