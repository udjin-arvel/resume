import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import type { z } from "zod";
import { RemoveScroll } from "react-remove-scroll";
import {
  Pencil,
  Mic,
  AlertTriangle,
  UserCog,
  ChevronRight,
  CircleX,
  Loader2,
} from "lucide-react";
import {
  estimateStatusMeta,
  projectTypeMeta,
  supervisorReportStatusMeta,
} from "@/lib/constants/status";
import { AppLayout } from "@/components/layout/AppLayout";
import { LoadingSkeleton } from "@/components/common/LoadingSpinner";
import { PageError } from "@/components/common/PageError";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import {
  ProjectBasicInfoAccordion,
  ProjectClosedBanner,
  ProjectDetailHeader,
  ProjectDocumentsTab,
  ProjectHistoryTab,
  ProjectWorkersTab,
  ProjectToolsTab,
  ProjectFinanceTab,
  ProjectEstimatesAccordion,
  ProjectProblemsAccordion,
  ProjectQuickActions,
  ProjectSectionHeader,
  ProjectStatsBlock,
  ProjectTabBar,
  buildProjectProblems,
  daysLeft,
  type ProjectEstimateItem,
} from "@/components/projects";
import {
  NotifyProjectWorkersSheet,
  type NotifyProjectWorkersMode,
} from "@/components/projects/NotifyProjectWorkersSheet";
import { WorkerReportMiniCard } from "@/components/workers/WorkerReportMiniCard";
import { TelegramIcon } from "@/components/icons";
import { useClient } from "@/lib/api/hooks/useClients";
import { useEstimate } from "@/lib/api/hooks/useEstimates";
import {
  useProject,
  useUpdateProject,
} from "@/lib/api/hooks/useProjects";
import {
  useApproveWorkerReport,
  useRejectWorkerReport,
  useRemindWorkerReport,
  useRevertWorkerReportReturn,
  useSupervisorReports,
  useWorkerReports,
} from "@/lib/api/hooks/useReports";
import { projectSchema } from "@/lib/api/schemas";
import { formatDate, formatMoney, parseDecimal, toDateInputValue } from "@/lib/format";
import { estimateResponseToUI, getEstimateDisplayTotal } from "@/lib/mappers/estimate";
import { showError, showSuccess } from "@/lib/toast";
import { SectionHeading } from "@/components/common/SectionHeading";

export const Route = createFileRoute("/_authenticated/projects/$projectId")({
  head: ({ params }) => ({
    meta: [
      { title: `Проект ${params.projectId} — Менеджер` },
      { name: "description", content: "Карточка проекта: обзор, работники, отчёты, документы, финансы." },
    ],
  }),
  component: ProjectDetail,
});

type Project = z.infer<typeof projectSchema>;
type Tab = "overview" | "workers" | "reports" | "daily" | "tools" | "docs" | "finance" | "history";

const tabs: { id: Tab; label: string }[] = [
  { id: "overview", label: "Обзор" },
  { id: "workers", label: "Работники" },
  { id: "reports", label: "Отчёты работников" },
  { id: "daily", label: "Отчёты супервайзера" },
  { id: "tools", label: "Инструменты" },
  { id: "docs", label: "Документы" },
  { id: "finance", label: "Финансы" },
  { id: "history", label: "История" },
];

const downtimeReasonLabel: Record<string, string> = {
  "no-access": "Нет доступа на объект",
  "no-permits": "Нет разрешений",
  infrastructure: "Не готова инфраструктура",
  "no-materials": "Нет материалов",
  contractor: "Ожидание подрядчика",
  client: "Ожидание клиента",
  other: "Другое",
};

const dailyStatusMeta: Record<string, { label: string; cls: string }> = {
  ok: { label: "По плану", cls: "bg-emerald-50 text-emerald-700" },
  issue: { label: "Проблема", cls: "bg-amber-50 text-amber-700" },
  downtime: { label: "Простой", cls: "bg-red-50 text-red-700" },
};

