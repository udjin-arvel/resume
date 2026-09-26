import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { LoadingSkeleton } from "@/components/common/LoadingSpinner";
import { PageError } from "@/components/common/PageError";
import { AssignToolSheet } from "@/components/tools/modals/AssignToolSheet";
import { ReportToolProblemSheet } from "@/components/tools/modals/ReportToolProblemSheet";
import { ReturnToolSheet } from "@/components/tools/modals/ReturnToolSheet";
import { ToolDetailFooter } from "@/components/tools/detail/ToolDetailFooter";
import { ToolDetailHeader } from "@/components/tools/detail/ToolDetailHeader";
import { ToolDetailSections } from "@/components/tools/detail/ToolDetailSections";
import { ToolProblemBanner } from "@/components/tools/detail/ToolProblemBanner";
import { ToolSummaryCard } from "@/components/tools/detail/ToolSummaryCard";
import { useResolveToolProblem, useTool } from "@/lib/api/hooks/useTools";
import { showError, showSuccess } from "@/lib/toast";

export const Route = createFileRoute("/_authenticated/tools/$toolId")({
  head: () => ({
    meta: [
      { title: "Карточка инструмента — Менеджер" },
      {
        name: "description",
        content: "Учёт, калибровка, лимит использований и история выдачи инструмента.",
      },
    ],
  }),
  component: ToolDetail,
});

function ToolDetail() {
  const { toolId } = Route.useParams();
  const toolQuery = useTool(toolId);
  const resolveProblem = useResolveToolProblem(toolId);
  const [assignOpen, setAssignOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [problemOpen, setProblemOpen] = useState(false);

  if (toolQuery.isLoading) {
    return (
      <AppLayout activeNav="tools">
        <LoadingSkeleton rows={5} />
      </AppLayout>
    );
  }

  if (toolQuery.isError || !toolQuery.data) {
    return (
      <AppLayout activeNav="tools">
        <PageError onRetry={() => void toolQuery.refetch()} />
      </AppLayout>
    );
  }

  const tool = toolQuery.data;

  const handleResolve = async () => {
    try {
      await resolveProblem.mutateAsync();
      showSuccess("Проблема отмечена как решённая");
    } catch (err) {
      showError(err);
    }
  };

  return (
    <AppLayout activeNav="tools">
      <ToolDetailHeader tool={tool} />

      <main className="space-y-6 px-5 pt-5 pb-28">
        <ToolProblemBanner tool={tool} />
        <ToolSummaryCard tool={tool} />
        <ToolDetailSections tool={tool} />
      </main>

      <ToolDetailFooter
        tool={tool}
        onAssign={() => setAssignOpen(true)}
        onReturn={() => setReturnOpen(true)}
        onProblem={() => setProblemOpen(true)}
        onResolve={handleResolve}
        resolvePending={resolveProblem.isPending}
      />

      <AssignToolSheet toolId={toolId} open={assignOpen} onOpenChange={setAssignOpen} />
      <ReturnToolSheet toolId={toolId} open={returnOpen} onOpenChange={setReturnOpen} />
      <ReportToolProblemSheet
        toolId={toolId}
        open={problemOpen}
        onOpenChange={setProblemOpen}
      />
    </AppLayout>
  );
}
