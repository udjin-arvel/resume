import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import {
  Search,
  Plus,
  ChevronDown,
  Filter,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { LoadingSkeleton } from "@/components/common/LoadingSpinner";
import { PageError } from "@/components/common/PageError";
import { EmptyState } from "@/components/common/EmptyState";
import { WorkerCard } from "@/components/workers/WorkerCard";
import { useWorkers, useWorkerResources } from "@/lib/api/hooks/useWorkers";
import { useProjects } from "@/lib/api/hooks/useProjects";
import {
  type SpecGroup,
  getSpecializationLabel,
  specGroupLabels,
  workerMatchesSpecGroup,
} from "@/lib/constants/worker-specializations";
import { CreateWorkerDialog } from "@/components/workers/CreateWorkerDialog";

type Tab = "pending" | "active" | "blocked" | "rejected" | "resources";

type WorkersSearch = {
  create?: boolean;
  tab?: Tab;
};

export const Route = createFileRoute("/_authenticated/workers/")({
  validateSearch: (search: Record<string, unknown>): WorkersSearch => ({
    create: search.create === "1" || search.create === true ? true : undefined,
    tab:
      search.tab === "pending" ||
      search.tab === "active" ||
      search.tab === "blocked" ||
      search.tab === "rejected" ||
      search.tab === "resources"
        ? search.tab
        : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Работники — Менеджер" },
      { name: "description", content: "Работники: заявки, действующие, заблокированные." },
    ],
  }),
  component: WorkersList,
});

const tabs: { id: Tab; label: string; countTone: "red" | "slate" }[] = [
  { id: "pending", label: "Заявки", countTone: "red" },
  { id: "active", label: "Активные", countTone: "slate" },
  { id: "rejected", label: "Отклонённые", countTone: "slate" },
  { id: "blocked", label: "Архив", countTone: "slate" },
  { id: "resources", label: "Ресурсы", countTone: "slate" },
];

