import { ImageIcon } from "lucide-react";
import { DocumentImage, DocumentOpenLink } from "@/components/common/DocumentAccess";
import { WorkerReportDetailSection as SupervisorReportDetailSection } from "../worker-report-detail/WorkerReportDetailSection";

type PhotoDoc = { id: string; filename?: string | null; mimeType?: string | null };

type SupervisorReportPhotosSectionProps = {
  photos: PhotoDoc[];
};

export function SupervisorReportPhotosSection({ photos }: SupervisorReportPhotosSectionProps) {
  if (photos.length === 0) return null;

  return (
    <section>
      <div className="mb-2 flex items-center gap-2">
        <h2 className="text-[14px] md:text-[16px] font-semibold text-slate-500">Фотофиксация</h2>
        <span className="inline-flex min-h-[16px] min-w-[20px] items-center justify-center rounded-full bg-[#90A1B9] px-1 text-white text-[10px] font-semibold text-slate-600">
          {photos.length}
        </span>
      </div>
      <div className="overflow-hidden rounded-[12px] border border-slate-200 bg-white p-3">
        <div className="scrollbar-responsive flex gap-2 overflow-x-auto pb-1">
          {photos.map((photo) => (
            <DocumentOpenLink
              key={photo.id}
              documentId={photo.id}
              filename={photo.filename ?? undefined}
              mimeType={photo.mimeType ?? undefined}
              className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[8px] bg-slate-100"
            >
              <DocumentImage
                documentId={photo.id}
                alt={photo.filename ?? "Фото"}
                className="h-full w-full object-cover"
                fallback={<ImageIcon className="h-6 w-6 text-slate-400" />}
              />
            </DocumentOpenLink>
          ))}
        </div>
      </div>
    </section>
  );
}
