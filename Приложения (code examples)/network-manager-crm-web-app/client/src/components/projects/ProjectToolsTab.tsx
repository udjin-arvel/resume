import { useState } from "react";
import type { z } from "zod";
import { Plus } from "lucide-react";
import { LoadingSkeleton } from "@/components/common/LoadingSpinner";
import { SectionCountBadge } from "@/components/common/SectionCountBadge";
import { AddProjectToolSheet } from "@/components/projects/AddProjectToolSheet";
import { ToolListCard } from "@/components/tools/list/ToolListCard";
import { ReturnToolSheet } from "@/components/tools/modals/ReturnToolSheet";
import { ReportToolProblemSheet } from "@/components/tools/modals/ReportToolProblemSheet";
import { useTools } from "@/lib/api/hooks/useTools";
import type { projectSchema } from "@/lib/api/schemas";

type Project = z.infer<typeof projectSchema>;

type ProjectToolsTabProps = {
  projectId: string;
  project: Project;
  readOnly?: boolean;
};

export function ProjectToolsTab({ projectId, project, readOnly = false }: ProjectToolsTabProps) {
  const toolsQuery = useTools({ projectId, pageSize: 100 });
  const projectTools = toolsQuery.data?.items ?? [];

  const [addOpen, setAddOpen] = useState(false);
  const [returnToolId, setReturnToolId] = useState<string | null>(null);
  const [problemToolId, setProblemToolId] = useState<string | null>(null);

  if (toolsQuery.isLoading) return <LoadingSkeleton rows={4} />;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="truncate text-[14px] font-medium text-slate-500">
            Инструменты на объекте
          </h2>
          <SectionCountBadge count={projectTools.length} />
        </div>
        {!readOnly ? (
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#111827] px-3 py-1 text-[12px] md:text-[14px] font-medium text-white hover:bg-gray-800"
          >
            <Plus className="h-3 w-3" />
            Добавить
          </button>
        ) : null}
      </div>

      {projectTools.length === 0 ? (
        <div className="rounded-[12px] border border-dashed border-[#F0F0F0] bg-white px-4 py-8 text-center text-[12px] md:text-[14px] text-slate-500">
          Нет инструментов на объекте
        </div>
      ) : (
        <ul className="space-y-3">
          {projectTools.map((tool) => (
            <li key={tool.id}>
              <ToolListCard
                tool={tool}
                hideProjectName
                className="rounded-[12px] border-[#F0F0F0]"
                onReturn={readOnly ? undefined : setReturnToolId}
                onProblem={readOnly ? undefined : setProblemToolId}
              />
            </li>
          ))}
        </ul>
      )}

      <AddProjectToolSheet
        projectId={projectId}
        project={project}
        open={addOpen}
        onOpenChange={setAddOpen}
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
    </div>
  );
}