function WorkersList() {
  const { t } = useTranslation();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const tab: Tab = search.tab ?? "pending";
  const [createOpen, setCreateOpen] = useState(false);
  const [q, setQ] = useState("");
  const [specGroup, setSpecGroup] = useState<SpecGroup>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");

  const setTab = (next: Tab) => {
    void navigate({
      to: "/workers",
      search: { tab: next },
      replace: true,
    });
  };

  useEffect(() => {
    if (!search.create) return;
    setTimeout(() => setCreateOpen(true), 500);
    void navigate({
      to: "/workers",
      search: { tab },
      replace: true,
    });
  }, [search.create, navigate, tab]);

  const { data: projectsData } = useProjects({ pageSize: 100 });
  const projectFilters = [
    { id: "all", label: "Все проекты" },
    ...(projectsData?.items ?? []).map((p) => ({ id: p.id, label: p.name })),
  ];

  const listQuery = useWorkers(
    tab !== "resources"
      ? {
          status: tab,
          search: q.trim() || undefined,
          projectId:
            projectFilter !== "all" && projectFilter !== "active" && projectFilter !== "done"
              ? projectFilter
              : undefined,
          pageSize: 100,
        }
      : { status: "pending" as const, pageSize: 1 },
  );

  const pendingCount = useWorkers({ status: "pending", pageSize: 1 });
  const activeCount = useWorkers({ status: "active", pageSize: 1 });
  const rejectedCount = useWorkers({ status: "rejected", pageSize: 1 });
  const blockedCount = useWorkers({ status: "blocked", pageSize: 1 });
  const totalCount = useWorkers({ pageSize: 1 });
  const resources = useWorkerResources();

  const counts: Record<Tab, number> = {
    pending: pendingCount.data?.total ?? 0,
    active: activeCount.data?.total ?? 0,
    rejected: rejectedCount.data?.total ?? 0,
    blocked: blockedCount.data?.total ?? 0,
    resources: totalCount.data?.total ?? 0,
  };

  const workers = listQuery.data?.items ?? [];
  const filtered = workers.filter((w) => workerMatchesSpecGroup(w.position, specGroup));

  const resourceItems = resources.data ?? [];
  const busyCount = resourceItems.reduce((a, s) => a + s.onProject, 0);
  const freeCount = resourceItems.reduce((a, s) => a + s.available, 0);

  return (
    <AppLayout activeNav="workers">
      <PageHeader>
        <div className="space-y-3 py-4">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <h1 className="truncate text-[20px] font-semibold tracking-tight text-slate-900">
              Работники
            </h1>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-900 px-3 py-1 text-[12px] md:text-[14px] font-medium text-white transition hover:bg-slate-800"
            >
              <Plus className="h-3 w-3" />
              Добавить
            </button>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Поиск по имени или специализации"
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
            />
          </div>

          <div className="scrollbar-responsive -mx-1 flex gap-2 overflow-x-auto px-1">
            {tabs.map((t) => {
              const active = t.id === tab;
              const c = counts[t.id];
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-1 text-[12px] md:text-[14px] font-medium transition ${
                    active
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span>{t.label}</span>
                  <span
                    className={`flex min-h-[16px] min-w-[20px] items-center justify-center rounded-full px-1 text-[10px] font-semibold ${
                      active
                        ? "bg-white/15 text-white"
                        : t.id === "pending" && c > 0
                          ? "bg-red-50 text-red-600"
                          : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {c}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </PageHeader>

      <main className="space-y-4 px-4 pt-5 pb-5">
        {tab === "resources" ? (
          resources.isLoading ? (
            <LoadingSkeleton rows={4} />
          ) : resources.isError ? (
            <PageError onRetry={() => resources.refetch()} />
          ) : (
            <ResourcesView
              stats={resourceItems}
              total={counts.resources}
              busy={busyCount}
              free={freeCount}
              pending={counts.pending}
              t={t}
            />
          )
        ) : (
          <>
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-[14px] font-semibold tracking-wide text-slate-500">
                <Filter className="h-3 w-3" /> 
                Специализация
              </div>
              <div className="scrollbar-responsive -mx-1 flex gap-2 overflow-x-auto px-1">
                {specGroupLabels.map((s) => {
                  const active = s.id === specGroup;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSpecGroup(s.id)}
                      className={`shrink-0 rounded-full border px-3 py-1 text-[12px] md:text-[14px] font-medium transition ${
                        active
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {t(s.labelKey)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-[14px] font-semibold tracking-wide text-slate-500">
                <Filter className="h-3 w-3" /> 
                Проект
              </div>
              <div className="scrollbar-responsive -mx-1 flex gap-2 overflow-x-auto px-1">
                {projectFilters.map((p) => {
                  const active = p.id === projectFilter;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setProjectFilter(p.id)}
                      className={`shrink-0 rounded-full border px-3 py-1 text-[12px] md:text-[14px] font-medium transition ${
                        active
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3 pt-1">
              {listQuery.isLoading ? (
                <LoadingSkeleton rows={4} />
              ) : listQuery.isError ? (
                <PageError onRetry={() => listQuery.refetch()} />
              ) : filtered.length === 0 ? (
                <EmptyState title="Никого не найдено" />
              ) : (
                filtered.map((w) => <WorkerCard key={w.id} worker={w} />)
              )}
            </div>
          </>
        )}
      </main>

      <CreateWorkerDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => setTab("active")}
      />
    </AppLayout>
  );
}

type ResourceStat = {
  specialization: string;
  total: number;
  available: number;
  onProject: number;
};

function ResourcesView({
  stats,
  total,
  busy,
  free,
  pending,
  t,
}: {
  stats: ResourceStat[];
  total: number;
  busy: number;
  free: number;
  pending: number;
  t: TFunction;
}) {
  const [openSpec, setOpenSpec] = useState<string | null>(null);

  const totalAll = stats.reduce((a, s) => a + s.total, 0) || total;
  const busyAll = stats.reduce((a, s) => a + s.onProject, 0) || busy;
  const freeAll = stats.reduce((a, s) => a + s.available, 0) || free;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-2.5">
        <SummaryCard label="Всего работников" value={totalAll} tone="slate" />
        <SummaryCard label="Задействованы" value={busyAll} tone="slate" />
        <SummaryCard label="Свободны" value={freeAll} tone="emerald" />
        <SummaryCard label="Заявки" value={pending} tone="red" />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-[14px] tracking-wide text-slate-500">
          Разбивка по специализациям
        </div>
        {stats.length === 0 ? (
          <EmptyState title="Нет данных по специализациям" />
        ) : (
          <div className="space-y-2.5">
            {stats.map((s) => {
              const open = openSpec === s.specialization;
              const freePct = s.total ? Math.round((s.available / s.total) * 100) : 0;
              return (
                <div
                  key={s.specialization}
                  className="card-hover overflow-hidden rounded-2xl border border-slate-200 bg-white"
                >
                  <button
                    type="button"
                    onClick={() => setOpenSpec(open ? null : s.specialization)}
                    className="w-full px-4 py-3.5 text-left"
                  >
                    <div className="flex items-start gap-2">
                      <ChevronDown
                        className={`mt-0.5 h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
                        aria-hidden="true"
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-semibold text-slate-900">
                          {getSpecializationLabel(s.specialization, t) || s.specialization}
                        </h3>
                        <p className="mt-0.5 text-xs text-slate-500">Всего {s.total}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div className="bg-emerald-500" style={{ width: `${freePct}%` }} />
                      <div className="bg-slate-700" style={{ width: `${100 - freePct}%` }} />
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-[10px] tracking-wide">
                      <span className="text-emerald-600">Свободно {s.available}</span>
                      <span className="text-slate-500">Задействовано {s.onProject}</span>
                    </div>
                  </button>

                  {open && (
                    <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-3">
                      <p className="py-2 text-center text-xs text-slate-400">
                        Нет данных о работниках
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "slate" | "emerald" | "red";
}) {
  const toneCls =
    tone === "emerald"
      ? "text-emerald-600"
      : tone === "red"
        ? "text-red-600"
        : "text-slate-900";
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-[11px] tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tracking-tight ${toneCls}`}>{value}</p>
    </div>
  );
}
