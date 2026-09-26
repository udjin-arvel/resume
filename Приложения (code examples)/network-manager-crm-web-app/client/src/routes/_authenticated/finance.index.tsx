import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Clock, Receipt, Funnel, Users, Wallet, TrendingUp } from "lucide-react";
import { categoryKey, categoryMeta, type CategoryKey } from "@/lib/finance-categories";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { LoadingSkeleton } from "@/components/common/LoadingSpinner";
import { PageError } from "@/components/common/PageError";
import { EmptyState } from "@/components/common/EmptyState";
import {
  useFinanceCategories,
  useFinanceOverview,
  useFinanceProjectQuery,
  useFinanceWorkerQuery,
  useFinanceProjects,
  useFinanceWorkers,
} from "@/lib/api/hooks/useFinance";
import { budgetSharePct, formatBudgetPercent, formatMoney, parseDecimal } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/finance/")({
  head: () => ({
    meta: [
      { title: "Финансы — Менеджер" },
      { name: "description", content: "Финансы: обзор, проекты, работники, категории расходов." },
    ],
  }),
  component: FinancePage,
});

type Tab = "overview" | "projects" | "workers" | "categories";

const TOP_PROJECTS_PREVIEW = 5;

const tabs: { id: Tab; label: string }[] = [
  { id: "overview", label: "Обзор" },
  { id: "projects", label: "Проекты" },
  { id: "workers", label: "Работники" },
  { id: "categories", label: "Категории" },
];

