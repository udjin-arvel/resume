import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { WorkerAppLayout } from "@/components/layout/WorkerAppLayout";
import { EmptyState } from "@/components/common/EmptyState";
import { ProjectTabBar } from "@/components/projects/ProjectTabBar";
import { ProjectAssignmentCard } from "@/components/worker/ProjectAssignmentCard";
import { useMyProjects } from "@/lib/api/hooks/useProjects";
import {
  parseProjectListTab,
  PROJECT_LIST_TABS,
  tabToMineQuery,
  type ProjectListTab,
} from "@/lib/worker-projects";

type Search = { tab?: string };

export const Route = createFileRoute("/_worker/worker/projects/")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    tab: typeof search.tab === "string" ? search.tab : undefined,
  }),
  head: () => ({ meta: [{ title: "Мои проекты — Работник" }] }),
  component: WorkerProjectsPage,
});

function WorkerProjectsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tab: tabParam } = Route.useSearch();
  const activeTab = parseProjectListTab(tabParam);
  const { data: projects, isLoading } = useMyProjects(tabToMineQuery(activeTab));

  const tabs = PROJECT_LIST_TABS.map((tab) => ({
    id: tab.id,
    label: t(tab.labelKey),
  }));

  const setActiveTab = (tab: ProjectListTab) => {
    void navigate({
      to: "/worker/projects",
      search: tab === "all" ? {} : { tab },
    });
  };

  return (
    <WorkerAppLayout
      activeNav="projects"
      className="bg-[#F1F5F9]"
      title={t("worker.projects.title")}
    >
      <div className="space-y-3 px-4 py-5">
        <ProjectTabBar tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        {isLoading ? (
          <div className="mt-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl bg-white" />
            ))}
          </div>
        ) : !projects?.length ? (
          <EmptyState title={t("worker.projects.emptyList")} />
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            {projects.map((p) => (
              <ProjectAssignmentCard key={p.id} project={p} />
            ))}
          </div>
        )}
      </div>
    </WorkerAppLayout>
  );
}
