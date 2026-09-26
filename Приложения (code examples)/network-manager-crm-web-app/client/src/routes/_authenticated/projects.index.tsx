import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Search, Plus, Filter } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { CreateProjectDialog } from "@/components/projects/CreateProjectDialog";
import { ClientCard } from "@/components/clients/ClientCard";
import { CreateClientDialog } from "@/components/clients/CreateClientDialog";
import { LoadingSkeleton } from "@/components/common/LoadingSpinner";
import { PageError } from "@/components/common/PageError";
import { EmptyState } from "@/components/common/EmptyState";
import { useProjects } from "@/lib/api/hooks/useProjects";
import { useClients } from "@/lib/api/hooks/useClients";

export const Route = createFileRoute("/_authenticated/projects/")({
  validateSearch: (s: Record<string, unknown>) => ({
    create: s.create === "1" || s.create === true ? true : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Проекты — Менеджер" },
      { name: "description", content: "Все проекты и клиенты менеджера." },
    ],
  }),
  component: ProjectsList,
});

type ProjectStatus = "active" | "done" | "archive";

const tabs: { id: ProjectStatus | "all"; label: string }[] = [
  { id: "all", label: "Все" },
  { id: "active", label: "Активные" },
  { id: "done", label: "Завершённые" },
  { id: "archive", label: "Архив" },
];

type View = "projects" | "clients";

const STAGGER_STEP_MS = 30;
const STAGGER_MAX_INDEX = 12;

function staggerStyle(index: number): CSSProperties {
  return { "--stagger-delay": `${Math.min(index, STAGGER_MAX_INDEX) * STAGGER_STEP_MS}ms` } as CSSProperties;
}

function ScrollableChipRow({
  activeId,
  children,
}: {
  activeId: string;
  children: ReactNode;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const activeChip = container.querySelector<HTMLElement>(`[data-chip-id="${activeId}"]`);
    activeChip?.scrollIntoView({ inline: "center", behavior: "smooth", block: "nearest" });
  }, [activeId]);

  return (
    <div className="-mx-1">
      <div ref={scrollRef} className="scrollbar-responsive flex gap-2 overflow-x-auto px-1">
        {children}
      </div>
    </div>
  );
}