function FinancePage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [projectStatus, setProjectStatus] = useState<"all" | "active" | "completed">("all");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");

  const projectHeaderQuery = useFinanceProjects({ projectStatus });
  const financeScope = useMemo(
    () => ({
      projectStatus,
      ...(selectedProjectId !== "all" ? { projectId: selectedProjectId } : {}),
    }),
    [projectStatus, selectedProjectId],
  );
  const overviewQuery = useFinanceOverview(financeScope);
  const projectsQuery = useFinanceProjects(financeScope);
  const workersQuery = useFinanceWorkers(financeScope);
  const categoriesQuery = useFinanceCategories(financeScope);

  const filteredProjects = projectsQuery.data ?? [];
  const headerProjects = projectHeaderQuery.data ?? [];
  const isProjectScope = selectedProjectId !== "all";

  const activeQuery =
    tab === "overview"
      ? overviewQuery
      : tab === "projects"
        ? projectsQuery
        : tab === "workers"
          ? workersQuery
          : categoriesQuery;

  return (
    <AppLayout activeNav="finance">
      <PageHeader>
        <div className="space-y-3 py-4">
          <h1 className="text-[20px] font-semibold tracking-tight text-slate-900">Финансы</h1>
          <div className="scrollbar-responsive -mx-1 flex gap-2 overflow-x-auto px-1">
            {tabs.map((t) => {
              const active = t.id === tab;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`shrink-0 rounded-full border px-3 py-1 text-[12px] md:text-[14px] font-medium transition ${
                    active
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
          
        </div>
      </PageHeader>

      <main className="space-y-3 px-4 pt-4 pb-5">
        <div className="flex items-center gap-1 text-[14px] font-semibold text-slate-500">
          <Funnel className="h-3 w-3" />
          Проект
        </div>
        <div className="scrollbar-responsive -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {[
            { id: "all", name: "Все" },
            { id: "active", name: "Активные" },
            { id: "completed", name: "Завершенные" },
          ].map((status) => {
            const active = selectedProjectId === "all" && status.id === projectStatus;
            return (
              <button
                key={status.id}
                type="button"
                onClick={() => {
                  setProjectStatus(status.id as "all" | "active" | "completed");
                  setSelectedProjectId("all");
                }}
                className={`shrink-0 rounded-full border px-3 py-1 text-[12px] md:text-[14px] font-medium transition ${
                  active
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {status.name}
              </button>
            );
          })}
          {headerProjects.map((project) => {
            const active = selectedProjectId === project.projectId;
            return (
              <button
                key={project.projectId}
                type="button"
                onClick={() => setSelectedProjectId(project.projectId)}
                className={`shrink-0 rounded-full border px-3 py-1 text-[12px] md:text-[14px] font-medium transition ${
                  active
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {project.projectName}
              </button>
            );
          })}
        </div>
        {activeQuery.isLoading ? <LoadingSkeleton rows={4} /> : null}
        {activeQuery.isError ? <PageError onRetry={() => void activeQuery.refetch()} /> : null}
        {!activeQuery.isLoading && !activeQuery.isError ? (
          <>
            {tab === "overview" && overviewQuery.data ? (
              <Overview
                overview={overviewQuery.data}
                projects={filteredProjects}
                categories={categoriesQuery.data ?? []}
                isProjectScope={isProjectScope}
              />
            ) : null}
            {tab === "projects" ? (
              filteredProjects.length === 0 ? (
                <EmptyState
                  title="Нет проектов"
                  description="Финансовые данные по проектам отсутствуют"
                />
              ) : (
                <ProjectsTab data={filteredProjects} />
              )
            ) : null}
            {tab === "workers" ? (
              (workersQuery.data ?? []).length === 0 ? (
                <EmptyState
                  title="Нет работников"
                  description="Финансовые данные по работникам отсутствуют"
                />
              ) : (
                <WorkersTab data={workersQuery.data ?? []} />
              )
            ) : null}
            {tab === "categories" ? (
              (categoriesQuery.data ?? []).length === 0 ? (
                <EmptyState title="Нет категорий" description="Расходы по категориям отсутствуют" />
              ) : (
                <CategoriesTab data={categoriesQuery.data ?? []} />
              )
            ) : null}
          </>
        ) : null}
      </main>
    </AppLayout>
  );
}

/* ============================= Overview ============================= */

function Overview({
  overview,
  projects,
  categories,
  isProjectScope,
}: {
  overview: {
    totalBudget: string;
    totalSpent: string;
    totalRemaining: string;
    pendingReview?: string;
    activeProjects: number;
  };
  projects: Array<{
    projectId: string;
    projectName: string;
    budget: string;
    spent: string;
    remaining: string;
  }>;
  categories: Array<{ category: string; amount: string; count: number }>;
  isProjectScope: boolean;
}) {
  const [topProjectsExpanded, setTopProjectsExpanded] = useState(false);
  const [topProjectsCollapsed, setTopProjectsCollapsed] = useState(false);
  const [categoriesCollapsed, setCategoriesCollapsed] = useState(false);

  const totalBudget = parseDecimal(overview.totalBudget);
  const totalConfirmed = parseDecimal(overview.totalSpent);
  const remaining = parseDecimal(overview.totalRemaining);
  const pendingReview = parseDecimal(overview.pendingReview);
  const budgetBase = totalBudget > 0 ? totalBudget : totalConfirmed + remaining || 1;
  const remainingFree = Math.max(0, remaining - pendingReview);
  const confirmedBarPct = budgetSharePct(totalConfirmed, budgetBase);
  const pendingBarPct = budgetSharePct(pendingReview, budgetBase);
  const remainingBarPct = budgetSharePct(remainingFree, budgetBase);

  const catTotals = categories
    .map((c) => ({ key: categoryKey(c.category), total: parseDecimal(c.amount), count: c.count }))
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total);
  const hasCategoryExpenses = catTotals.length > 0;
  const catSum = catTotals.reduce((a, c) => a + c.total, 0) || 1;

  const topProjects = [...projects].sort((a, b) => parseDecimal(b.spent) - parseDecimal(a.spent));
  const visibleTopProjects = topProjectsExpanded
    ? topProjects
    : topProjects.slice(0, TOP_PROJECTS_PREVIEW);
  const hasMoreTopProjects = topProjects.length > TOP_PROJECTS_PREVIEW;

  return (
    <>
      <h2 className="px-1 text-[14px] mb-2 font-semibold text-slate-500">
        {isProjectScope ? "Бюджет" : "Общий бюджет"}
      </h2>
      <section className="overflow-hidden rounded-[12px] border border-slate-200 bg-white">
        <div className="grid grid-cols-2">
          <BudgetOverviewCell icon={Wallet} label="Бюджет" value={formatMoney(totalBudget)} />
          <BudgetOverviewCell
            icon={TrendingUp}
            label="Подтверждено"
            value={formatMoney(totalConfirmed)}
          />
          <BudgetOverviewCell
            icon={Wallet}
            label="Остаток"
            value={formatMoney(remaining)}
            tone="green"
          />
          <BudgetOverviewCell
            icon={Wallet}
            label="На проверке"
            value={formatMoney(pendingReview)}
            tone="pending"
          />
        </div>
        <div className="p-3">
          <div className="budget-bar flex h-3 overflow-hidden rounded-full bg-slate-100">
          {totalConfirmed > 0 ? (
            <div
              className="shrink-0"
              style={{ width: `${confirmedBarPct}%`, backgroundColor: "#155DFC", minWidth: 2 }}
            />
          ) : null}
          {pendingReview > 0 ? (
            <div
              className="shrink-0"
              style={{ width: `${pendingBarPct}%`, backgroundColor: "#FE7B02", minWidth: 2 }}
            />
          ) : null}
          {remainingFree > 0 ? (
            <div
              className="shrink-0"
              style={{ width: `${remainingBarPct}%`, backgroundColor: "#E2E8F0", minWidth: 2 }}
            />
          ) : null}
        </div>
        <ul className="mt-3 space-y-1.5 text-xs">
          <Legend
            color="#155DFC"
            label="Подтверждено"
            value={`${formatMoney(totalConfirmed)} · ${formatBudgetPercent(totalConfirmed, budgetBase)}`}
          />
          <Legend
            color="#E2E8F0"
            label="Остаток"
            value={`${formatMoney(remaining)} · ${formatBudgetPercent(remaining, budgetBase)}`}
          />
          <Legend
            color="#FE7B02"
            label="На проверке"
            value={`${formatMoney(pendingReview)} · ${formatBudgetPercent(pendingReview, budgetBase)}`}
          />
        </ul>
        </div>
      </section>

      {!isProjectScope ? (
        <>
          <button
            type="button"
            onClick={() => setTopProjectsCollapsed((prev) => !prev)}
            className="flex w-full items-center mt-4 mb-2 gap-1 px-1 outline-none focus:outline-none focus-visible:outline-none"
          >
            <ChevronDown
              className={`h-4 w-4 text-slate-400 transition ${topProjectsCollapsed ? "-rotate-90" : "rotate-0"}`}
            />
            <h2 className="text-[14px] font-semibold text-slate-500">Топ проектов по расходам</h2>
          </button>
          {!topProjectsCollapsed ? (
            <section className="overflow-hidden rounded-[12px] border border-slate-200 bg-white p-3">
              {topProjects.length > 0 ? (
                <>
                  <ul className="space-y-3">
                    {visibleTopProjects.map((p, index) => {
                      const paid = parseDecimal(p.spent);
                      return (
                        <li
                          key={p.projectId}
                          className="flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center justify-between text-[14px]">
                            <span className="mr-2 inline-flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-full bg-[#F1F5F9] text-[12px] font-semibold text-slate-600">
                              {index + 1}
                            </span>
                            <span className="truncate text-[14px] font-medium text-slate-900">{p.projectName}</span>
                          </div>
                          <span className="shrink-0 text-[14px] font-medium tabular-nums text-slate-600">
                            {formatMoney(paid)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                  {hasMoreTopProjects && !topProjectsExpanded ? (
                    <button
                      type="button"
                      onClick={() => setTopProjectsExpanded(true)}
                      className="mt-3 flex w-full items-center justify-center gap-1 border-t border-slate-100 pt-3 text-xs font-medium text-slate-500 transition hover:text-slate-700"
                    >
                      Показать все
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                </>
              ) : (
                <h3 className="text-[12px] font-semibold text-slate-400">Проектов нет</h3>
              )}
            </section>
          ) : null}

          <button
            type="button"
            onClick={() => setCategoriesCollapsed((prev) => !prev)}
            className="flex w-full items-center mt-4 mb-2 gap-1 px-1 outline-none focus:outline-none focus-visible:outline-none"
          >
            <ChevronDown
              className={`h-4 w-4 text-slate-400 transition ${categoriesCollapsed ? "-rotate-90" : "rotate-0"}`}
            />
            <h2 className="text-[14px] font-semibold text-slate-500">Расходы по категориям</h2>
          </button>
          {!categoriesCollapsed ? (
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white px-4 py-3.5">
              {hasCategoryExpenses ? (
                <ul className="space-y-2.5">
                  {catTotals.map((c) => {
                    const m = categoryMeta[c.key];
                    const pct = Math.round((c.total / catSum) * 100);
                    return (
                      <li key={c.key}>
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1.5 text-slate-700">
                            <m.icon className={`h-3.5 w-3.5 ${m.color}`} />
                            {m.label}
                          </span>
                          <span className="tabular-nums text-slate-500">
                            {formatMoney(c.total)} · {pct}%
                          </span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                          <div className={`h-full ${m.bg}`} style={{ width: `${pct}%` }} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <h3 className="text-[12px] font-semibold text-slate-400">Расходов нет</h3>
              )}
            </section>
          ) : null}
        </>
      ) : (
        <>
          <h2 className="px-1 text-[15px] font-semibold text-slate-700">Расходы по категориям</h2>
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white px-4 py-3.5">
            {hasCategoryExpenses ? (
              <ul className="space-y-2.5">
                {catTotals.map((c) => {
                  const m = categoryMeta[c.key];
                  const pct = Math.round((c.total / catSum) * 100);
                  return (
                    <li key={c.key}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-slate-700">
                          <m.icon className={`h-3.5 w-3.5 ${m.color}`} />
                          {m.label}
                        </span>
                        <span className="tabular-nums text-slate-500">
                          {formatMoney(c.total)} · {pct}%
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div className={`h-full ${m.bg}`} style={{ width: `${pct}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <h3 className="text-[12px] font-semibold text-slate-400">Расходов нет</h3>
            )}
          </section>
        </>
      )}
    </>
  );
}