function workerName(w: { firstName: string; lastName: string }) {
  return `${w.firstName} ${w.lastName}`.trim();
}

function ProjectDetail() {
  const { projectId } = Route.useParams();
  const projectQuery = useProject(projectId);
  const project = projectQuery.data;
  const clientQuery = useClient(project?.clientId ?? "");
  const [tab, setTab] = useState<Tab>("overview");
  const [editOpen, setEditOpen] = useState(false);
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);
  const updateProject = useUpdateProject(projectId);
  const isProjectReadOnly = project?.status !== "active";

  const handleCloseProject = async () => {
    try {
      await updateProject.mutateAsync({ status: "done" });
      showSuccess("Проект закрыт");
      setCloseConfirmOpen(false);
    } catch (e) {
      showError(e);
    }
  };

  if (projectQuery.isLoading) {
    return (
      <AppLayout activeNav="projects">
        <LoadingSkeleton rows={6} />
      </AppLayout>
    );
  }

  if (projectQuery.isError || !project) {
    return (
      <AppLayout activeNav="projects">
        <PageError onRetry={() => projectQuery.refetch()} />
      </AppLayout>
    );
  }

  const clientName = clientQuery.data?.name ?? "—";
  const remainingDays = daysLeft(project.endDate);

  return (
    <AppLayout activeNav="projects" className="bg-[#F5F6F8]">
      <div className="space-y-4 bg-[#F5F6F8] pb-6 text-[#111827]">
        <ProjectDetailHeader
          project={project}
          clientName={clientName}
          daysLeft={remainingDays}
        />

        <div className="space-y-4 px-2">
        {isProjectReadOnly ? <ProjectClosedBanner project={project} /> : null}

        <ProjectTabBar tabs={tabs} activeTab={tab} onChange={setTab} />

        {editOpen && !isProjectReadOnly ? (
          <EditProjectSheet project={project} onClose={() => setEditOpen(false)} />
        ) : null}

        <main className="space-y-4">
          {tab === "overview" && (
            <OverviewTab
              project={project}
              clientName={clientName}
              projectId={projectId}
              onNavigateTab={setTab}
              onEdit={() => setEditOpen(true)}
              readOnly={isProjectReadOnly}
            />
          )}
          {tab === "workers" && (
            <ProjectWorkersTab
              project={project}
              projectId={projectId}
              readOnly={isProjectReadOnly}
            />
          )}
          {tab === "reports" && (
            <ReportsTab projectId={projectId} readOnly={isProjectReadOnly} />
          )}
          {tab === "daily" && <DailyReportsTab project={project} projectId={projectId} />}
          {tab === "tools" && (
            <ProjectToolsTab
              project={project}
              projectId={projectId}
              readOnly={isProjectReadOnly}
            />
          )}
          {tab === "docs" && (
            <ProjectDocumentsTab
              projectId={projectId}
              project={project}
              readOnly={isProjectReadOnly}
            />
          )}
          {tab === "finance" && (
            <ProjectFinanceTab projectId={projectId} projectType={project.type} />
          )}
          {tab === "history" && <ProjectHistoryTab projectId={projectId} />}
        </main>

        {!isProjectReadOnly ? (
          <footer className="flex justify-end">
            <button
              type="button"
              onClick={() => setCloseConfirmOpen(true)}
              disabled={updateProject.isPending}
              className="inline-flex items-center justify-center gap-1 rounded-full border border-red-200 bg-white px-2 py-1 text-[11px] font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
            >
              {updateProject.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <CircleX className="h-3 w-3" />
              )}
              Закрыть проект
            </button>
          </footer>
        ) : null}

        <ConfirmDialog
          open={closeConfirmOpen}
          onOpenChange={setCloseConfirmOpen}
          title="Закрыть проект?"
          description="Проект перейдёт в статус «Завершён». Редактирование станет недоступным."
          confirmLabel="Закрыть"
          onConfirm={handleCloseProject}
          destructive
        />
        </div>
      </div>
    </AppLayout>
  );
}

