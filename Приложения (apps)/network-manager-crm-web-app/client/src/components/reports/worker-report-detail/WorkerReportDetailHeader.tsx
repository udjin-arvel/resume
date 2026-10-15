import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";

export function WorkerReportDetailHeader() {
  return (
    <PageHeader>
      <div className="flex items-center gap-3 py-3">
        <Link to="/reports" className="outline-none focus:outline-none focus-visible:outline-none">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="min-w-0 flex-1 text-[16px] font-semibold text-slate-900">
          Отчёт работника
        </h1>
      </div>
    </PageHeader>
  );
}
