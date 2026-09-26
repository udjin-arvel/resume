import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import type { z } from "zod";
import {
  Search,
  Briefcase,
  UserCog,
} from "lucide-react";
import { ReportCard } from "@/components/reports/ReportCard";
import { ManagerSupervisorReportCard } from "@/components/reports/ManagerSupervisorReportCard";
import {
  ReportsFilterBar,
  type ReportsFilterKey,
} from "@/components/reports/ReportsFilterBar";
import { ReportsFilterSheet } from "@/components/reports/ReportsFilterSheet";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { LoadingSkeleton } from "@/components/common/LoadingSpinner";
import { PageError } from "@/components/common/PageError";
import { EmptyState } from "@/components/common/EmptyState";
import { useClients } from "@/lib/api/hooks/useClients";
import { useProjects } from "@/lib/api/hooks/useProjects";
import {
  useSupervisorReports,
  useWorkerReports,
} from "@/lib/api/hooks/useReports";
import {
  workerReportSchema,
} from "@/lib/api/schemas";
import { formatDate } from "@/lib/format";
import { statusToApiFilter, type ReportStatusFilter } from "@/lib/worker-reports";

export const Route = createFileRoute("/_authenticated/reports/")({
  head: () => ({
    meta: [
      { title: "Отчёты — Менеджер" },
      { name: "description", content: "Еженедельные отчёты работников и ежедневные отчёты супервайзеров." },
    ],
  }),
  component: ReportsList,
});

type WorkerReport = z.infer<typeof workerReportSchema>;

const workerStatusFilters: { id: "all" | string; label: string }[] = [
  { id: "all", label: "Все" },
  { id: "review", label: "На проверке" },
  { id: "approved", label: "Приняты" },
  { id: "returned", label: "Возвращены" },
  { id: "overdue", label: "Просрочены" },
];

const dailyStatusFilters: { id: "all" | string; label: string }[] = [
  { id: "all", label: "Все" },
  { id: "review", label: "На проверке" },
  { id: "approved", label: "Принят" },
  { id: "issue", label: "Есть проблема" },
  { id: "downtime", label: "Есть простой" },
];

type TopTab = "workers" | "supervisors";

function ReportsList() {
  const [tab, setTab] = useState<TopTab>("workers");

  return (
    <AppLayout activeNav="reports">
      <PageHeader>
        <div className="space-y-3 py-4">
          <h1 className="text-[20px] font-semibold tracking-tight text-slate-900">Отчёты</h1>
          <div className="grid grid-cols-2 gap-1 rounded-[14px] bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setTab("workers")}
              className={`rounded-[10px] py-2 text-xs font-semibold transition ${
                tab === "workers" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
              }`}
            >
              Работников
            </button>
            <button
              type="button"
              onClick={() => setTab("supervisors")}
              className={`rounded-[10px] py-2 text-xs font-semibold transition ${
                tab === "supervisors" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
              }`}
            >
              Супервайзеров
            </button>
          </div>
        </div>
      </PageHeader>

      {tab === "workers" ? <WorkersReports /> : <SupervisorReports />}
    </AppLayout>
  );
}

const filterSheetMeta: Record<
  ReportsFilterKey,
  { title: string; searchPlaceholder: string }
> = {
  clients: { title: "Клиенты", searchPlaceholder: "Поиск по клиентам" },
  projects: { title: "Проекты", searchPlaceholder: "Поиск по проектам" },
  workers: { title: "Работники", searchPlaceholder: "Поиск по работникам" },
};