function ProjectsList() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [view, setView] = useState<View>("projects");
  const [tab, setTab] = useState<ProjectStatus | "all">("all");
  const [clientId, setClientId] = useState<string>("all");
  const [q, setQ] = useState("");
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [createClientOpen, setCreateClientOpen] = useState(false);

  useEffect(() => {
    if (!search.create) return;
    setTimeout(() => setCreateProjectOpen(true), 500);
    void navigate({
      search: (prev) => ({ ...prev, create: undefined }),
      replace: true,
    });
  }, [search.create, navigate]);

  const projectFilters = {
    status: tab === "all" ? undefined : tab,
    clientId: clientId === "all" ? undefined : clientId,
    search: q.trim() || undefined,
    pageSize: 50,
  };

  const projectsQuery = useProjects(projectFilters);
  const clientsQuery = useClients({ search: q.trim() || undefined, pageSize: 100 });

  const clientsById = useMemo(() => {
    const m = new Map<string, (typeof clientsQuery.data)["items"][number]>();
    for (const c of clientsQuery.data?.items ?? []) m.set(c.id, c);
    return m;
  }, [clientsQuery.data]);

  const clientStats = useMemo(() => {
    const stats = new Map<
      string,
      { active: number; done: number; budget: number; spent: number }
    >();
    for (const p of projectsQuery.data?.items ?? []) {
      const s = stats.get(p.clientId) ?? { active: 0, done: 0, budget: 0, spent: 0 };
      if (p.status === "active") s.active += 1;
      if (p.status === "done") s.done += 1;
      s.budget += Number.parseFloat(p.budget) || 0;
      s.spent += Number.parseFloat(p.spent) || 0;
      stats.set(p.clientId, s);
    }
    return stats;
  }, [projectsQuery.data]);

  const listAnimationKey = `${view}-${tab}-${clientId}-${q.trim()}`;

  return (
    <AppLayout activeNav="projects">
      <PageHeader>
          <div className="space-y-3 py-4">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
              <h1 className="truncate text-[20px] font-semibold tracking-tight text-slate-900">
                Проекты
              </h1>
              <button
                type="button"
                onClick={() =>
                  view === "projects" ? setCreateProjectOpen(true) : setCreateClientOpen(true)
                }
                className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-900 px-2 py-1 text-[12px] md:text-[14px] font-medium text-white transition hover:bg-slate-800"
              >
                <Plus className="h-3 w-3" />
                {view === "projects" ? "Проект" : "Клиент"}
              </button>
            </div>

            <div className="inline-flex w-full rounded-[14px] border border-slate-200 bg-slate-100 p-1">
              {(["projects", "clients"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  className={`flex-1 rounded-[10px] px-3 py-1.5 text-[12px] md:text-[14px] font-medium transition ${
                    v === view
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {v === "projects" ? "Проекты" : "Клиенты"}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={
                  view === "projects"
                    ? "Поиск по названию или локации"
                    : "Поиск по клиенту, городу"
                }
                className="h-10 w-full rounded-[12px] border border-slate-200 bg-white pl-9 pr-3 text-[14px] md:text-[14px] text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
              />
            </div>

            {view === "projects" && (
              <ScrollableChipRow activeId={tab}>
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    data-chip-id={t.id}
                    onClick={() => setTab(t.id)}
                    className={`shrink-0 rounded-full border px-3 py-1 text-[12px] md:text-[14px] font-medium transition ${
                      t.id === tab
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </ScrollableChipRow>
            )}
          </div>
      </PageHeader>

        <main className="space-y-4 px-4 pt-5 pb-5">
          {view === "projects" && (
            <>
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-[12px] tracking-wide text-slate-400">
                  <Filter className="h-3 w-3" /> Клиент
                </div>
                <ScrollableChipRow activeId={clientId}>
                  {[{ id: "all", name: "Все клиенты" }, ...(clientsQuery.data?.items ?? [])].map(
                    (c) => (
                      <button
                        key={c.id}
                        type="button"
                        data-chip-id={c.id}
                        onClick={() => setClientId(c.id)}
                        className={`shrink-0 rounded-full border px-3 py-1 text-[12px] md:text-[14px] font-medium transition ${
                          c.id === clientId
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {c.name}
                      </button>
                    ),
                  )}
                </ScrollableChipRow>
              </div>

              {projectsQuery.isLoading ? (
                <LoadingSkeleton rows={4} />
              ) : projectsQuery.isError ? (
                <PageError onRetry={() => projectsQuery.refetch()} />
              ) : !projectsQuery.data?.items.length ? (
                <EmptyState title="Проекты не найдены" />
              ) : (
                <div key={listAnimationKey} className="space-y-3 pt-1">
                  {projectsQuery.data.items.map((p, index) => {
                    const client = clientsById.get(p.clientId);
                    return (
                      <div key={p.id} className="stagger-item" style={staggerStyle(index)}>
                        <ProjectCard
                          project={p}
                          clientContactPerson={client?.contactPerson}
                          clientEmail={client?.email}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {view === "clients" && (
            <>
              {clientsQuery.isLoading ? (
                <LoadingSkeleton rows={3} />
              ) : clientsQuery.isError ? (
                <PageError onRetry={() => clientsQuery.refetch()} />
              ) : !clientsQuery.data?.items.length ? (
                <EmptyState title="Клиенты не найдены" />
              ) : (
                <div key={listAnimationKey} className="space-y-3">
                  {clientsQuery.data.items.map((c, index) => {
                    const s = clientStats.get(c.id);
                    return (
                      <div key={c.id} className="stagger-item" style={staggerStyle(index)}>
                        <ClientCard
                          client={c}
                          activeCount={s?.active ?? 0}
                          doneCount={s?.done ?? 0}
                          totalBudget={String(s?.budget ?? 0)}
                          totalSpent={String(s?.spent ?? 0)}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </main>

      <CreateProjectDialog open={createProjectOpen} onOpenChange={setCreateProjectOpen} />
      <CreateClientDialog open={createClientOpen} onOpenChange={setCreateClientOpen} />
    </AppLayout>
  );
}
