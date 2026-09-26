import { useMemo, useState } from "react";
import type { z } from "zod";
import { Plus } from "lucide-react";
import { LoadingSkeleton } from "@/components/common/LoadingSpinner";
import { SectionCountBadge } from "@/components/common/SectionCountBadge";
import { useDocuments } from "@/lib/api/hooks/useDocuments";
import { useEstimate } from "@/lib/api/hooks/useEstimates";
import { useProjectWorkerDocuments } from "@/lib/api/hooks/useProjects";
import {
  PROJECT_DOCUMENT_CATEGORIES,
  normalizeProjectDocumentType,
} from "@/lib/constants/project-documents";
import type { projectSchema } from "@/lib/api/schemas";
import { AddProjectDocumentSheet } from "./AddProjectDocumentSheet";
import {
  ProjectDocumentAccordion,
  type ProjectDocumentFile,
} from "./ProjectDocumentAccordion";

type Project = z.infer<typeof projectSchema>;

type ProjectDocumentsTabProps = {
  projectId: string;
  project: Project;
  readOnly?: boolean;
};

export function ProjectDocumentsTab({
  projectId,
  project,
  readOnly = false,
}: ProjectDocumentsTabProps) {
  const [addOpen, setAddOpen] = useState(false);
  const docsQuery = useDocuments({ entityType: "project", entityId: projectId });
  const workerDocsQuery = useProjectWorkerDocuments(projectId);
  const linkedEstimateId = project.estimateId ?? "";
  const estimateQuery = useEstimate(linkedEstimateId);

  const groupedProjectDocs = useMemo(() => {
    const groups: Record<string, ProjectDocumentFile[]> = {
      estimate: [],
      instruction: [],
      general: [],
    };
    for (const doc of docsQuery.data ?? []) {
      const category = normalizeProjectDocumentType(doc.documentType);
      groups[category].push({ id: doc.id, filename: doc.filename, mimeType: doc.mimeType });
    }
    if (linkedEstimateId) {
      groups.estimate = [
        {
          id: `linked-estimate-${linkedEstimateId}`,
          filename: estimateQuery.data?.name?.trim() || "Смета",
          estimateId: linkedEstimateId,
        },
        ...groups.estimate,
      ];
    }
    return groups;
  }, [docsQuery.data, linkedEstimateId, estimateQuery.data?.name]);

  const projectDocCount = useMemo(
    () => Object.values(groupedProjectDocs).reduce((sum, items) => sum + items.length, 0),
    [groupedProjectDocs],
  );

  const workerGroups = useMemo(() => {
    const fromApi = workerDocsQuery.data ?? [];
    const apiByWorker = new Map(fromApi.map((g) => [g.workerId, g]));

    const workers = project.projectWorkers ?? [];
    if (workers.length > 0) {
      return workers.map((w) => {
        const existing = apiByWorker.get(w.userId);
        const workerName =
          existing?.workerName ||
          [w.firstName, w.lastName].filter(Boolean).join(" ").trim() ||
          "Работник";
        return {
          workerId: w.userId,
          workerName,
          documents: existing?.documents ?? [],
        };
      });
    }

    return fromApi;
  }, [workerDocsQuery.data, project.projectWorkers]);

  const workerDocCount = useMemo(
    () => workerGroups.reduce((sum, g) => sum + g.documents.length, 0),
    [workerGroups],
  );

  if (docsQuery.isLoading || workerDocsQuery.isLoading) {
    return <LoadingSkeleton rows={6} />;
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3 px-1">
          <div className="flex min-w-0 items-center gap-2">
            <h2 className="truncate text-[14px] font-medium text-slate-500">Документы проекта</h2>
            <SectionCountBadge count={projectDocCount} />
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

        <div className="space-y-3">
          {PROJECT_DOCUMENT_CATEGORIES.map(({ type, label }) => (
            <div key={type}>
              {type === "estimate" ? (
                <p className="mb-2 px-1 text-[11px] text-slate-400">
                  Документы этой категории видны только менеджерам и не передаются работникам
                  проекта
                </p>
              ) : null}
              <ProjectDocumentAccordion title={label} items={groupedProjectDocs[type]} />
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <h2 className="truncate text-[14px] font-medium text-slate-500">Документы работников</h2>
          <SectionCountBadge count={workerDocCount} />
        </div>

        {workerGroups.length === 0 ? (
          <div className="rounded-[12px] border border-dashed border-[#F0F0F0] bg-white px-4 py-8 text-center text-[12px] md:text-[14px] text-slate-500">
            Нет работников на проекте
          </div>
        ) : (
          <div className="space-y-3">
            {workerGroups.map((group) => (
              <ProjectDocumentAccordion
                key={group.workerId}
                title={group.workerName}
                items={group.documents.map((d) => ({ id: d.id, filename: d.filename }))}
                defaultOpen={group.documents.length > 0}
              />
            ))}
          </div>
        )}
      </section>

      <AddProjectDocumentSheet
        projectId={projectId}
        open={addOpen}
        onOpenChange={setAddOpen}
      />
    </div>
  );
}