function EditProjectSheet({
  project,
  onClose,
}: {
  project: Project;
  onClose: () => void;
}) {
  const updateProject = useUpdateProject(project.id);
  const [name, setName] = useState(project.name);
  const [location, setLocation] = useState(project.location);
  const [startDate, setStartDate] = useState(toDateInputValue(project.startDate));
  const [endDate, setEndDate] = useState(toDateInputValue(project.endDate));

  const handleSave = async () => {
    try {
      await updateProject.mutateAsync({
        name,
        location,
        startDate: startDate || null,
        endDate: endDate || null,
      });
      showSuccess("Проект обновлён");
      onClose();
    } catch (e) {
      showError(e);
    }
  };

  const dateInputClassName =
    "mt-1 w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-sm text-slate-900";

  return (
    <RemoveScroll removeScrollBar={false}>
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 sm:items-center">
        <div className="w-full max-w-md rounded-[12px] border border-[#F0F0F0] bg-white p-4 shadow-xl">
          <h2 className="text-sm font-semibold text-[#111827]">Изменить проект</h2>
          <div className="mt-4 space-y-3">
            <label className="block text-xs text-slate-500">
              Название проекта
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-sm"
              />
            </label>
            <label className="block text-xs text-slate-500">
              Адрес / локация
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-sm"
              />
            </label>
            <label className="block text-xs text-slate-500">
              Дата начала
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={dateInputClassName}
              />
            </label>
            <label className="block text-xs text-slate-500">
              Дата окончания
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || undefined}
                className={dateInputClassName}
              />
            </label>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={updateProject.isPending}
              className="rounded-[12px] bg-[#111827] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              Сохранить
            </button>
          </div>
        </div>
      </div>
    </RemoveScroll>
  );
}

function OverviewTab({
  project,
  clientName,
  projectId,
  onNavigateTab,
  onEdit,
  readOnly,
}: {
  project: Project;
  clientName: string;
  projectId: string;
  onNavigateTab: (tab: Tab) => void;
  onEdit: () => void;
  readOnly: boolean;
}) {
  const [notifySheetOpen, setNotifySheetOpen] = useState(false);
  const [notifyMode, setNotifyMode] = useState<NotifyProjectWorkersMode>("all");
  const estimateQuery = useEstimate(project.estimateId ?? "");
  const workers = project.projectWorkers ?? [];
  const supervisor = workers.find((w) => w.role === "supervisor");
  const problems = buildProjectProblems(project);
  const canNotifyWorkers = workers.length > 0;

  const openNotifySheet = (mode: NotifyProjectWorkersMode) => {
    setNotifyMode(mode);
    setNotifySheetOpen(true);
  };

  const estimates = useMemo((): ProjectEstimateItem[] => {
    const raw = estimateQuery.data;
    if (!raw) return [];
    const e = estimateResponseToUI(raw);
    const meta = estimateStatusMeta[e.status] ?? estimateStatusMeta.draft;
    const projectType = projectTypeMeta[project.type] ?? projectTypeMeta.estimate;
    return [
      {
        id: e.id,
        name: e.name,
        statusLabel: meta.label,
        statusBadgeCls: meta.cls,
        projectName: project.name,
        projectTypeLabel: projectType.label,
        projectTypeBadgeCls: projectType.cls,
        city: e.city || undefined,
        dateLabel: e.date ? `Смета от ${formatDate(e.date)}` : undefined,
        totalAmount: formatMoney(getEstimateDisplayTotal(raw)),
      },
    ];
  }, [estimateQuery.data, project.name, project.type]);

  const handleProblemClick = (problemId: string) => {
    switch (problemId) {
      case "site-issue":
      case "site-downtime":
        onNavigateTab("daily");
        break;
      case "unconfirmed-workers":
        onNavigateTab("workers");
        break;
      case "reports-review":
        onNavigateTab("reports");
        break;
    }
  };

  const quickActions = readOnly
    ? []
    : [
        {
          id: "edit-project",
          icon: Pencil,
          label: <>Изменить<br />проект</>,
          onClick: onEdit,
        },
        {
          id: "notify-all",
          icon: TelegramIcon,
          label: <>Уведомить<br />всех</>,
          onClick: () => openNotifySheet("all"),
          badge: workers.length,
          disabled: !canNotifyWorkers,
        },
        {
          id: "notify-one",
          icon: TelegramIcon,
          label: <>Уведомить<br />одного</>,
          onClick: () => openNotifySheet("one"),
          disabled: !canNotifyWorkers,
        },
      ];

  return (
    <div className="flex flex-col gap-4">
      {quickActions.length > 0 ? <ProjectQuickActions actions={quickActions} /> : null}

      
      <div>
        <SectionHeading>Показатели</SectionHeading>
        <NotifyProjectWorkersSheet
          projectId={projectId}
          project={project}
          workers={workers}
          mode={notifyMode}
          open={notifySheetOpen}
          onOpenChange={setNotifySheetOpen}
        />
        <ProjectStatsBlock
          workers={project.workers}
          confirmed={project.confirmed}
          reportsOnReview={project.reportsOnReview}
          budget={formatMoney(project.budget)}
            spent={formatMoney(project.spent)}
          />
      </div>
      
      <ProjectProblemsAccordion
        problems={problems}
        onProblemClick={handleProblemClick}
      />

      <ProjectBasicInfoAccordion
        project={project}
        clientName={clientName}
        supervisorName={supervisor ? workerName(supervisor) : undefined}
        readOnly={readOnly}
      />

      <ProjectEstimatesAccordion
        estimates={estimates}
        isLoading={!!project.estimateId && estimateQuery.isLoading}
      />
    </div>
  );
}