/* ============================= Projects ============================= */

function ProjectsTab({
  data,
}: {
  data: Array<{
    projectId: string;
    projectName: string;
    budget: string;
    spent: string;
    remaining: string;
    laborCost?: string;
    expenseCost?: string;
  }>;
}) {
  const [openProjects, setOpenProjects] = useState<Record<string, boolean>>({});

  const toggleProject = (projectId: string) => {
    setOpenProjects((prev) => ({ ...prev, [projectId]: !prev[projectId] }));
  };

  return (
    <div className="space-y-2.5">
      {data.map((project) => (
        <ProjectFinanceAccordionItem
          key={project.projectId}
          project={project}
          open={Boolean(openProjects[project.projectId])}
          onToggle={() => toggleProject(project.projectId)}
        />
      ))}
    </div>
  );
}

function ProjectFinanceAccordionItem({
  project,
  open,
  onToggle,
}: {
  project: {
    projectId: string;
    projectName: string;
    budget: string;
    spent: string;
    remaining: string;
  };
  open: boolean;
  onToggle: () => void;
}) {
  const detailQuery = useFinanceProjectQuery(project.projectId, open);
  const detail = detailQuery.data;

  return (
    <section className="overflow-hidden rounded-[12px] border border-slate-200 bg-white">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-2 px-3 py-2 text-left outline-none focus:outline-none focus-visible:outline-none"
      >
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition ${open ? "rotate-180" : ""}`}
        />
        <h3 className="truncate text-[13px] font-semibold text-slate-800">{project.projectName}</h3>
      </button>

      {open ? (
        <div className="border-t border-slate-100">
          <div className="">
            <div className="grid grid-cols-2 gap-0 overflow-hidden">
              <BudgetCell 
                icon={Wallet} 
                label="Бюджет" 
                value={detail?.budget ?? project.budget} 
                tone="slate"
              />
              <BudgetCell
                icon={TrendingUp}
                label="Подтверждено"
                value={detail?.spent ?? project.spent}
                tone="slate"
              />
              <BudgetCell
                icon={Wallet}
                label="Остаток"
                value={detail?.remaining ?? project.remaining}
                tone="green"
              />
              <BudgetCell
                icon={Wallet}
                label="На проверке"
                value={detail?.pendingReviewAmount ?? "0"}
                tone="amber"
              />
            </div>
          </div>

          <div className="border-t border-slate-100 px-3 py-2.5">
            <h4 className="mb-1.5 text-[12px] text-slate-500">По работникам</h4>
            {detailQuery.isLoading ? (
              <p className="text-xs text-slate-400">Загрузка...</p>
            ) : (detail?.workers?.length ?? 0) === 0 ? (
              <p className="text-xs text-slate-400">Нет данных по работникам</p>
            ) : (
              <ul className="space-y-1.5">
                {(detail?.workers ?? []).map((worker) => (
                  <li
                    key={worker.workerId}
                    className="rounded-lg bg-slate-50 px-2.5 py-2 text-[12px]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate font-medium text-slate-900">
                        {worker.workerName}
                      </span>
                      <span className="shrink-0 font-semibold tabular-nums text-slate-900">
                        {formatMoney(worker.totalAmount)}
                      </span>
                    </div>
                    <div className="mt-0.5 text-[10px] text-slate-500">
                      Бригадир: {formatMoney(worker.paidAmount)}
                    </div>
                    <div className="mt-1 grid grid-cols-[1fr_auto] gap-x-2 text-[10px] text-slate-500">
                      <span>Доп. расходы</span>
                      <span className="tabular-nums text-slate-700">
                        {formatMoney(worker.extraExpenses)}
                      </span>
                      <span>Выплачено</span>
                      <span className="tabular-nums text-emerald-600">
                        {formatMoney(worker.paidAmount)}
                      </span>
                      <span>Осталось</span>
                      <span className="tabular-nums text-rose-600">
                        {formatMoney(worker.remainingAmount)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-slate-100 px-3 py-2.5">
            <h4 className="mb-1.5 text-[12px] text-slate-500">По категориям</h4>
            {detailQuery.isLoading ? (
              <p className="text-xs text-slate-400">Загрузка...</p>
            ) : (detail?.categories?.length ?? 0) === 0 ? (
              <p className="text-xs text-slate-400">Нет данных по категориям</p>
            ) : (
              <ul className="space-y-2">
                {(detail?.categories ?? []).map((category, idx) => {
                  const meta = categoryMeta[categoryKey(category.category)];
                  return (
                    <li key={category.category}>
                      <div className="mb-1 flex items-center justify-between gap-3 text-[11px]">
                        <span className="flex min-w-0 items-center gap-1.5 text-slate-700">
                          <meta.icon className={`h-3.5 w-3.5 shrink-0 ${meta.color}`} />
                          <span className="truncate">{meta.label}</span>
                        </span>
                        <span className="shrink-0 tabular-nums text-slate-500">
                          {formatMoney(category.amount)} · {category.percentage}%
                        </span>
                      </div>
                      <div className="h-1 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={idx === 0 ? "h-full bg-slate-900" : `h-full ${meta.bg}`}
                          style={{ width: `${Math.min(category.percentage, 100)}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}

/* ============================= Workers ============================= */

function WorkersTab({
  data,
}: {
  data: Array<{
    workerId: string;
    workerName: string;
    totalHours: string;
    totalPaid: string;
    activeProjects: number;
  }>;
}) {
  const [openWorkers, setOpenWorkers] = useState<Record<string, boolean>>({});

  const toggleWorker = (workerId: string) => {
    setOpenWorkers((prev) => ({ ...prev, [workerId]: !prev[workerId] }));
  };

  return (
    <div className="space-y-2.5">
      {data.map((worker) => (
        <WorkerFinanceAccordionItem
          key={worker.workerId}
          worker={worker}
          open={Boolean(openWorkers[worker.workerId])}
          onToggle={() => toggleWorker(worker.workerId)}
        />
      ))}
    </div>
  );
}

function WorkerFinanceAccordionItem({
  worker,
  open,
  onToggle,
}: {
  worker: {
    workerId: string;
    workerName: string;
    totalHours: string;
    totalPaid: string;
    activeProjects: number;
  };
  open: boolean;
  onToggle: () => void;
}) {
  const detailQuery = useFinanceWorkerQuery(worker.workerId, open);
  const detail = detailQuery.data;

  const summary = useMemo(() => {
    const projects = detail?.projects ?? [];
    return {
      totalHours: parseDecimal(detail?.confirmedHours ?? worker.totalHours),
      totalAmount: projects.reduce((sum, project) => sum + parseDecimal(project.projectAmount), 0),
      extraExpenses: projects.reduce(
        (sum, project) => sum + parseDecimal(project.extraExpenses),
        0,
      ),
      paidAmount: parseDecimal(detail?.paidAmount ?? worker.totalPaid),
      remainingAmount: parseDecimal(detail?.remainingAmount ?? "0"),
    };
  }, [detail, worker.totalHours, worker.totalPaid]);

  return (
    <section className="overflow-hidden rounded-[12px] border border-slate-200 bg-white">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-2 px-3 py-2 text-left outline-none focus:outline-none focus-visible:outline-none"
      >
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition ${open ? "rotate-180" : ""}`}
        />
        <h3 className="truncate text-[13px] font-semibold text-slate-800">{worker.workerName}</h3>
      </button>

      {open ? (
        <div className="border-t border-slate-100">
          <div className="">
            <div className="grid grid-cols-6 overflow-hidden">
              <WorkerBudgetCell
                icon={Clock}
                label="Часы"
                value={String(summary.totalHours)}
                className="col-span-2"
              />
              <WorkerBudgetCell
                icon={Wallet}
                label="Сумма"
                value={formatMoney(summary.totalAmount)}
                className="col-span-2"
              />
              <WorkerBudgetCell
                icon={Receipt}
                label="Доп. расходы"
                value={formatMoney(summary.extraExpenses)}
                className="col-span-2 border-r-0"
              />
              <WorkerBudgetCell
                icon={TrendingUp}
                label="Выплачено"
                value={formatMoney(summary.paidAmount)}
                tone="green"
                className="col-span-3 border-b-0"
              />
              <WorkerBudgetCell
                icon={Wallet}
                label="Остаток"
                value={formatMoney(summary.remainingAmount)}
                tone="red"
                className="col-span-3 border-b-0 border-r-0"
              />
            </div>
          </div>

          <div className="border-t border-slate-100 px-3 py-2">
            <h4 className="text-[12px] text-slate-500">По проектам</h4>
            {detailQuery.isLoading ? (
              <p className="text-[12px] md:text-[14px] text-slate-400">Загрузка...</p>
            ) : (detail?.projects?.length ?? 0) === 0 ? (
              <p className="text-[12px] md:text-[14px] text-slate-400">Нет данных по проектам</p>
            ) : (
              <ul className="space-y-2">
                {(detail?.projects ?? []).map((project) => (
                  <li
                    key={project.projectId}
                    className="overflow-hidden rounded-[10px] border border-slate-100 bg-slate-50"
                  >
                    <div className="flex items-center justify-between gap-3 px-2.5 py-2">
                      <div className="min-w-0">
                        <p className="truncate text-[12px] font-semibold text-slate-800">
                          {project.projectName}
                        </p>
                        <p className="mt-0.5 text-[10px] text-slate-500">{project.totalHours}ч</p>
                      </div>
                      <span className="shrink-0 text-[12px] font-semibold tabular-nums text-slate-800">
                        {formatMoney(project.projectAmount)}
                      </span>
                    </div>
                    <div className="border-t border-slate-100 px-2.5 py-1.5 text-[10px]">
                      <div className="grid grid-cols-[1fr_auto] gap-x-2 text-slate-500">
                        <span>Доп. расходы</span>
                        <span className="tabular-nums text-slate-700">
                          {formatMoney(project.extraExpenses)}
                        </span>
                        <span>Выплачено</span>
                        <span className="tabular-nums text-emerald-600">
                          {formatMoney(project.paidAmount)}
                        </span>
                        <span>Осталось</span>
                        <span className="tabular-nums text-rose-600">
                          {formatMoney(project.remainingAmount)}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}

/* ============================= Categories ============================= */

function CategoriesTab({
  data,
}: {
  data: Array<{ category: string; amount: string; count: number }>;
}) {
  const [openKey, setOpenKey] = useState<CategoryKey | null>(null);

  const items = data.map((c) => ({
    key: categoryKey(c.category),
    total: parseDecimal(c.amount),
    count: c.count,
  }));

  return (
    <div className="space-y-2.5">
      {items.map((c) => {
        const m = categoryMeta[c.key];
        const open = openKey === c.key;
        return (
          <div
            key={c.key}
            className="overflow-hidden rounded-[12px] border border-slate-200 bg-white"
          >
            <button
              type="button"
              onClick={() => setOpenKey(open ? null : c.key)}
              disabled={c.count === 0}
              className="block w-full cursor-pointer px-3 py-2.5 text-left outline-none focus:outline-none focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
            >
              <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 ${m.color}`}
                >
                  <m.icon className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0">
                  <h3 className="truncate text-[13px] font-semibold text-slate-900">{m.label}</h3>
                  <p className="mt-0.5 flex items-center gap-3 truncate text-[10px] text-slate-500">
                    <div className="flex items-center gap-0.5">
                      <Receipt className="inline h-3 w-3" />
                      {c.count}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="inline h-3 w-3" />
                      {c.count}
                    </div>
                  </p>
                </div>
                <span className="shrink-0 text-[13px] font-semibold text-slate-900 tabular-nums">
                  {formatMoney(c.total)}
                </span>
              </div>
            </button>

            {open && c.count > 0 && (
              <div className="border-t border-slate-100 bg-slate-50 px-3 py-2.5 text-[11px] text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Receipt className="h-3 w-3" />
                    Расходов
                  </span>
                  <span className="tabular-nums">{c.count}</span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <m.icon className={`h-3 w-3 ${m.color}`} />
                    Сумма
                  </span>
                  <span className="font-medium tabular-nums text-slate-800">
                    {formatMoney(c.total)}
                  </span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ============================= Shared bits ============================= */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <header className="px-4 pt-3 pb-1.5">
        <h2 className="text-[15px] font-semibold text-slate-700">{title}</h2>
      </header>
      <div className="px-4 py-3.5">{children}</div>
    </section>
  );
}

function Legend({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <li className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-slate-600">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
        {label}
      </span>
      <span className="font-medium tabular-nums text-slate-700">{value}</span>
    </li>
  );
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "emerald" | "blue" | "amber";
}) {
  const colors: Record<string, string> = {
    emerald: "text-emerald-700",
    blue: "text-blue-700",
    amber: "text-amber-700",
  };
  return (
    <div className="rounded-lg bg-slate-50 px-2 py-1.5">
      <div className="truncate text-[10px] uppercase tracking-wide text-slate-400">{label}</div>
      <div
        className={`truncate text-xs font-semibold tabular-nums ${tone ? colors[tone] : "text-slate-900"}`}
      >
        {value}
      </div>
    </div>
  );
}

function BudgetCell({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  tone?: "default" | "slate" | "green" | "amber";
}) {
  const textTone: Record<string, string> = {
    default: "text-slate-900",
    slate: "text-slate-900",
    green: "text-emerald-700",
    amber: "text-amber-700",
  };

  return (
    <div className="border-b border-r border-slate-200 px-2.5 py-2.5 odd:border-r even:border-r-0 [&:nth-last-child(-n+2)]:border-b-0">
      <div className="flex items-center gap-1.5">
        <Icon className="h-[15px] w-3 shrink-0 text-slate-400" />
        <span className="text-[12px] text-slate-400">{label}</span>
      </div>
      <div className={`mt-1 text-[14px] md:text-[16px] leading-none font-semibold tabular-nums ${textTone[tone]}`}>
        {formatMoney(value)}
      </div>
    </div>
  );
}

function BudgetOverviewCell({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  tone?: "default" | "green" | "pending";
}) {
  const valueTone: Record<string, string> = {
    default: "text-slate-900",
    green: "text-emerald-600",
    pending: "text-[#FE7B02]",
  };

  return (
    <div className="border-b border-r border-slate-200 p-3 even:border-r-0">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3 w-3 shrink-0 text-slate-400" />
        <span className="text-[12px] text-slate-400">{label}</span>
      </div>
      <div
        className={`mt-1.5 text-[14px] leading-none font-semibold tabular-nums ${valueTone[tone]}`}
      >
        {value}
      </div>
    </div>
  );
}

function WorkerBudgetCell({
  icon: Icon,
  label,
  value,
  tone = "default",
  className = "",
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  tone?: "default" | "green" | "red";
  className?: string;
}) {
  const toneClass: Record<string, string> = {
    default: "text-slate-900",
    green: "text-emerald-600",
    red: "text-rose-600",
  };

  return (
    <div className={`border-b border-r border-slate-200 px-2.5 py-2 ${className}`}>
      <div className="flex items-center gap-1.5">
        <Icon className="h-3 w-3 shrink-0 text-slate-400" />
        <span className="text-[12px] text-slate-400">{label}</span>
      </div>
      <div
        className={`mt-1 text-[14px] md:text-[16px] leading-none font-semibold tabular-nums ${toneClass[tone]}`}
      >
        {value}
      </div>
    </div>
  );
}
