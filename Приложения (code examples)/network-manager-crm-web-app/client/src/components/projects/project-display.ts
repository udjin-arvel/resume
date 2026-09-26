import type { z } from "zod";
import type { projectSchema } from "@/lib/api/schemas";
import { siteStatusMeta } from "@/lib/constants/status";

type Project = z.infer<typeof projectSchema>;

export type ProjectProblem = {
  id: string;
  title: string;
  description: string;
};

export function daysLeft(endDate: string | null | undefined): number | null {
  if (!endDate) return null;
  const end = endDate.includes("T")
    ? new Date(endDate)
    : new Date(endDate + "T23:59:59");
  if (Number.isNaN(end.getTime())) return null;
  const diff = Math.ceil((end.getTime() - Date.now()) / 86_400_000);
  return diff >= 0 ? diff : null;
}

export function buildProjectProblems(project: Project): ProjectProblem[] {
  const problems: ProjectProblem[] = [];
  const isActive = project.status === "active";

  if (isActive && project.siteStatus === "issue") {
    const meta = siteStatusMeta.issue;
    problems.push({
      id: "site-issue",
      title: "Есть проблемы на объекте",
      description: meta.label,
    });
  }

  if (isActive && project.siteStatus === "downtime") {
    const meta = siteStatusMeta.downtime;
    const hours = project.downtimeHours ? ` · ${project.downtimeHours} ч` : "";
    problems.push({
      id: "site-downtime",
      title: "Простой на объекте",
      description: `${meta.label}${hours}`,
    });
  }

  const unconfirmed = project.workers - project.confirmed;
  if (unconfirmed > 0) {
    problems.push({
      id: "unconfirmed-workers",
      title: "Не подтвердили участие",
      description: `${unconfirmed} работник(ов)`,
    });
  }

  if (project.reportsOnReview > 0) {
    problems.push({
      id: "reports-review",
      title: "Отчёты на проверке",
      description: `${project.reportsOnReview} отчёт(ов)`,
    });
  }

  return problems;
}
