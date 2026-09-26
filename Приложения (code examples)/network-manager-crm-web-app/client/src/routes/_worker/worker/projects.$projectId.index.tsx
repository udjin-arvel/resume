import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { FileBarChart } from "lucide-react";
import { WorkerAppLayout } from "@/components/layout/WorkerAppLayout";
import { LoadingSkeleton } from "@/components/common/LoadingSpinner";
import { PageError } from "@/components/common/PageError";
import { Button } from "@/components/ui/button";
import { useMyProject } from "@/lib/api/hooks/useProjects";
import { getProjectRoleBadge, getWorkerProjectStatusBadge } from "@/lib/worker-projects";
import { ProjectMetaInfo } from "@/components/worker/projects/ProjectMetaInfo";
import { SupervisorActionBlock } from "@/components/worker/projects/SupervisorActionBlock";
import { ProjectDocumentsSection } from "@/components/worker/projects/ProjectDocumentsSection";
import { ProjectContactsSection } from "@/components/worker/projects/ProjectContactsSection";
import { InvitationActionFooter } from "@/components/worker/projects/InvitationActionFooter";

export const Route = createFileRoute("/_worker/worker/projects/$projectId/")({
  head: ({ params }) => ({ meta: [{ title: `Проект — ${params.projectId}` }] }),
  component: WorkerProjectDetailPage,
});

function WorkerProjectDetailPage() {
  const { t } = useTranslation();
  const { projectId } = Route.useParams();
  const { data: project, isLoading, isError, refetch } = useMyProject(projectId);

  if (isLoading) {
    return (
      <WorkerAppLayout activeNav="projects" showBack backTo="/worker/projects">
        <LoadingSkeleton rows={6} />
      </WorkerAppLayout>
    );
  }

  if (isError || !project) {
    return (
      <WorkerAppLayout activeNav="projects" showBack backTo="/worker/projects">
        <PageError onRetry={() => refetch()} />
      </WorkerAppLayout>
    );
  }

  const statusBadge = getWorkerProjectStatusBadge(project);
  const roleBadge =
    project.confirmationStatus !== "declined" ? getProjectRoleBadge(project.role) : null;
  const isSupervisor = project.role === "supervisor";
  const isPending = project.confirmationStatus === "pending";
  const showWorkerReport =
    !isSupervisor &&
    project.confirmationStatus === "confirmed" &&
    project.status === "active";

  return (
    <WorkerAppLayout
      activeNav="projects"
      title={project.name}
      showBack
      backTo="/worker/projects"
      className="bg-[#F1F5F9]"
      headerExtra={<ProjectMetaInfo project={project} />}
      headerRight={
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          {roleBadge ? (
            <span
              className={`flex rounded-full px-2 h-[19px] text-[10px] font-medium items-center ${roleBadge.cls}`}
            >
              {t(roleBadge.labelKey)}
            </span>
          ) : null}
          <span
            className={`flex rounded-full px-2 h-[19px] text-[10px] font-medium items-center ${statusBadge.cls}`}
          >
            {t(statusBadge.labelKey)}
          </span>
        </div>
      }
    >
      <div className="space-y-5 px-4 py-5">
        {isSupervisor ? <SupervisorActionBlock projectId={project.id} /> : null}

        {showWorkerReport ? (
          <Button asChild className="w-full rounded-full">
            <Link to="/worker/reports/new" search={{ projectId: project.id }}>
              <FileBarChart className="mr-2 h-4 w-4" />
              {t("worker.projects.createReport")}
            </Link>
          </Button>
        ) : null}

        <ProjectDocumentsSection projectId={project.id} />
        <ProjectContactsSection contacts={project.contacts} />

        {isPending ? <InvitationActionFooter projectId={project.id} /> : null}
      </div>
    </WorkerAppLayout>
  );
}
