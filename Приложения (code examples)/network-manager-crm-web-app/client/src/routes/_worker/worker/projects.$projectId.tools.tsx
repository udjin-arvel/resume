import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Wrench } from "lucide-react";
import { WorkerAppLayout } from "@/components/layout/WorkerAppLayout";
import { EmptyState } from "@/components/common/EmptyState";

export const Route = createFileRoute("/_worker/worker/projects/$projectId/tools")({
  head: () => ({ meta: [{ title: "Инструменты проекта" }] }),
  component: WorkerProjectToolsPage,
});

function WorkerProjectToolsPage() {
  const { t } = useTranslation();
  const { projectId } = Route.useParams();

  return (
    <WorkerAppLayout
      activeNav="projects"
      title={t("worker.projects.actions.tools")}
      showBack
      backTo={`/worker/projects/${projectId}`}
      showNav={false}
      className="bg-[#F1F5F9"
    >
      <div className="px-4 pt-8">
        <EmptyState
          icon={Wrench}
          title={t("worker.projects.toolsComingSoon")}
          description={t("worker.projects.toolsComingSoonDescription")}
        />
      </div>
    </WorkerAppLayout>
  );
}
