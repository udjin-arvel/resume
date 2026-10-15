import { Link } from "@tanstack/react-router";
import type { z } from "zod";
import { Calendar, ChevronRight, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { myProjectSchema } from "@/lib/api/schemas";
import { formatDate } from "@/lib/format";
import { daysLeft } from "@/components/projects/project-display";
import { getProjectRoleBadge, getWorkerProjectStatusBadge } from "@/lib/worker-projects";

type MyProject = z.infer<typeof myProjectSchema>;

type ProjectAssignmentCardProps = {
  project: MyProject;
};

export function ProjectAssignmentCard({ project }: ProjectAssignmentCardProps) {
  const { t } = useTranslation();
  const statusBadge = getWorkerProjectStatusBadge(project);
  const roleBadge =
    project.confirmationStatus !== "declined" ? getProjectRoleBadge(project.role) : null;
  const remaining = daysLeft(project.endDate);
  const period =
    project.startDate || project.endDate
      ? `${project.startDate ? formatDate(project.startDate) : "—"} – ${project.endDate ? formatDate(project.endDate) : "—"}`
      : null;

  return (
    <Link
      to="/worker/projects/$projectId"
      params={{ projectId: project.id }}
      className="card-hover block rounded-[12px] border border-[#E0E4EC] bg-white p-3"
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="min-w-0 truncate text-[16px] font-bold text-[#1A1C29]">{project.name}</h3>
        <ChevronRight className="h-4 w-4 shrink-0 text-[#8E97AF]" aria-hidden="true" />
      </div>

      {project.location ? (
        <p className="mt-3 flex items-center gap-1.5 text-[12px] text-slate-500">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{project.location}</span>
        </p>
      ) : null}

      {period ? (
        <div className="mt-1.5 flex items-center justify-between gap-3 text-[12px] text-[#8E97AF]">
          <span className="flex min-w-0 items-center gap-1.5">
            <Calendar className="h-3 w-3 shrink-0" />
            <span className="truncate">{period}</span>
          </span>
          {remaining != null ? (
            <span className="shrink-0">{t("worker.projects.daysLeft", { count: remaining })}</span>
          ) : null}
        </div>
      ) : remaining != null ? (
        <p className="mt-1.5 text-right text-[12px] text-[#8E97AF]">
          {t("worker.projects.daysLeft", { count: remaining })}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className={`inline-flex rounded-full px-2 h-[19px] text-[10px] font-medium items-center ${statusBadge.cls}`}>
          {t(statusBadge.labelKey)}
        </span>
        {roleBadge ? (
          <span className={`inline-flex rounded-full px-2 h-[19px] text-[10px] font-medium items-center ${roleBadge.cls}`}>
            {t(roleBadge.labelKey)}
          </span>
        ) : null}
      </div>
    </Link>
  );
}
