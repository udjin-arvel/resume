import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { LoadingSkeleton } from "@/components/common/LoadingSpinner";
import { PageError } from "@/components/common/PageError";
import { useWorkerProjects } from "@/lib/api/hooks/useWorkers";
import { projectStatusMeta } from "@/lib/constants/status";

type WorkerProjectsTabProps = {
  workerId: string;
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="px-1 text-[12px] font-semibold tracking-wide text-slate-400">
      {children}
    </h3>
  );
}

export function WorkerProjectsTab({ workerId }: WorkerProjectsTabProps) {
  const projectsQuery = useWorkerProjects(workerId);

  if (projectsQuery.isLoading) {
    return <LoadingSkeleton rows={4} />;
  }

  if (projectsQuery.isError) {
    return <PageError onRetry={() => projectsQuery.refetch()} />;
  }

  const projects = projectsQuery.data ?? [];
  const active = projects.filter((p) => p.status === "active");
  const completed = projects.filter((p) => p.status !== "active");

  return (
    <div className="space-y-2">
      <div>
        <SectionTitle>Текущие проекты</SectionTitle>
        {active.length === 0 ? (
          <p className="px-1 text-[12px] text-slate-400">Нет данных</p>
        ) : (
          <div className="space-y-2 mb-4">
            {active.map((project) => (
              <ProjectRow key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>

      <div>
        <SectionTitle>Завершённые проекты</SectionTitle>
        {completed.length === 0 ? (
          <p className="px-1 text-[12px] text-slate-400">Нет данных</p>
        ) : (
          <div className="space-y-2">
            {completed.map((project) => (
              <ProjectRow key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProjectRow({
  project,
}: {
  project: {
    id: string;
    name: string;
    clientName: string;
    status: string;
    role: string;
  };
}) {
  const statusMeta = projectStatusMeta[project.status] ?? projectStatusMeta.active;

  return (
    <Link
      to="/projects/$projectId"
      params={{ projectId: project.id }}
      className="flex items-center gap-3 rounded-[12px] bg-white px-4 py-3 transition hover:bg-slate-50"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-900">{project.name}</p>
        <p className="truncate text-xs text-slate-500">
          {project.clientName || "—"} · {project.role}
        </p>
      </div>
      <span
        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusMeta.cls}`}
      >
        {statusMeta.label}
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
    </Link>
  );
}