function ReportsTab({ projectId, readOnly = false }: { projectId: string; readOnly?: boolean }) {
  const reportsQuery = useWorkerReports({ projectId });
  const approveReport = useApproveWorkerReport();
  const rejectReport = useRejectWorkerReport();
  const revertReturn = useRevertWorkerReportReturn();
  const remindReport = useRemindWorkerReport();

  const grouped = useMemo(() => {
    const map = new Map<string, NonNullable<typeof reportsQuery.data>["items"]>();
    for (const r of reportsQuery.data?.items ?? []) {
      const name = r.workerName ?? r.workerId;
      const list = map.get(name) ?? [];
      list.push(r);
      map.set(name, list);
    }
    return [...map.entries()];
  }, [reportsQuery.data]);

  const handleApprove = async (id: string) => {
    try {
      await approveReport.mutateAsync(id);
      showSuccess("Отчёт принят");
    } catch (e) {
      showError(e);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectReport.mutateAsync({ id });
      showSuccess("Отчёт возвращён");
    } catch (e) {
      showError(e);
    }
  };

  const handleRevertReturn = async (id: string) => {
    try {
      await revertReturn.mutateAsync(id);
      showSuccess("Возврат отменён");
    } catch (e) {
      showError(e);
    }
  };

  const handleRemind = async (id: string) => {
    try {
      await remindReport.mutateAsync(id);
      showSuccess("Напоминание отправлено");
    } catch (e) {
      showError(e);
    }
  };

  if (reportsQuery.isLoading) return <LoadingSkeleton rows={4} />;
  if (reportsQuery.isError) {
    return <PageError onRetry={() => reportsQuery.refetch()} />;
  }

  if (grouped.length === 0) {
    return (
      <div className="rounded-[12px] border border-dashed border-[#F0F0F0] bg-white px-4 py-8 text-center text-[12px] md:text-[14px] text-slate-500">
        Нет отчётов работников
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {grouped.map(([worker, reports]) => (
        <section key={worker}>
          <ProjectSectionHeader title={worker} hint={`${reports.length}`} />
          <ul className="mt-3 space-y-3">
            {reports.map((r) => (
              <WorkerReportMiniCard
                key={r.id}
                report={r}
                onApprove={handleApprove}
                onReject={handleReject}
                onRevertReturn={handleRevertReturn}
                onRemind={handleRemind}
                approvePending={approveReport.isPending}
                rejectPending={rejectReport.isPending}
                revertPending={revertReturn.isPending}
                remindPending={remindReport.isPending}
                readOnly={readOnly}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function DailyReportsTab({ project, projectId }: { project: Project; projectId: string }) {
  const reportsQuery = useSupervisorReports({ projectId });
  const workers = project.projectWorkers ?? [];
  const supervisor = workers.find((w) => w.role === "supervisor");

  if (project.type !== "estimate") {
    return (
      <section className="rounded-[12px] border border-dashed border-[#F0F0F0] bg-white px-4 py-8 text-center text-[12px] md:text-[14px] text-slate-500">
        Ежедневные отчёты супервайзера ведутся только в проектах типа «Проект по смете».
      </section>
    );
  }

  if (reportsQuery.isLoading) return <LoadingSkeleton rows={4} />;

  const reports = reportsQuery.data?.items ?? [];

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-[12px] bg-white border border-slate-200">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 p-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-600">
            <UserCog className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] md:text-[12px] tracking-wide text-slate-400">Супервайзер проекта</p>
            <p className="truncate text-[14px] md:text-[16px] font-medium text-[#0F172B]">
              {supervisor ? workerName(supervisor) : "Не назначен"}
            </p>
          </div>
        </div>
      </section>

      <section>
        <ProjectSectionHeader title="Отчёты по дням" hint={`${reports.length}`} />
        <ul className="mt-3 space-y-3">
          {reports.length === 0 ? (
            <li className="rounded-[12px] border border-dashed border-[#F0F0F0] bg-white px-4 py-8 text-center text-[12px] md:text-[14px] text-slate-500">
              Нет ежедневных отчётов
            </li>
          ) : (
            reports.map((r) => {
              const siteKey = r.siteStatus ?? "ok";
              const m = dailyStatusMeta[siteKey] ?? dailyStatusMeta.ok;
              const statusMeta =
                supervisorReportStatusMeta[r.status] ?? supervisorReportStatusMeta.review;
              return (
                <li key={r.id} className="overflow-hidden rounded-[12px] bg-white">
                  <Link to="/daily-reports/$dailyId" params={{ dailyId: r.id }}>
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {formatDate(r.reportDate)}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {r.supervisorName ?? "Супервайзер"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {r.transcription ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                            <Mic className="h-3 w-3" /> Голос
                          </span>
                        ) : null}
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${m.cls}`}>
                          {m.label}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusMeta.chip ?? statusMeta.cls}`}
                        >
                          {statusMeta.label}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3 px-4 py-3">
                      <p className="text-sm text-slate-800">
                        {r.description ?? r.transcription ?? "—"}
                      </p>

                      {siteKey === "downtime" && (
                        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-slate-100">
                          <div className="bg-white px-3 py-2">
                            <p className="text-[10px] uppercase tracking-wide text-slate-400">Причина</p>
                            <p className="mt-0.5 truncate text-xs font-medium text-slate-900">
                              {r.downtimeReason
                                ? downtimeReasonLabel[r.downtimeReason] ?? r.downtimeReason
                                : "—"}
                            </p>
                          </div>
                          <div className="bg-white px-3 py-2">
                            <p className="text-[10px] uppercase tracking-wide text-slate-400">Часы простоя</p>
                            <p className="mt-0.5 text-xs font-medium text-slate-900">
                              {r.downtimeHours ?? "0"} ч
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })
          )}
        </ul>
      </section>
    </div>
  );
}
