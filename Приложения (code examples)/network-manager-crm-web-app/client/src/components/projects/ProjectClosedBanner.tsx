import { formatDate } from "@/lib/format";
import type { z } from "zod";
import type { projectSchema } from "@/lib/api/schemas";

type Project = z.infer<typeof projectSchema>;

type ProjectClosedBannerProps = {
  project: Project;
};

export function ProjectClosedBanner({ project }: ProjectClosedBannerProps) {
  if (project.status !== "done") return null;

  const closedDate = project.endDate ? formatDate(project.endDate) : "—";

  return (
    <div className="overflow-hidden rounded-2xl border border-red-200 bg-red-50 px-4 py-4">
      <p className="text-sm font-semibold text-red-700">Проект завершён</p>
      <p className="mt-2 text-xs text-red-600/80">
        Редактирование недоступно. Дата окончания: {closedDate}
      </p>
    </div>
  );
}
