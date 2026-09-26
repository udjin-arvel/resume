import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";
import { WorkerAppLayout } from "@/components/layout/WorkerAppLayout";
import { EmptyState } from "@/components/common/EmptyState";
import { PageError } from "@/components/common/PageError";
import { FilterDropdown } from "@/components/common/FilterDropdown";
import { ProjectTabBar } from "@/components/projects/ProjectTabBar";
import { WorkerReportCard } from "@/components/worker/reports/WorkerReportCard";
import { SupervisorReportCard } from "@/components/worker/reports/SupervisorReportCard";
import { useMyProjects } from "@/lib/api/hooks/useProjects";
import { useSupervisorReports, useWorkerReports } from "@/lib/api/hooks/useReports";
import { filterProjectsByRole } from "@/lib/worker-projects";
import {
  buildReportListQuery,
  getReportTypeAvailability,
  parseReportStatusFilter,
  REPORT_TYPE_TABS,
  resolveReportTypeTab,
  WEEKLY_STATUS_TABS,
  type ReportStatusFilter,
  type ReportTypeTab,
} from "@/lib/worker-reports";

type Search = {
  type?: string;
  status?: string;
  projectId?: string;
};

export const Route = createFileRoute("/_worker/worker/reports/")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    type: typeof search.type === "string" ? search.type : undefined,
    status: typeof search.status === "string" ? search.status : undefined,
    projectId: typeof search.projectId === "string" ? search.projectId : undefined,
  }),
  head: () => ({ meta: [{ title: "Мои отчёты — Работник" }] }),
  component: WorkerReportsPage,
});

function WorkerReportsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const search = Route.useSearch();

  const { data: projects } = useMyProjects({
    status: "active",
    confirmationStatus: "confirmed",
  });

  const projectList = projects ?? [];
  const availability = useMemo(
    () => getReportTypeAvailability(projectList),
    [projectList],
  );

  const activeTypeTab = useMemo(
    () => resolveReportTypeTab(projectList, search.type, search.projectId),
    [projectList, search.type, search.projectId],
  );

  const statusFilter = parseReportStatusFilter(search.status);
  const projectId = search.projectId ?? "all";

  const roleProjects = useMemo(
    () =>
      filterProjectsByRole(
        projectList,
        activeTypeTab === "daily" ? "supervisor" : "worker",
      ),
    [projectList, activeTypeTab],
  );

  const effectiveProjectId =
    projectId !== "all" && roleProjects.some((p) => p.id === projectId) ? projectId : "all";

  const listQuery = buildReportListQuery(statusFilter, effectiveProjectId);
  const weeklyQuery = useWorkerReports(listQuery, availability.hasWorkerProjects);
  const dailyQuery = useSupervisorReports(listQuery, availability.hasSupervisorProjects);

  const showTypeTabs = availability.hasWorkerProjects && availability.hasSupervisorProjects;

  const typeTabs = REPORT_TYPE_TABS.map((tab) => ({
    id: tab.id,
    label: t(tab.labelKey),
  }));

  const statusTabs = WEEKLY_STATUS_TABS.map((tab) => ({
    id: tab.id,
    label: t(tab.labelKey),
  }));

  const projectOptions = [
    { value: "all", label: t("worker.reports.filters.allProjects") },
    ...roleProjects.map((p) => ({ value: p.id, label: p.name })),
  ];

  const createLink = useMemo(() => {
    const searchParams =
      effectiveProjectId !== "all" ? { projectId: effectiveProjectId } : undefined;

    if (activeTypeTab === "daily") {
      return {
        to: "/worker/daily-reports/new" as const,
        search: searchParams,
      };
    }
    return {
      to: "/worker/reports/new" as const,
      search: searchParams,
    };
  }, [activeTypeTab, effectiveProjectId]);

  const buildSearch = (
    overrides: Partial<{ type: ReportTypeTab; status: ReportStatusFilter; projectId: string }>,
  ) => {
    const type = overrides.type ?? activeTypeTab;
    const status = overrides.status ?? statusFilter;
    const nextProjectId = overrides.projectId ?? effectiveProjectId;

    return {
      type: showTypeTabs ? type : undefined,
      status: status === "all" ? undefined : status,
      projectId: nextProjectId === "all" ? undefined : nextProjectId,
    };
  };

  const setTypeTab = (type: ReportTypeTab) => {
    const nextRoleProjects = filterProjectsByRole(
      projectList,
      type === "daily" ? "supervisor" : "worker",
    );
    const keepProject =
      effectiveProjectId !== "all" &&
      nextRoleProjects.some((p) => p.id === effectiveProjectId);

    void navigate({
      to: "/worker/reports",
      search: buildSearch({
        type,
        projectId: keepProject ? effectiveProjectId : "all",
      }),
    });
  };

  const setStatus = (status: ReportStatusFilter) => {
    void navigate({
      to: "/worker/reports",
      search: buildSearch({ status }),
    });
  };

  const setProject = (value: string) => {
    void navigate({
      to: "/worker/reports",
      search: buildSearch({ projectId: value }),
    });
  };

  const activeQuery = activeTypeTab === "daily" ? dailyQuery : weeklyQuery;
  const weeklyItems = weeklyQuery.data?.items;
  const dailyItems = dailyQuery.data?.items;
  const hasItems = activeTypeTab === "daily" ? !!dailyItems?.length : !!weeklyItems?.length;

  const noProjectsForTab =
    activeTypeTab === "daily"
      ? !availability.hasSupervisorProjects
      : !availability.hasWorkerProjects;

  const emptyTitle = noProjectsForTab
    ? activeTypeTab === "daily"
      ? t("worker.reports.emptyNoSupervisorProjects")
      : t("worker.reports.emptyNoWorkerProjects")
    : t("worker.reports.empty");

  return (
    <WorkerAppLayout
      activeNav="reports"
      className="bg-[#F1F5F9]"
      title={t("worker.reports.title")}
      headerRight={
        !noProjectsForTab ? (
          <Link
            to={createLink.to}
            search={createLink.search}
            className="inline-flex items-center gap-1 rounded-full bg-[#1A1C29] px-3 py-1.5 text-[12px] font-medium text-white"
          >
            <Plus className="h-3 w-3" />
            {t("worker.reports.createShort")}
          </Link>
        ) : null
      }
    >
      <div className="space-y-3 px-4 py-5">
        {showTypeTabs ? (
          <ProjectTabBar tabs={typeTabs} activeTab={activeTypeTab} onChange={setTypeTab} />
        ) : null}

        {!noProjectsForTab ? (
          <>
            <ProjectTabBar tabs={statusTabs} activeTab={statusFilter} onChange={setStatus} />

            <FilterDropdown
              options={projectOptions}
              value={effectiveProjectId}
              onChange={setProject}
            />
          </>
        ) : null}

        {noProjectsForTab ? (
          <EmptyState title={emptyTitle} />
        ) : activeQuery.isLoading ? (
          <div className="space-y-3 pt-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-36 animate-pulse rounded-2xl bg-gray-100" />
            ))}
          </div>
        ) : activeQuery.isError ? (
          <PageError onRetry={() => activeQuery.refetch()} />
        ) : !hasItems ? (
          <EmptyState title={emptyTitle} />
        ) : (
          <div className="flex flex-col gap-3 pt-1">
            {activeTypeTab === "daily"
              ? dailyItems?.map((r) => <SupervisorReportCard key={r.id} report={r} />)
              : weeklyItems?.map((r) => <WorkerReportCard key={r.id} report={r} />)}
          </div>
        )}
      </div>
    </WorkerAppLayout>
  );
}
