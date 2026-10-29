import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { Search, Plus, FileText, ChevronRight, LayoutTemplate } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { LoadingSkeleton } from "@/components/common/LoadingSpinner";
import { PageError } from "@/components/common/PageError";
import { ProjectEstimateCard } from "@/components/projects/ProjectEstimateCard";
import { fetchEstimates } from "@/lib/api/estimates";
import { useEstimates } from "@/lib/api/hooks/useEstimates";
import { useEstimateTemplates } from "@/lib/api/hooks/useEstimateTemplates";
import { queryKeys } from "@/lib/api/query-keys";
import { estimateStatusMeta } from "@/lib/constants/status";
import { formatMoney } from "@/lib/format";
import { estimateResponseToUI, getEstimateDisplayTotal } from "@/lib/mappers/estimate";

export const Route = createFileRoute("/_authenticated/estimates/")({
  head: () => ({
    meta: [
      { title: "Сметы — Менеджер" },
      { name: "description", content: "Создание, согласование и экспорт смет." },
    ],
  }),
  component: EstimatesList,
});

type EstimateStatus = "draft" | "sent" | "approved" | "rejected";

const tabs: { id: EstimateStatus; label: string }[] = [
  { id: "draft", label: "Черновики" },
  { id: "sent", label: "Отправленные" },
  { id: "approved", label: "Согласованные" },
  { id: "rejected", label: "Отклонённые" },
];

function EstimatesList() {
  const [tab, setTab] = useState<EstimateStatus>("draft");
  const [q, setQ] = useState("");
  const search = q.trim() || undefined;

  const estimatesQuery = useEstimates({
    status: tab,
    search,
    pageSize: 100,
  });
  const templatesQuery = useEstimateTemplates();

  const countQueries = useQueries({
    queries: tabs.map((t) => ({
      queryKey: queryKeys.estimates.list({ status: t.id, search, pageSize: 1, page: 1 }),
      queryFn: () => fetchEstimates({ status: t.id, search, pageSize: 1, page: 1 }),
    })),
  });

  const counts = useMemo(() => {
    const result: Record<EstimateStatus, number> = {
      draft: 0,
      sent: 0,
      approved: 0,
      rejected: 0,
    };
    tabs.forEach((t, index) => {
      result[t.id] = countQueries[index]?.data?.total ?? 0;
    });
    return result;
  }, [countQueries]);

  const list = estimatesQuery.data?.items ?? [];

  if (estimatesQuery.isLoading) {
    return (
      <AppLayout activeNav="estimates">
        <LoadingSkeleton rows={5} />
      </AppLayout>
    );
  }

  if (estimatesQuery.isError) {
    return (
      <AppLayout activeNav="estimates">
        <PageError onRetry={() => estimatesQuery.refetch()} />
      </AppLayout>
    );
  }

  return (
    <AppLayout activeNav="estimates">
      <PageHeader>
        <div className="space-y-3 py-4">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-[20px] font-semibold tracking-tight text-slate-900">
              Сметы
            </h1>
            <Link
              to="/estimates/$estimateId"
              params={{ estimateId: "new" }}
              className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1 text-[12px] md:text-[14px] font-medium text-white hover:bg-slate-800"
            >
              <Plus className="h-3.5 w-3.5" />
              Создать
            </Link>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Поиск по смете, компании или городу"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-slate-400 focus:outline-none"
            />
          </div>

          <div className="scrollbar-responsive -mx-1 flex gap-2 overflow-x-auto px-1">
            {tabs.map((t) => {
              const active = t.id === tab;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-1 text-[12px] md:text-[14px] font-medium transition ${
                    active
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span>{t.label}</span>
                  <span
                    className={
                      active
                        ? "inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-white/15 px-1.5 py-0.5 text-[10px] font-semibold text-white"
                        : "inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#F1F5F9] px-1 text-[10px] font-semibold text-slate-600"
                    }
                  >
                    {counts[t.id]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </PageHeader>

      <main className="space-y-3 px-3 pt-5 pb-5">
        {list.length === 0 ? (
          <div className="rounded-[12px] border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-[12px] md:text-[14px] text-slate-500">
            Нет смет
          </div>
        ) : (
          list.map((raw) => {
            const e = estimateResponseToUI(raw);
            const meta = estimateStatusMeta[e.status] ?? estimateStatusMeta.draft;
            const location = [e.city, e.country].filter(Boolean).join(", ");
            return (
              <ProjectEstimateCard
                key={e.id}
                estimate={{
                  id: e.id,
                  name: e.name,
                  statusLabel: meta.label,
                  statusBadgeCls: meta.cls,
                  projectName: e.company || "—",
                  city: location || undefined,
                  dateLabel: e.date ? `Смета от ${e.date}` : undefined,
                  totalAmount: formatMoney(getEstimateDisplayTotal(raw)),
                }}
              />
            );
          })
        )}

        {tab === "draft" && (templatesQuery.data?.length ?? 0) > 0 ? (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-700">
              <LayoutTemplate className="h-4 w-4 text-slate-400" />
              Шаблоны
            </div>
            <p className="mb-3 text-[11px] text-slate-500">
              Создавайте смету из готового шаблона.
            </p>
            <div className="space-y-2">
              {templatesQuery.data?.map((t) => (
                <Link
                  key={t.id}
                  to="/estimates/$estimateId"
                  params={{ estimateId: "new" }}
                  search={{ template: t.id }}
                  className="card-hover flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5"
                >
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-slate-500">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-slate-900">
                      {t.name}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </main>
    </AppLayout>
  );
}
