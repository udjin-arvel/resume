import { ImageIcon } from "lucide-react";
import { DocumentImage, DocumentOpenLink } from "@/components/common/DocumentAccess";
import { SectionCountBadge } from "@/components/common/SectionCountBadge";

type PhotoDoc = { id: string; filename?: string; mimeType?: string };

type ToolPhotosSectionProps = {
  photos: PhotoDoc[];
};

export function ToolPhotosSection({ photos }: ToolPhotosSectionProps) {
  return (
    <section>
      <div className="mb-2 flex items-center gap-2 px-1">
        <h2 className="text-[14px] font-semibold text-slate-500">Фото</h2>
        <SectionCountBadge count={photos.length} />
      </div>
      {photos.length === 0 ? (
        <p className="px-1 text-[12px] md:text-[14px] text-slate-400">Нет фото</p>
      ) : (
        <div className="scrollbar-responsive flex gap-2 overflow-x-auto pb-1">
          {photos.map((photo) => (
            <DocumentOpenLink
              key={photo.id}
              documentId={photo.id}
              filename={photo.filename}
              mimeType={photo.mimeType}
              className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[12px] border border-slate-200 bg-slate-100"
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
      )}
    </section>
  );
}
