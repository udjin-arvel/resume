import { useMemo } from "react";
import type { ToolDetail } from "@/lib/api/tools";
import { useDocuments } from "@/lib/api/hooks/useDocuments";
import { ToolAssignmentHistory } from "./ToolAssignmentHistory";
import { ToolDetailAccordions } from "./ToolDetailAccordions";
import { ToolDocumentsSection } from "./ToolDocumentsSection";
import { ToolPhotosSection } from "./ToolPhotosSection";

type ToolDetailSectionsProps = {
  tool: ToolDetail;
};

export function ToolDetailSections({ tool }: ToolDetailSectionsProps) {
  const docsQuery = useDocuments({ entityType: "tool", entityId: tool.id });

  const { photos, documents, calibrationDoc } = useMemo(() => {
    const all = docsQuery.data ?? [];
    const calDoc = all.find((d) => d.documentType === "calibration_certificate");
    return {
      photos: all
        .filter((d) => d.documentType === "photo")
        .map((d) => ({ id: d.id, filename: d.filename, mimeType: d.mimeType })),
      documents: all
        .filter((d) => d.documentType === "document")
        .map((d) => ({ id: d.id, filename: d.filename, mimeType: d.mimeType })),
      calibrationDoc: calDoc
        ? { id: calDoc.id, filename: calDoc.filename, mimeType: calDoc.mimeType }
        : null,
    };
  }, [docsQuery.data]);

  return (
    <div className="space-y-6">
      <ToolDetailAccordions tool={tool} calibrationDoc={calibrationDoc} />
      <ToolPhotosSection photos={photos} />
      <ToolDocumentsSection documents={documents} isLoading={docsQuery.isLoading} />
      {tool.assignmentHistory && tool.assignmentHistory.length > 0 ? (
        <ToolAssignmentHistory history={tool.assignmentHistory} />
      ) : null}
    </div>
  );
}
