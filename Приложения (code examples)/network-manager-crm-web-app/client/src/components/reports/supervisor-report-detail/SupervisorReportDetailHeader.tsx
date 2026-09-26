import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";

export function SupervisorReportDetailHeader() {
  return (
    <PageHeader>
      <div className="flex items-center gap-3 py-3">
        <Link
          to="/reports"
          className="-ml-1 inline-flex items-center justify-center text-slate-600"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <h1 className="min-w-0 flex-1 text-[16px] font-semibold text-slate-900">
          Отчёт супервайзера
        </h1>
      </div>
    </PageHeader>
  );
}