function WorkersReports() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [clientIds, setClientIds] = useState<string[]>([]);
  const [projectIds, setProjectIds] = useState<string[]>([]);
  const [workerIds, setWorkerIds] = useState<string[]>([]);
  const [openFilter, setOpenFilter] = useState<ReportsFilterKey | null>(null);

  const { data: clientsData } = useClients({ pageSize: 100 });
  const { data: projectsData } = useProjects({ pageSize: 100 });

  const reportsQuery = useWorkerReports({
    status: status !== "all" ? statusToApiFilter(status as ReportStatusFilter) : undefined,
    projectId: projectIds.length === 1 ? projectIds[0] : undefined,
    clientId: clientIds.length === 1 ? clientIds[0] : undefined,
    pageSize: 100,
  });

  const items = reportsQuery.data?.items ?? [];

  const projectClientMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const project of projectsData?.items ?? []) {
      map.set(project.id, project.clientId);
    }
    return map;
  }, [projectsData]);

  const clientOptions = useMemo(
    () => (clientsData?.items ?? []).map((c) => ({ id: c.id, label: c.name })),
    [clientsData],
  );

  const projectOptions = useMemo(
    () => (projectsData?.items ?? []).map((p) => ({ id: p.id, label: p.name })),
    [projectsData],
  );

  const workerOptions = useMemo(
    () =>
      Array.from(
        new Map(
          items.map((r) => [
            r.workerId,
            { id: r.workerId, label: r.workerName ?? r.workerId },
          ]),
        ).values(),
      ),
    [items],
  );

  const filtered = items.filter((r) => {
    if (clientIds.length > 0) {
      const reportClientId = projectClientMap.get(r.projectId);
      if (!reportClientId || !clientIds.includes(reportClientId)) return false;
    }
    if (projectIds.length > 0 && !projectIds.includes(r.projectId)) return false;
    if (workerIds.length > 0 && !workerIds.includes(r.workerId)) return false;
    if (q.trim()) {
      const s = q.toLowerCase();
      const hay = `${r.workerName ?? ""} ${r.projectName ?? ""} ${formatDate(r.weekStart)}`.toLowerCase();
      if (!hay.includes(s)) return false;
    }
    return true;
  });

  const filterSelections: Record<ReportsFilterKey, string[]> = {
    clients: clientIds,
    projects: projectIds,
    workers: workerIds,
  };

  const filterOptions: Record<ReportsFilterKey, { id: string; label: string }[]> = {
    clients: clientOptions,
    projects: projectOptions,
    workers: workerOptions,
  };

  const setFilterSelection = (key: ReportsFilterKey, ids: string[]) => {
    if (key === "clients") setClientIds(ids);
    else if (key === "projects") setProjectIds(ids);
    else setWorkerIds(ids);
  };

  return (
    <main className="space-y-4 px-4 pt-5 pb-5">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Поиск по работнику, проекту, неделе"
          className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
        />
      </div>

      <div className="scrollbar-responsive -mx-1 flex gap-2 overflow-x-auto px-1">
        {workerStatusFilters.map((s) => {
          const active = s.id === status;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setStatus(s.id)}
              className={`shrink-0 rounded-full border px-3 py-1 text-[12px] md:text-[14px] font-medium transition ${
                active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      <ReportsFilterBar
        activeCounts={{
          clients: clientIds.length,
          projects: projectIds.length,
          workers: workerIds.length,
        }}
        onOpen={setOpenFilter}
      />

      {openFilter ? (
        <ReportsFilterSheet
          open={openFilter !== null}
          onOpenChange={(open) => {
            if (!open) setOpenFilter(null);
          }}
          title={filterSheetMeta[openFilter].title}
          searchPlaceholder={filterSheetMeta[openFilter].searchPlaceholder}
          options={filterOptions[openFilter]}
          selectedIds={filterSelections[openFilter]}
          onApply={(ids) => setFilterSelection(openFilter, ids)}
        />
      ) : null}

      <div className="space-y-3 pt-1">
        {reportsQuery.isLoading ? (
          <LoadingSkeleton rows={4} />
        ) : reportsQuery.isError ? (
          <PageError onRetry={() => reportsQuery.refetch()} />
        ) : filtered.length === 0 ? (
          <EmptyState title="Отчётов не найдено" />
        ) : (
          filtered.map((r) => <ReportCard key={r.id} report={r} />)
        )}
      </div>
    </main>
  );
}

function SupervisorReports() {
  const [project, setProject] = useState<string>("all");
  const [supervisor, setSupervisor] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");

  const { data: projectsData } = useProjects({ pageSize: 100 });

  const apiStatus =
    status === "review" || status === "approved" || status === "attention"
      ? status
      : undefined;

  const apiSiteStatus =
    status === "issue" || status === "downtime" ? status : undefined;

  const reportsQuery = useSupervisorReports({
    status: apiStatus,
    siteStatus: apiSiteStatus,
    projectId: project !== "all" ? project : undefined,
    supervisorId: supervisor !== "all" ? supervisor : undefined,
    pageSize: 100,
  });

  const items = reportsQuery.data?.items ?? [];

  const supervisorOptions = [
    { id: "all", label: "Все супервайзеры" },
    ...Array.from(
      new Map(
        items.map((r) => [
          r.supervisorId,
          { id: r.supervisorId, label: r.supervisorName ?? r.supervisorId },
        ]),
      ).values(),
    ),
  ];

  const projectOptions = [
    { id: "all", label: "Все проекты" },
    ...(projectsData?.items ?? []).map((p) => ({ id: p.id, label: p.name })),
  ];

  const filtered = items;

  return (
    <main className="space-y-4 px-4 pt-5 pb-5">
      <div className="scrollbar-responsive -mx-1 flex gap-2 overflow-x-auto px-1">
        {dailyStatusFilters.map((s) => {
          const active = s.id === status;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setStatus(s.id)}
              className={`shrink-0 rounded-full border px-3 py-1 text-[12px] md:text-[14px] font-medium transition ${
                active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      <FilterRow icon={Briefcase} label="Проект" options={projectOptions} value={project} onChange={setProject} />
      <FilterRow
        icon={UserCog}
        label="Супервайзер"
        options={supervisorOptions}
        value={supervisor}
        onChange={setSupervisor}
      />

      <div className="space-y-3 pt-1">
        {reportsQuery.isLoading ? (
          <LoadingSkeleton rows={4} />
        ) : reportsQuery.isError ? (
          <PageError onRetry={() => reportsQuery.refetch()} />
        ) : filtered.length === 0 ? (
          <EmptyState title="Отчётов не найдено" />
        ) : (
          filtered.map((r) => <ManagerSupervisorReportCard key={r.id} report={r} />)
        )}
      </div>
    </main>
  );
}

function FilterRow({
  icon: Icon,
  label,
  options,
  value,
  onChange,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  options: { id: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-slate-400">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className="scrollbar-responsive -mx-1 flex gap-2 overflow-x-auto px-1">
        {options.map((o) => {
          const active = o.id === value;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => onChange(o.id)}
              className={`shrink-0 rounded-full border px-3 py-1 text-[12px] md:text-[14px] font-medium transition ${
                active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
