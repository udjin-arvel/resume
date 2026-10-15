import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Users } from "lucide-react";
import { WorkerAppLayout } from "@/components/layout/WorkerAppLayout";
import { LoadingSkeleton } from "@/components/common/LoadingSpinner";
import { PageError } from "@/components/common/PageError";
import { useMyProject, useProjectCrew } from "@/lib/api/hooks/useProjects";

export const Route = createFileRoute("/_worker/worker/projects/$projectId/team")({
  head: () => ({ meta: [{ title: "Команда проекта" }] }),
  component: WorkerProjectTeamPage,
});

function WorkerProjectTeamPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { projectId } = Route.useParams();
  const { data: project, isLoading: projectLoading } = useMyProject(projectId);
  const isSupervisor = project?.role === "supervisor";
  const {
    data: crew,
    isLoading: crewLoading,
    isError,
    refetch,
  } = useProjectCrew(projectId, isSupervisor);

  useEffect(() => {
    if (!projectLoading && project && !isSupervisor) {
      void navigate({
        to: "/worker/projects/$projectId",
        params: { projectId },
        replace: true,
      });
    }
  }, [projectLoading, project, isSupervisor, navigate, projectId]);

  if (projectLoading || crewLoading) {
    return (
      <WorkerAppLayout
        activeNav="projects"
        title={t("worker.projects.actions.team")}
        showBack
        backTo={`/worker/projects/${projectId}`}
        showNav={false}
      >
        <LoadingSkeleton rows={5} />
      </WorkerAppLayout>
    );
  }

  if (isError) {
    return (
      <WorkerAppLayout
        activeNav="projects"
        title={t("worker.projects.actions.team")}
        showBack
        backTo={`/worker/projects/${projectId}`}
        showNav={false}
      >
        <PageError onRetry={() => refetch()} />
      </WorkerAppLayout>
    );
  }

  return (
    <WorkerAppLayout
      activeNav="projects"
      title={t("worker.projects.actions.team")}
      showBack
      backTo="/worker/projects/$projectId"
      showNav={false}
      className="bg-[#F1F5F9]"
    >
      <div className="space-y-3 px-4 pt-4 pb-8">
        <ul className="divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white">
          {(crew ?? []).map((member) => (
            <li key={member.id} className="flex items-center justify-between gap-3 p-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100">
                  <Users className="h-4 w-4 text-gray-500" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[#1F2937]">
                    {member.firstName} {member.lastName}
                  </p>
                  <p className="text-xs text-[#9CA3AF]">
                    {member.role === "supervisor"
                      ? t("worker.projects.contactSupervisor")
                      : t("worker.projects.workerRole")}
                  </p>
                </div>
              </div>
              {member.confirmationStatus === "pending" ? (
                <span className="shrink-0 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-medium text-orange-600">
                  {t("worker.projects.status.invitation")}
                </span>
              ) : member.confirmationStatus === "rejected" ? (
                <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-600">
                  {t("worker.projects.status.declined")}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </WorkerAppLayout>
  );
}
