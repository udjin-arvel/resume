import { useMemo } from "react";
import { useTools } from "@/lib/api/hooks/useTools";
import { needsAttention } from "./toolCardDisplay";

export type ToolTabKey =
  | "all"
  | "available"
  | "on_project"
  | "attention"
  | "expired"
  | "decommissioned";

export function useToolTabCounts() {
  const allQuery = useTools({ pageSize: 100 });
  const availableQuery = useTools({ status: "available", pageSize: 1 });
  const assignedQuery = useTools({ status: "assigned", pageSize: 1 });
  const overdueQuery = useTools({ status: "overdue", pageSize: 1 });
  const writtenOffQuery = useTools({ status: "written_off", pageSize: 1 });

  const allTools = allQuery.data?.items ?? [];

  return useMemo(
    () => ({
      all: allQuery.data?.total ?? allTools.length,
      available: availableQuery.data?.total ?? 0,
      on_project: assignedQuery.data?.total ?? 0,
      attention: allTools.filter(needsAttention).length,
      expired: overdueQuery.data?.total ?? 0,
      decommissioned: writtenOffQuery.data?.total ?? 0,
      isLoading:
        allQuery.isLoading ||
        availableQuery.isLoading ||
        assignedQuery.isLoading ||
        overdueQuery.isLoading ||
        writtenOffQuery.isLoading,
    }),
    [
      allQuery.data?.total,
      allQuery.isLoading,
      allTools,
      availableQuery.data?.total,
      availableQuery.isLoading,
      assignedQuery.data?.total,
      assignedQuery.isLoading,
      overdueQuery.data?.total,
      overdueQuery.isLoading,
      writtenOffQuery.data?.total,
      writtenOffQuery.isLoading,
    ],
  );
}
