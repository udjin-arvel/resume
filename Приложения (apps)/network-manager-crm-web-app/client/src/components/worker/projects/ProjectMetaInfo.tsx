import { Calendar, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { z } from "zod";
import type { myProjectSchema } from "@/lib/api/schemas";
import { formatDate } from "@/lib/format";
import { daysLeft } from "@/components/projects/project-display";

type MyProject = z.infer<typeof myProjectSchema>;

type ProjectMetaInfoProps = {
  project: MyProject;
};

export function ProjectMetaInfo({ project }: ProjectMetaInfoProps) {
  const { t } = useTranslation();
  const remaining = daysLeft(project.endDate);
  const period =
    project.startDate || project.endDate
      ? `${project.startDate ? formatDate(project.startDate) : "—"} – ${project.endDate ? formatDate(project.endDate) : "—"}`
      : null;

  // If there is no location and no period, don't show anything
  if (!project.location && !period) return null;

  return (
    <div className="px-3 pb-3 space-y-0.5 text-[12px] text-[#8E97AF]">
      {project.location ? (
        <p className="flex items-center gap-1.5">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{project.location}</span>
        </p>
      ) : null}
      {period ? (
        <div className="flex items-center justify-between gap-3">
          <span className="flex min-w-0 items-center gap-1.5">
            <Calendar className="h-3 w-3 shrink-0" />
            <span className="truncate">{period}</span>
          </span>
          {remaining != null ? (
            <span className="shrink-0">{t("worker.projects.daysLeft", { count: remaining })}</span>
          ) : null}
        </div>
      ) : remaining != null ? (
        <p className="text-right">{t("worker.projects.daysLeft", { count: remaining })}</p>
      ) : null}
    </div>
  );
}
