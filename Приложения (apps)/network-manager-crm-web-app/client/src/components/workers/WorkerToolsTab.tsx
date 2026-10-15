import { PageError } from "@/components/common/PageError";
import { SectionCountBadge } from "@/components/common/SectionCountBadge";
import { ToolListCard } from "@/components/tools/list/ToolListCard";
import { useTools } from "@/lib/api/hooks/useTools";

type WorkerToolsTabProps = {
  workerId: string;
};

function ToolCardSkeleton() {
  return <div className="h-32 animate-pulse rounded-[12px] border border-[#F0F0F0] bg-slate-100" />;
}

export function WorkerToolsTab({ workerId }: WorkerToolsTabProps) {
  const toolsQuery = useTools({ pageSize: 200 });

  if (toolsQuery.isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <h2 className="text-[14px] font-medium text-slate-500">Инструменты у работника</h2>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <ToolCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (toolsQuery.isError) {
    return <PageError onRetry={() => toolsQuery.refetch()} />;
  }

  const tools = (toolsQuery.data?.items ?? []).filter(
    (tool) => tool.activeAssignment?.responsibleUserId === workerId,
  );

  return (
    <div className="space-y-3">
      <div className="flex min-w-0 items-center gap-2 px-1">
        <h2 className="truncate text-[14px] font-medium text-slate-500">
          Инструменты у работника
        </h2>
        <SectionCountBadge count={tools.length} />
      </div>

      {tools.length === 0 ? (
        <div className="rounded-[12px] border border-dashed border-[#F0F0F0] bg-white px-4 py-8 text-center text-[12px] md:text-[14px] text-slate-500">
          Нет инструментов
        </div>
      ) : (
        <ul className="space-y-3">
          {tools.map((tool) => (
            <li key={tool.id}>
              <ToolListCard tool={tool} variant="workerDetail" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
