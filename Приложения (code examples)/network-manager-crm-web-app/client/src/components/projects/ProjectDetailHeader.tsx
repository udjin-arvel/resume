import { Link } from "@tanstack/react-router";
import { Building2, Calendar, ChevronLeft, MapPin } from "lucide-react";
import { FullWidthHeader } from "@/components/layout/FullWidthHeader";
import { projectStatusMeta } from "@/lib/constants/status";
import { formatDate, pluralDays } from "@/lib/format";
import type { z } from "zod";
import type { projectSchema } from "@/lib/api/schemas";

type Project = z.infer<typeof projectSchema>;

type ProjectDetailHeaderProps = {
  project: Project;
  clientName: string;
  daysLeft: number | null;
};

export function ProjectDetailHeader({
  project,
  clientName,
  daysLeft,
}: ProjectDetailHeaderProps) {
  const statusMeta = projectStatusMeta[project.status] ?? projectStatusMeta.active;

  return (
    <FullWidthHeader bleed className="pb-3 pt-4">
      <header>
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 pb-3">
          <Link
            to="/projects"
            className="grid h-[20px] place-items-center rounded-full text-[#111827] transition hover:bg-gray-50"
            aria-label="Назад"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <h1 className="truncate text-base font-semibold text-[#111827]">{project.name}</h1>
          {project.status !== "active" ? (
            <span
              className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusMeta.cls}`}
            >
              {statusMeta.label}
            </span>
          ) : null}
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-1">
              <span className="flex gap-1.5 text-[12px] text-slate-500">
                <Building2 className="h-[16px] w-3 shrink-0 text-slate-500" />
                <span className="truncate">{clientName}</span>
              </span>
              <span className="flex gap-1.5 text-[12px] text-slate-500">
                <MapPin className="h-[16px] w-3 shrink-0 text-slate-500" />
                <span className="truncate">{project.location || "—"}</span>
              </span>
              <span className="flex gap-1.5 text-[12px] text-slate-500">
                <Calendar className="h-[16px] w-3 shrink-0 text-slate-500" />
                <span>
                  {formatDate(project.startDate ?? null, "then")} — {formatDate(project.endDate ?? null, "now")}
                </span>
              </span>
            </div>
            {daysLeft != null ? (
              <span className="ml-auto mt-auto shrink-0 text-right text-[12px] text-gray-400">
                Осталось {daysLeft} {pluralDays(daysLeft)}
              </span>
            ) : null}
          </div>
        </div>
      </header>
    </FullWidthHeader>
  );
}
