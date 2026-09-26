import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { PageError } from "@/components/common/PageError";
import { EmptyState } from "@/components/common/EmptyState";
import { AddToolSheet } from "@/components/tools/AddToolSheet";
import { AssignToolSheet } from "@/components/tools/modals/AssignToolSheet";
import { ReportToolProblemSheet } from "@/components/tools/modals/ReportToolProblemSheet";
import { ReturnToolSheet } from "@/components/tools/modals/ReturnToolSheet";
import { ToolListCard } from "@/components/tools/list/ToolListCard";
import { ToolsFilterTabs } from "@/components/tools/list/ToolsFilterTabs";
import { ToolsListHeader } from "@/components/tools/list/ToolsListHeader";
import { needsAttention } from "@/components/tools/list/toolCardDisplay";
import { useToolTabCounts, type ToolTabKey } from "@/components/tools/list/useToolTabCounts";
import { useTools } from "@/lib/api/hooks/useTools";

export const Route = createFileRoute("/_authenticated/tools/")({
  validateSearch: (s: Record<string, unknown>) => ({
    create: s.create === "1" || s.create === true ? true : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Инструменты — Менеджер" },
      {
        name: "description",
        content:
          "Учёт дорогого и критичного оборудования: калибровка, лимиты использований, выдача на проекты.",
      },
    ],
  }),
  component: ToolsList,
});

function tabToApiStatus(tab: ToolTabKey): string | undefined {
  switch (tab) {
    case "available":
      return "available";
    case "on_project":
      return "assigned";
    case "expired":
      return "overdue";
    case "decommissioned":
      return "written_off";
    default:
      return undefined;
  }
}

function ToolsList() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [tab, setTab] = useState<ToolTabKey>("all");
  const [query, setQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [assignToolId, setAssignToolId] = useState<string | null>(null);
  const [returnToolId, setReturnToolId] = useState<string | null>(null);
  const [problemToolId, setProblemToolId] = useState<string | null>(null);

  const tabCounts = useToolTabCounts();

  useEffect(() => {
    if (!search.create) return;
    setTimeout(() => setAddOpen(true), 500);
    void navigate({
      search: (prev) => ({ ...prev, create: undefined }),
      replace: true,
    });
  }, [search.create, navigate]);

  const toolsQuery = useTools({ status: tabToApiStatus(tab), pageSize: 100 });
  const tools = toolsQuery.data?.items ?? [];

  const filtered = useMemo(() => {
    return tools.filter((t) => {
      if (tab === "attention" && !needsAttention(t)) return false;
      if (query) {
        const q = query.toLowerCase();
        return (
          t.name.toLowerCase().includes(q) ||
          (t.serialNumber ?? "").toLowerCase().includes(q) ||
          (t.model ?? "").toLowerCase().includes(q) ||
          (t.toolType ?? "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [tools, tab, query]);

  const counts: Record<ToolTabKey, number> = {
    all: tabCounts.all,
    available: tabCounts.available,
    on_project: tabCounts.on_project,
    attention: tabCounts.attention,
    expired: tabCounts.expired,
    decommissioned: tabCounts.decommissioned,
  };

  return (
    <AppLayout activeNav="tools">
      <PageHeader>
        <ToolsListHeader
          query={query}
          onQueryChange={setQuery}
          onAdd={() => setAddOpen(true)}
        />
        <ToolsFilterTabs tab={tab} counts={counts} onTabChange={setTab} />
      </PageHeader>

      <main className="space-y-3 px-3 pt-5 pb-5">
        {toolsQuery.isLoading ? <LoadingSpinner label="Загрузка инструментов" /> : null}
        {toolsQuery.isError ? (
          <PageError onRetry={() => void toolsQuery.refetch()} />
        ) : null}
        {!toolsQuery.isLoading && !toolsQuery.isError ? (
          filtered.length === 0 ? (
            <EmptyState
              title="Ничего не найдено"
              description="Попробуйте изменить фильтры или поиск"
            />
          ) : (
            filtered.map((t) => (
              <ToolListCard
                key={t.id}
                tool={t}
                onAssign={setAssignToolId}
                onReturn={setReturnToolId}
                onProblem={setProblemToolId}
              />
            ))
          )
        ) : null}
      </main>

      {addOpen ? <AddToolSheet onClose={() => setAddOpen(false)} /> : null}

      <AssignToolSheet
        toolId={assignToolId}
        open={!!assignToolId}
        onOpenChange={(open) => {
          if (!open) setAssignToolId(null);
        }}
      />

      <ReturnToolSheet
        toolId={returnToolId}
        open={!!returnToolId}
        onOpenChange={(open) => {
          if (!open) setReturnToolId(null);
        }}
      />

      <ReportToolProblemSheet
        toolId={problemToolId}
        open={!!problemToolId}
        onOpenChange={(open) => {
          if (!open) setProblemToolId(null);
        }}
      />
    </AppLayout>
  );
}
